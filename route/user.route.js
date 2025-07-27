import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  writeReview,
  writeReviewWebsite,
  getReviews,
  postcountClick,
} from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { getAllFarm, getFarmById, getProductByCategory, getSingleProduct } from "../controller/seller.controller.js";
import { contactUs } from "../controller/contactUs.controller.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch(
  "/update-profile",
  protect,
  upload.single("avatar"),
  updateProfile
);
router.post("/change-password", protect, changePassword);

router.get("/product/:productId", getSingleProduct)

router.get("/all-farm", getAllFarm)
router.get("/farm/:farmId", getFarmById)
router.get("/product-by-category/:categoryId", getProductByCategory)
router.post("/write-review",protect,writeReview)


router.post("/write-review-website",protect,writeReviewWebsite)
router.get("/get-review-website",getReviews)

router.post("/post-click/:id", postcountClick)



router.post("/contact-us",contactUs)


export default router;


