import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import CustomError from '@/lib/error/CustomError';
import { orderRepo } from './order.repo';
import { CheckoutSchema, GetOrderParamsSchema } from './order.schema';
import { stripe } from '@/config/stripe';
import { IOrder, IOrderListItem } from './order.types';
import { logger } from '@/lib/common/logger';

export const checkoutHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let paymentIntent: any = null;
    let paymentIntentCanceled = false;

    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate request body
        const parseResult = CheckoutSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        logger.info('Checkout initiated', { userId, addressId: data.addressId });

        // Get cart to calculate total for Stripe PaymentIntent
        const cartResponse = await import('../cart/cart.repo').then(m => m.cartRepo.getCart(userId));
        if (!cartResponse.success) throw cartResponse.error;
        const cart = cartResponse.data!;

        if (cart.items.length === 0) {
            throw CustomError.getWithMessage('Cart is empty', 400);
        }

        // Create Stripe PaymentIntent
        paymentIntent = await stripe.paymentIntents.create({
            amount: cart.totalAmountCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: userId,
                addressId: data.addressId.toString(),
                expectedAmountCents: cart.totalAmountCents.toString()
            }
        });

        logger.debug('PaymentIntent created', {
            paymentIntentId: paymentIntent.id,
            amount: cart.totalAmountCents
        });

        // Create order in database with PENDING status
        // Pass expectedAmountCents to validate cart hasn't changed
        response = await orderRepo.createOrder(
            userId,
            data.addressId,
            paymentIntent.id,
            cart.totalAmountCents
        );

        if (!response.success) {
            // If order creation fails, cancel the PaymentIntent to avoid orphans
            logger.warn('Order creation failed, canceling PaymentIntent', {
                paymentIntentId: paymentIntent.id,
                error: response.error?.error.message
            });

            await stripe.paymentIntents.cancel(paymentIntent.id);
            paymentIntentCanceled = true;

            logger.info('PaymentIntent canceled successfully', {
                paymentIntentId: paymentIntent.id
            });

            throw response.error;
        }

        const { orderId } = response.data!;

        logger.info('Checkout successful', {
            userId,
            orderId,
            paymentIntentId: paymentIntent.id
        });

        // Return client secret for frontend to confirm payment
        res.status(201).json(new Respond(
            true,
            201,
            {
                clientSecret: paymentIntent.client_secret,
                orderId: orderId
            },
            'Order created successfully. Complete payment to confirm.'
        ));
    } catch (error: any) {
        // If we created a PaymentIntent but haven't canceled it yet, try to cancel
        if (paymentIntent && !paymentIntentCanceled) {
            try {
                await stripe.paymentIntents.cancel(paymentIntent.id);
                logger.info('PaymentIntent canceled due to error', {
                    paymentIntentId: paymentIntent.id,
                    error: error.message
                });
            } catch (cancelError) {
                // Log but don't throw - the main error is more important
                logger.error('Failed to cancel PaymentIntent after error', {
                    paymentIntentId: paymentIntent.id
                });
            }
        }

        controllerErrorHandler(error, next);
    }
});

export const getOrderHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IOrder;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const paramsResult = GetOrderParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Get order
        response = await orderRepo.getOrder(params.orderId, userId);
        if (!response.success) throw response.error;

        output = response.data as IOrder;

        res.status(200).json(new Respond(true, 200, output, 'Order fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const listOrdersHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IOrderListItem[];

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // List user's orders
        response = await orderRepo.listUserOrders(userId);
        if (!response.success) throw response.error;

        output = response.data as IOrderListItem[];

        res.status(200).json(new Respond(true, 200, output, 'Orders fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});
