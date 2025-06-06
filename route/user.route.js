import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  writeReview,
  getFeaturedFarms,
} from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import {
  getAllFarm,
  getFarmById,
  getProductByCategory,
} from "../controller/seller.controller.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch(
  "/update-profile",
  protect,
  upload.single("avatar"),
  updateProfile
);
router.post("/change-password", protect, changePassword);

router.get("/all-farm", getAllFarm);
router.get("/farm/:farmId", getFarmById);
router.get("/product-by-category/:categoryId", getProductByCategory);
router.get("/featured-farms", getFeaturedFarms);
router.post("/write-review", protect, writeReview);

export default router;
