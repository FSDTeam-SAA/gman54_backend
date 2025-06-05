import express from "express";
import {
  getAdminOverview,
  getCategoriesList,
  addCategory,
  deleteCategory,
  updateCategory,
  getRequestProducts,
  approveProductRequest,
  deleteProductRequest,
  uploadBannerAds,
  getBlogList,
  addBlog,
  updateBlog,
  deleteBlog,
  getSellerProfiles,
  getSellerProfile,
  getSellerProfileRequests,
  getSpecificSellerProfileRequest,
  approveSellerRequest,
  deleteSellerRequest,
} from "../controller/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { getOrdersWithAdminRevenue, getUserWiseOrderStatusSummary } from "../controller/user.controller.js";

const router = express.Router();

// Overview
router.get("/overview", protect, getAdminOverview);

// Categories
router.get("/categories", protect, getCategoriesList);
router.post("/categories", protect, addCategory);
router.patch("/categories/:id", protect, updateCategory);
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
router.patch("/blogs/:id", protect, upload.single("thumbnail"), updateBlog);
router.delete("/blogs/:id", protect, deleteBlog);

// Seller Profiles
router.get("/sellers", protect, getSellerProfiles);
router.get("/sellers/:sellerId", protect, getSellerProfile);

// Seller Profile Requests
router.get("/seller-requests", protect, getSellerProfileRequests);
router.patch(
  "/seller-requests/:requestId/approve",
  protect,
  approveSellerRequest
);
router.get(
  "/seller-requests/:requestId",
  protect,
  getSpecificSellerProfileRequest
);
router.delete("/seller-requests/:requestId", protect, deleteSellerRequest);

router.get("/user-profile",getUserWiseOrderStatusSummary);
router.get("/admin-reveneu",getOrdersWithAdminRevenue)

export default router;
