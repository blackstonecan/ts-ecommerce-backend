import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { ICountryExtended } from './location.types';
import { locationRepo } from './location.repo';

export const getAllHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICountryExtended[];

        // Fetch locations
        response = await locationRepo.listAll();
        if (!response.success) throw response.error;

        output = response.data as ICountryExtended[];

        res.status(200).json(new Respond(true, 200, output, 'Locations fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});