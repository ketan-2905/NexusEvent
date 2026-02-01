import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getParticipantStatus, getLiveStatus } from "../controllers/status.controller.js";
import { wrapAsync } from "../utils/expressError.js";

const router = express.Router();

router.get("/participant-status/:token/:checkpointId", verifyToken, wrapAsync(getParticipantStatus));
router.get("/live-status", verifyToken, wrapAsync(getLiveStatus));

export default router;

