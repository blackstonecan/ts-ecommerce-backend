import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { IAddressItem } from './address.types';
import { addressRepo } from './address.repo';

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