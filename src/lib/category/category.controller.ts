import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { ICategory } from './category.types';
import { categoryRepo } from './category.repo';

export const getCategoriesHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICategory[];

        // Fetch categories
        response = await categoryRepo.list();
        if (!response.success) throw response.error;

        output = response.data as ICategory[];

        res.status(200).json(new Respond(true, 200, output, 'Categories fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});