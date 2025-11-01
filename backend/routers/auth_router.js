import express from "express";
import {
  delete_account, register, edit_user, login, logout, verify_email,
  resend_verification_email, change_password, get_status,
  forgot_password, reset_password
} from "../controllers/auth_controller.js";

import { verify_token } from "../middleware/verify_token.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/edit", verify_token, edit_user);
router.get("/logout", logout);
router.delete("/me", verify_token, delete_account);
router.get("/status", verify_token, get_status);
router.get("/verify-email", verify_email);
router.post("/resend-verification", resend_verification_email);
router.post("/change-password", verify_token, change_password);
router.post("/forgot-password", forgot_password);
router.post("/reset-password/:token", reset_password);

export default router;