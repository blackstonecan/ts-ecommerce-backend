"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const prisma_1 = require("./config/prisma");
const env_1 = require("./config/env");
const routers_1 = __importDefault(require("./routers"));
// import { customErrorHandler } from "./middlewares/customErrorHandler";
const app = (0, express_1.default)();
const corsOptions = {
    origin: "*",
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
// Apply security headers
app.use((0, helmet_1.default)());
// Middleware to handle JSON requests
app.use(express_1.default.json({ limit: "20mb" }));
// Middleware to handle URL-encoded requests
app.use((0, cookie_parser_1.default)());
// Middleware to handle URL-encoded requests
app.use("/", routers_1.default);
// Middleware to handle static files
// app.use(customErrorHandler);
app.listen(env_1.env.PORT, () => console.log(`Server is running on port ${env_1.env.PORT} in ${env_1.IS_PRODUCTION ? "production" : "development"} mode`));
// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("SIGINT received: closing Prisma connection...");
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    console.log("SIGTERM received: closing Prisma connection...");
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
