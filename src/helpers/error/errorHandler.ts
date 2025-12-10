import Response from "@/helpers/response/Response";
import CustomError from "@/helpers/error/CustomError";
import { NextFunction } from "express";

const repoErrorHandler = (error: any): Response<never> => {
    if (error instanceof CustomError) {
        return Response.getCustomError(error);
    }

    // Handle Prisma specific errors
    if (error.code === 'P2002') {
        return Response.getCustomError(
            CustomError.getWithMessage('Unique constraint violation', 400)
        );
    }
    if (error.code === 'P2003') {
        return Response.getCustomError(
            CustomError.getWithMessage('Foreign key constraint violation', 400)
        );
    }
    if (error.code === 'P2025') {
        return Response.getCustomError(
            CustomError.getWithMessage('Record not found', 404)
        );
    }

    return Response.getError(error);
}

const errorHandler = (error: any): Response<never> => {
    if (error instanceof CustomError) {
        return Response.getCustomError(error);
    }
    return Response.getError(error);
};

const controllerErrorHandler = (error: any, next: NextFunction) => {
    return next(errorHandler(error).error);
};


export {
    repoErrorHandler,
    errorHandler,
    controllerErrorHandler
}