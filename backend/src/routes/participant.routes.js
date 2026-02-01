import express from "express";
import { verifyToken, isSuperAdmin, isShowadmin } from "../middleware/auth.js";
import { getAllParticipants } from "../controllers/participant.controller.js";
import { wrapAsync } from "../utils/expressError.js";
import { getParticipantsByCheckpoint } from "../controllers/participants-with-checkpoints.controller.js";

const router = express.Router();

router.get("/", verifyToken, isSuperAdmin, wrapAsync(getAllParticipants));
router.get("/with-checkpoints", verifyToken, isShowadmin, wrapAsync(getParticipantsByCheckpoint));

export default router;

