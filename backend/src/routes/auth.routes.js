import express from "express";
import { login, signup, verifyEmail, resendCode, getMe, updateProfile } from "../controllers/auth.controller.js";
import { wrapAsync } from "../utils/expressError.js";
import { verifyToken } from "../middleware/auth.js";
import { staffLogin } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", wrapAsync(signup));
router.post("/login", wrapAsync(login));
router.post("/verify-email", wrapAsync(verifyEmail));
router.post("/resend-code", wrapAsync(resendCode));
router.get("/me", verifyToken, wrapAsync(getMe));
router.put("/profile", verifyToken, wrapAsync(updateProfile));
router.post("/staff-login", wrapAsync(staffLogin));

export default router;

