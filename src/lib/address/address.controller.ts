import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { IAddressItem, IAddress } from './address.types';
import { addressRepo } from './address.repo';
import {
    GetAddressParamsSchema,
    AddAddressSchema,
    UpdateAddressParamsSchema,
    UpdateAddressBodySchema,
    DeleteAddressParamsSchema
} from './address.schema';
import CustomError from '../error/CustomError';

export const getUserAddressesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IAddressItem[];

        if (!req.user) throw CustomResponse.getMessageError('Unauthorized', 401);

        const userId = req.user.userId;

        // Fetch addresses
        response = await addressRepo.listUserAddresses(userId);
        if (!response.success) throw response.error;

        output = response.data as IAddressItem[];

        res.status(200).json(new Respond(true, 200, output, 'Addresses fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getAddressHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IAddress;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const paramsResult = GetAddressParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Fetch address with ownership check
        response = await addressRepo.getAddress(params.id, userId);
        if (!response.success) throw response.error;

        output = response.data as IAddress;

        res.status(200).json(new Respond(true, 200, output, 'Address fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const addAddressHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate request body
        const parseResult = AddAddressSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Add address via repo
        response = await addressRepo.addAddress(userId, data);
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Address added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateAddressHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const paramsResult = UpdateAddressParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateAddressBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update address via repo (with ownership check)
        response = await addressRepo.updateAddress(params.id, userId, body);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Address updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteAddressHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        if (!req.user) throw CustomError.getWithMessage('Unauthorized', 401);

        const userId = req.user.userId;

        // Validate path parameters
        const parseResult = DeleteAddressParamsSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const params = parseResult.data;

        // Delete address via repo (with ownership check)
        response = await addressRepo.deleteAddress(params.id, userId);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Address deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});