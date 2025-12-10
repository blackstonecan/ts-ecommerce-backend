"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Respond {
    constructor(success, statusCode, data, message) {
        this.success = success;
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}
exports.default = Respond;
