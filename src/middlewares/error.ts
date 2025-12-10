import { Request, Response, NextFunction } from "express";

import Respond from "@/lib/response/Respond";
import CustomError from "@/lib/error/CustomError";

import { IS_PRODUCTION } from "@/config/env";

const customErrorHandler = async (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    try {
        if (!IS_PRODUCTION) console.log(err);

        const message = err.error ? err.error.message : "An unexpected error occurred";
        const status = err.status || 500;

        res.status(status).json(new Respond(false, status, null, message));
    } catch (error) {
        console.error("Error in custom error handler:", error);
        res.status(500).json(new Respond(false, 500, null, "Internal Server Error"));
    }
};

export { customErrorHandler };