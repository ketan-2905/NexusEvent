import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { scanQR } from "../controllers/scan.controller.js";
import { wrapAsync } from "../utils/expressError.js";

const router = express.Router();

router.post("/", verifyToken, wrapAsync(scanQR));

export default router;

