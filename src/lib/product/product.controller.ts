import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { IProduct, IProductForAdmin, IProductItem } from './product.types';
import { GetProductForAdminSchema, GetProductSchema, GetProductsSchema } from './product.schema';
import CustomError from '../error/CustomError';
import { productRepo } from './product.repo';

export const getProductsHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IProductItem[];

        // Get categoryId from query parameters (if any)
        const parseResult = GetProductsSchema.safeParse(req.query);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Fetch products
        response = await productRepo.list(data.categoryId);
        if (!response.success) throw response.error;

        output = response.data as IProductItem[];

        res.status(200).json(new Respond(true, 200, output, 'Products fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getProductHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IProduct;

        // Get slug from path parameters
        const parseResult = GetProductSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Fetch product
        response = await productRepo.getBySlug(data.slug);
        if (!response.success) {
            if (response.error?.status === 404) return next();
            else throw response.error;
        }

        output = response.data as IProduct;

        res.status(200).json(new Respond(true, 200, output, 'Product fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const getProductForAdminHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: IProductForAdmin;

        // Get id from path parameters
        const parseResult = GetProductForAdminSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Fetch product
        response = await productRepo.getById(data.id);
        if (!response.success) {
            if (response.error?.status === 404) return next();
            else throw response.error;
        }

        output = response.data as IProductForAdmin;

        res.status(200).json(new Respond(true, 200, output, 'Product fetched successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});