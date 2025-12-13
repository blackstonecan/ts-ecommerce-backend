import { Request, Response, NextFunction } from "express";
import expressAsyncHandler from "express-async-handler";

import { prisma } from "@/config/prisma";
import { controllerErrorHandler } from "@/lib/error/errorHandler";
import CustomError from "@/lib/error/CustomError";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/config/stripe";
import { orderRepo } from "../order/order.repo";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export const stripeWebhookHandler = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sig = req.headers["stripe-signature"];

        if (!sig || typeof sig !== "string") {
            throw CustomError.getWithMessage("Missing stripe-signature header", 400);
        }

        let event: any;
        try {
            // IMPORTANT: req.body MUST be raw buffer (express.raw on this route)
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            throw CustomError.getWithMessage(`Webhook signature verification failed: ${err.message}`, 400);
        }

        // We only care about these. Everything else should return 200 to stop Stripe retries.
        if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
            res.status(200).json({ received: true });
            return;
        }

        const paymentIntent = event.data.object as any;

        // Find payment -> order (single DB read)
        const payment = await prisma.payment.findFirst({
            where: { providerPaymentId: paymentIntent.id },
            select: {
                id: true,
                status: true,
                orderId: true,
                order: { select: { status: true } },
            },
        });

        // IMPORTANT: don't throw here, or Stripe will retry forever
        if (!payment) {
            console.warn("Stripe webhook: payment not found for intent", paymentIntent.id);
            res.status(200).json({ received: true });
            return;
        }

        // --- SUCCESS ---
        if (event.type === "payment_intent.succeeded") {
            // If order not pending (expired timeout etc.) -> REFUND
            if (payment.order.status !== OrderStatus.PENDING) {
                // Avoid double refunds if webhook retries
                if (payment.status !== PaymentStatus.REFUNDED) {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentIntent.id,
                    });

                    // Mark DB as refunded (and optionally store refund id if your schema supports it)
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: PaymentStatus.REFUNDED,
                            // If you have a column for this, uncomment:
                            // providerRefundId: refund.id,
                            errorMessage: "Auto-refund: payment succeeded after order was canceled/expired",
                        },
                    });

                    console.warn("Stripe webhook: refunded intent because order was canceled", {
                        paymentIntentId: paymentIntent.id,
                        refundId: refund.id,
                        orderId: payment.orderId,
                    });
                }

                res.status(200).json({ received: true });
                return;
            }

            // Normal flow: confirm only if still pending
            const r = await orderRepo.confirmOrder(payment.orderId);
            if (!r.success) throw r.error;

            res.status(200).json({ received: true });
            return;
        }

        // --- FAILED ---
        if (event.type === "payment_intent.payment_failed") {
            const errorMessage: string | undefined = paymentIntent.last_payment_error?.message;

            const r = await orderRepo.failOrder(payment.orderId, errorMessage);
            if (!r.success) throw r.error;

            res.status(200).json({ received: true });
            return;
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});
