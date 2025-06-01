import express from "express";
import { getProfile, updateProfile } from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch("/profile", protect, upload.single("avatar"), updateProfile);

export default router;
