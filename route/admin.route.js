import express from "express";
import {
  getAdminOverview,
  getCategoriesList,
  addCategory,
  deleteCategory,
  getRequestProducts,
  approveProductRequest,
  deleteProductRequest,
  uploadBannerAds,
  getBlogList,
  addBlog,
  deleteBlog,
  getSellerProfiles,
  getSellerProfileRequests,
  approveSellerRequest,
  deleteSellerRequest,
  updateProfile,
  changePassword,
} from "../controller/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Overview
router.get("/overview", protect, getAdminOverview);

// Categories
router.get("/categories", protect, getCategoriesList);
router.post("/categories", protect, addCategory);
router.delete("/categories/:id", protect, deleteCategory);

// Request Product
router.get("/request-products", protect, getRequestProducts);
router.patch(
  "/request-products/:productId/approve",
  protect,
  approveProductRequest
);
router.delete("/request-products/:productId", protect, deleteProductRequest);

// Upload Banner Ads
router.post("/banner-ads", protect, upload.array("banners"), uploadBannerAds);

// Blog Management
router.get("/blogs", protect, getBlogList);
router.post("/blogs", protect, upload.single("thumbnail"), addBlog);
router.delete("/blogs/:id", protect, deleteBlog);

// Seller Profiles
router.get("/sellers", protect, getSellerProfiles);

// Seller Profile Requests
router.get("/seller-requests", protect, getSellerProfileRequests);
router.patch(
  "/seller-requests/:requestId/approve",
  protect,
  approveSellerRequest
);
router.delete("/seller-requests/:requestId", protect, deleteSellerRequest);

// Setting
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
