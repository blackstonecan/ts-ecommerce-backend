"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/test", async (req, res) => {
    let response;
    try {
        res.send("Test route is working!");
    }
    catch (error) {
        res.status(500).send(error);
    }
});
// Health check route
router.get("/health", async (req, res) => {
    res.send("Server is running");
});
exports.default = router;
