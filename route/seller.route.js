import express from "express";
import {
  applySeller,
  getAllCategories,
} from "../controller/seller.controller.js";
import upload from "../middleware/multer.middleware.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/apply", protect, upload.array("media"), applySeller);
router.get("/categories", protect, getAllCategories);

export default router;
