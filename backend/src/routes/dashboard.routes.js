import express from "express";
import { verifyToken, isSuperAdmin } from "../middleware/auth.js";
// import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { wrapAsync } from "../utils/expressError.js";
import { getRecentScans, getRegistrationDeskStats } from "../controllers/new-dashboardController.js";

const router = express.Router();

router.get("/dashboard-stats", verifyToken, isSuperAdmin, wrapAsync(getRegistrationDeskStats));
router.get("/recent-scans", verifyToken, isSuperAdmin, wrapAsync(getRecentScans));

export default router;

