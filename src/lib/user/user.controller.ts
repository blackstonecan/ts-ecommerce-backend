import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { IUser } from './user.types';

export const getMeHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let output: IUser;

        if (!req.user) throw CustomResponse.getMessageError('Unauthorized', 401);

        const userId = req.user.userId;
        const role = req.user.role;

        output = {
            userId,
            role
        } as IUser;

        res.status(200).json(new Respond(true, 200, output, 'User fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});