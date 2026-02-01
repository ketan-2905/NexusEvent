
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { wrapAsync } from "../utils/expressError.js";
import { staffLogin, getStaffMe } from "../controllers/staff.controller.js";

const router = express.Router();

router.post("/login", wrapAsync(staffLogin));
router.get("/me", verifyToken, wrapAsync(getStaffMe));

// Staff-specific data access (Bypasses Admin ownership checks by validating Staff Event ID)
import { getStaffEvent, getStaffCheckpoints, validateQR } from "../controllers/staff.controller.js";
router.get("/events/:eventId", verifyToken, wrapAsync(getStaffEvent));
router.get("/events/:eventId/checkpoints", verifyToken, wrapAsync(getStaffCheckpoints));
router.post("/validate", verifyToken, wrapAsync(validateQR));

export default router;
