import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import CustomError from '@/lib/error/CustomError';
import { ICart } from './cart.types';
import { cartRepo } from './cart.repo';
import {
    AddToCartSchema,
    UpdateCartItemParamsSchema,
    UpdateCartItemBodySchema,
    RemoveCartItemParamsSchema
} from './cart.schema';

export const getCartHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICart;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Fetch user's cart
        response = await cartRepo.getCart(userId);
        if (!response.success) throw response.error;

        output = response.data as ICart;

        res.status(200).json(new Respond(true, 200, output, 'Cart fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const addCartItemHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate request body
        const parseResult = AddToCartSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add to cart
        response = await cartRepo.addCartItem(userId, data);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Item added to cart successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateCartItemHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const paramsResult = UpdateCartItemParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateCartItemBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update cart item
        response = await cartRepo.updateCartItem(params.itemId, userId, body.quantity);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Cart item updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const removeCartItemHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const parseResult = RemoveCartItemParamsSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const params = parseResult.data;

        // Remove cart item
        response = await cartRepo.removeCartItem(params.itemId, userId);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Cart item removed successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const clearCartHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Clear cart
        response = await cartRepo.clearCart(userId);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Cart cleared successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});
