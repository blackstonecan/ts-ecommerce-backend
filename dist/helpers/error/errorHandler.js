"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controllerErrorHandler = exports.errorHandler = exports.repoErrorHandler = void 0;
const Response_1 = __importDefault(require("@/helpers/response/Response"));
const CustomError_1 = __importDefault(require("@/helpers/error/CustomError"));
const repoErrorHandler = (error) => {
    if (error instanceof CustomError_1.default) {
        return Response_1.default.getCustomError(error);
    }
    // Handle Prisma specific errors
    if (error.code === 'P2002') {
        return Response_1.default.getCustomError(CustomError_1.default.getWithMessage('Unique constraint violation', 400));
    }
    if (error.code === 'P2003') {
        return Response_1.default.getCustomError(CustomError_1.default.getWithMessage('Foreign key constraint violation', 400));
    }
    if (error.code === 'P2025') {
        return Response_1.default.getCustomError(CustomError_1.default.getWithMessage('Record not found', 404));
    }
    return Response_1.default.getError(error);
};
exports.repoErrorHandler = repoErrorHandler;
const errorHandler = (error) => {
    if (error instanceof CustomError_1.default) {
        return Response_1.default.getCustomError(error);
    }
    return Response_1.default.getError(error);
};
exports.errorHandler = errorHandler;
const controllerErrorHandler = (error, next) => {
    return next(errorHandler(error).error);
};
exports.controllerErrorHandler = controllerErrorHandler;
