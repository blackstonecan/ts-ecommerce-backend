"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomError {
    constructor(error, status = 500) {
        this.error = error;
        this.status = status;
    }
    static getWithMessage(errorText, status = 500) {
        return new CustomError(new Error(errorText), status);
    }
    static getDefault() {
        return new CustomError(new Error("An error occurred"), 500);
    }
}
exports.default = CustomError;
