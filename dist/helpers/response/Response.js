"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = __importDefault(require("@/helpers/error/CustomError"));
class Response {
    constructor(success, data, error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
    static getSuccess(data) {
        return new Response(true, data, null);
    }
    static getError(err, status) {
        return new Response(false, null, new CustomError_1.default(err, status));
    }
    static getCustomError(err) {
        return new Response(false, null, err);
    }
    static getMessageError(message, status) {
        return new Response(false, null, CustomError_1.default.getWithMessage(message, status));
    }
}
exports.default = Response;
