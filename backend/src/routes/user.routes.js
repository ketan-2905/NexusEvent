import express from "express";
import { verifyToken, isSuperAdmin, isShowadmin } from "../middleware/auth.js";
import { wrapAsync } from "../utils/expressError.js";
import { getEmailConfig, updateEmailConfig } from "../controllers/user.controller.js";


const router = express.Router();

router.put("/email-config", verifyToken, isSuperAdmin, wrapAsync(updateEmailConfig));
router.get("/email-config", verifyToken, isShowadmin, wrapAsync(getEmailConfig));

export default router;

