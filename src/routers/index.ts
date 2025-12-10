import express, { Router } from "express";

import Response from "@/lib/response/Response";

import { categoryRouter } from "@/lib/category";
import { productRouter } from "@/lib/product";
import { locationRouter } from "@/lib/location";
import { userRouter } from "@/lib/user";
import { requireAuth } from "@/middlewares/auth";

const router: Router = express.Router();

router.get("/test", async (req, res) => {
  let response: Response<any>;

  try {
    res.send("Test route is working!");
  } catch (error) {
    res.status(500).send(error);
  }
});

// Health check route
router.get("/health", async (req, res) => {
  res.send("Server is running");
});

router.use("/category", categoryRouter);
router.use("/product", productRouter);
router.use("/location", locationRouter);

router.use("/user", requireAuth, userRouter);

export default router;