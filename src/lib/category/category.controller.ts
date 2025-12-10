import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { ICategory, ICategoryWithProducts } from './category.types';
import { categoryRepo } from './category.repo';
import { GetCategoryWithProductsSchema } from './category.schema';
import CustomError from '../error/CustomError';

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

export const getCategoryWithProductsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICategoryWithProducts;

        // Get slug from path parameters
        const parseResult = GetCategoryWithProductsSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Fetch categories
        response = await categoryRepo.getWithProducts(data.slug);
        if (!response.success) {
            if (response.error?.status === 404) return next();
            else throw response.error;
        }

        output = response.data as ICategoryWithProducts;

        res.status(200).json(new Respond(true, 200, output, 'Category with products fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});