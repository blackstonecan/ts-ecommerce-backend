import express, { Router } from "express";
import Response from "@/helpers/response/Response";

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


export default router;