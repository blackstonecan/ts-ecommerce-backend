import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';

import Respond from '@/lib/response/Respond';
import CustomResponse from '@/lib/response/Response';
import { controllerErrorHandler } from '@/lib/error/errorHandler';
import { IProduct, IProductForAdmin, IProductItem } from './product.types';
import { GetProductForAdminSchema, GetProductSchema, GetProductsSchema, AddProductSchema, UpdateProductParamsSchema, UpdateProductBodySchema, DeleteProductParamsSchema, UpdateStockParamsSchema, UpdateStockBodySchema } from './product.schema';
import CustomError from '../error/CustomError';
import { productRepo } from './product.repo';
import { productService } from './product.service';

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

export const addProductHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate request body
        const parseResult = AddProductSchema.safeParse(req.body);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const data = parseResult.data;

        // Check if files are provided
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || !files.mainImage || files.mainImage.length === 0) {
            throw CustomError.getWithMessage('Main image is required', 400);
        }

        const mainImageFile = files.mainImage[0];
        const additionalImagesFiles = files.images || [];

        // Create product via service
        response = await productService.addProduct({
            name: data.name,
            description: data.description,
            amountCents: data.amountCents,
            stock: data.stock,
            categoryId: data.categoryId,
            mainImageFile: mainImageFile,
            additionalImagesFiles: additionalImagesFiles
        });
        if (!response.success) throw response.error;

        res.status(201).json(new Respond(true, 201, null, 'Product added successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateProductHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateProductParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateProductBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Get files if provided
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const mainImageFile = files?.mainImage?.[0];
        const additionalImagesFiles = files?.images || [];

        // Update product via service
        response = await productService.updateProduct({
            id: params.id,
            name: body.name,
            description: body.description,
            amountCents: body.amountCents,
            stock: body.stock,
            categoryId: body.categoryId,
            mainImageFile: mainImageFile,
            additionalImagesFiles: additionalImagesFiles,
            imageIdsToRemove: body.imageIdsToRemove
        });
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Product updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const deleteProductHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const parseResult = DeleteProductParamsSchema.safeParse(req.params);
        if (!parseResult.success) throw CustomError.getWithMessage(parseResult.error.message, 400);
        const params = parseResult.data;

        // Delete product via service
        response = await productService.deleteProduct(params.id);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Product deleted successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});

export const updateStockHandler = expressAsyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let response: CustomResponse<any>;

        // Validate path parameters
        const paramsResult = UpdateStockParamsSchema.safeParse(req.params);
        if (!paramsResult.success) throw CustomError.getWithMessage(paramsResult.error.message, 400);
        const params = paramsResult.data;

        // Validate request body
        const bodyResult = UpdateStockBodySchema.safeParse(req.body);
        if (!bodyResult.success) throw CustomError.getWithMessage(bodyResult.error.message, 400);
        const body = bodyResult.data;

        // Update stock via repo
        response = await productRepo.updateStock(params.id, body.stock);
        if (!response.success) throw response.error;

        res.status(200).json(new Respond(true, 200, null, 'Product stock updated successfully'));
    } catch (error: any) {
        controllerErrorHandler(error, next);
    }
});