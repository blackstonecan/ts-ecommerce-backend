import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { ICategory, ICategoryWithProducts } from './category.types';
import { categoryService } from './category.service';
import { GetCategoryWithProductsSchema, AddCategorySchema, UpdateCategoryParamsSchema, UpdateCategoryBodySchema, DeleteCategoryParamsSchema } from './category.schema';
import CustomError from '../error/CustomError';
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

        // Fetch category with products
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

export const addCategoryHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICategory;

        // Validate request body
        const parseResult = AddCategorySchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Check if image file is provided
        if (!req.file) throw CustomError.getWithMessage('Category image is required', 400);

        // Create category via service
        response = await categoryService.createCategory({
            name: data.name,
            file: req.file
        });
        if (!response.success) throw response.error;

        output = response.data as ICategory;

        res.status(201).json(new Respond(true, 201, output, 'Category added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateCategoryHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;
        let output: ICategory;

        // Validate path parameters
        const paramsResult = UpdateCategoryParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateCategoryBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update category via service
        response = await categoryService.updateCategory({
            id: params.id,
            name: body.name,
            file: req.file
        });
        if (!response.success) throw response.error;

        output = response.data as ICategory;

        res.status(200).json(new Respond(true, 200, output, 'Category updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteCategoryHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const parseResult = DeleteCategoryParamsSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const params = parseResult.data;

        // Delete category via service
        response = await categoryService.deleteCategory(params.id);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Category deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});
