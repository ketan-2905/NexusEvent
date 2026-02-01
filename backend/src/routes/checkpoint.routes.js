import express from "express";
import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
import {
  createCheckpoint,
  getAllCheckpoints,
  updateCheckpoint,
  deleteCheckpoint,
  sendCheckpointEmails
} from "../controllers/checkpoint.controller.js";
import { getCheckpointStats } from "../controllers/stats.controller.js";
import { wrapAsync } from "../utils/expressError.js";
import { validateExit } from "../controllers/validate-exit.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", verifyToken, wrapAsync(createCheckpoint));
router.get("/", verifyToken, wrapAsync(getAllCheckpoints));
router.patch("/validate-exit/:id", verifyToken, wrapAsync(validateExit)); // Keep/remove superadmin? Maybe staff needs this.
router.put("/:id", verifyToken, wrapAsync(updateCheckpoint));
router.delete("/:id", verifyToken, wrapAsync(deleteCheckpoint));
router.post("/:id/send-emails", verifyToken, wrapAsync(sendCheckpointEmails));
router.get("/:checkpointId/stats", verifyToken, wrapAsync(getCheckpointStats));

export default router;

