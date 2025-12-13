import { Request, Response, NextFunction } from "express";
import expressAsyncHandler from "express-async-handler";

import { prisma } from "@/config/prisma";
import { controllerErrorHandler } from "@/lib/error/errorHandler";
import CustomError from "@/lib/error/CustomError";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/config/stripe";
import { orderRepo } from "../order/order.repo";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { logger } from "@/lib/common/logger";
import { sanitizePaymentError } from "@/lib/common/sanitize";

export const stripeWebhookHandler = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sig = req.headers["stripe-signature"];

        if (!sig || typeof sig !== "string") {
            logger.warn('Webhook received without signature');
            throw CustomError.getWithMessage("Missing stripe-signature header", 400);
        }

        let event: any;
        try {
            // IMPORTANT: req.body MUST be raw buffer (express.raw on this route)
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            logger.error('Webhook signature verification failed', { error: err.message });
            throw CustomError.getWithMessage(`Webhook signature verification failed: ${err.message}`, 400);
        }

        logger.info('Stripe webhook received', {
            eventType: event.type,
            eventId: event.id
        });

        // We only care about these. Everything else should return 200 to stop Stripe retries.
        if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
            logger.debug('Webhook event ignored - not payment related', { eventType: event.type });
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
                order: { select: { status: true, userId: true } },
            },
        });

        // IMPORTANT: don't throw here, or Stripe will retry forever
        if (!payment) {
            logger.warn("Webhook payment not found", {
                paymentIntentId: paymentIntent.id,
                eventType: event.type
            });
            res.status(200).json({ received: true });
            return;
        }

        logger.debug('Payment found for webhook', {
            paymentId: payment.id,
            orderId: payment.orderId,
            orderStatus: payment.order.status,
            paymentStatus: payment.status
        });

        // --- SUCCESS ---
        if (event.type === "payment_intent.succeeded") {
            logger.info('Payment succeeded webhook', {
                paymentIntentId: paymentIntent.id,
                orderId: payment.orderId,
                orderStatus: payment.order.status
            });

            // If order not pending (expired timeout etc.) -> REFUND
            if (payment.order.status !== OrderStatus.PENDING) {
                logger.warn('Payment succeeded but order not pending - initiating refund', {
                    orderId: payment.orderId,
                    orderStatus: payment.order.status,
                    paymentIntentId: paymentIntent.id
                });

                // Avoid double refunds if webhook retries
                if (payment.status !== PaymentStatus.REFUNDED) {
                    const refund = await stripe.refunds.create({
                        payment_intent: paymentIntent.id,
                    });

                    // Mark DB as refunded
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: PaymentStatus.REFUNDED,
                            errorMessage: "Auto-refund: payment succeeded after order was canceled/expired",
                        },
                    });

                    logger.info("Refund issued successfully", {
                        paymentIntentId: paymentIntent.id,
                        refundId: refund.id,
                        orderId: payment.orderId,
                        orderStatus: payment.order.status
                    });
                }

                res.status(200).json({ received: true });
                return;
            }

            // Normal flow: confirm only if still pending
            const r = await orderRepo.confirmOrder(payment.orderId);
            if (!r.success) {
                logger.error('Failed to confirm order after payment success', {
                    orderId: payment.orderId,
                    error: r.error?.error.message
                });
                throw r.error;
            }

            logger.info('Order confirmed after payment success', {
                orderId: payment.orderId,
                userId: payment.order.userId
            });

            res.status(200).json({ received: true });
            return;
        }

        // --- FAILED ---
        if (event.type === "payment_intent.payment_failed") {
            const rawErrorMessage: string | undefined = paymentIntent.last_payment_error?.message;
            const errorCode: string | undefined = paymentIntent.last_payment_error?.code;

            logger.info('Payment failed webhook', {
                paymentIntentId: paymentIntent.id,
                orderId: payment.orderId,
                errorCode,
                rawError: rawErrorMessage
            });

            // Sanitize error message to prevent sensitive info leakage
            const sanitizedError = sanitizePaymentError(rawErrorMessage, errorCode);

            logger.debug('Error message sanitized', {
                original: rawErrorMessage,
                sanitized: sanitizedError
            });

            const r = await orderRepo.failOrder(payment.orderId, sanitizedError);
            if (!r.success) {
                logger.error('Failed to fail order after payment failure', {
                    orderId: payment.orderId,
                    error: r.error?.error.message
                });
                throw r.error;
            }

            logger.info('Order failed after payment failure', {
                orderId: payment.orderId,
                userId: payment.order.userId,
                sanitizedError
            });

            res.status(200).json({ received: true });
            return;
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Webhook handler error', {
            error: error.message,
            stack: error.stack
        });
        controllerErrorHandler(error, next);
    }
});
