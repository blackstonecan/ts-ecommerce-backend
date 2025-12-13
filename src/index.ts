import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { prisma } from "./config/prisma";
import { env, IS_PRODUCTION } from "./config/env";

import router from "./routers";
import { stripeRouter } from "./lib/stripe";

import { customErrorHandler } from "./middlewares/error";
import { initCronJobs } from "./jobs/cron";

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));

// Apply security headers
app.use(helmet());

app.use('/stripe', stripeRouter); 

// Middleware to handle JSON requests
app.use(express.json({ limit: "20mb" }));

// Middleware to handle URL-encoded requests
app.use(cookieParser());

// Middleware to handle URL-encoded requests
app.use("/", router);

// Middleware to handle static files
app.use(customErrorHandler);

initCronJobs();

app.listen(env.PORT, () =>
  console.log(
    `Server is running on port ${env.PORT} in ${
      IS_PRODUCTION ? "production" : "development"
    } mode`
  )
);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("SIGINT received: closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received: closing Prisma connection...");
  await prisma.$disconnect();
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