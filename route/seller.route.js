import express from "express";
import {
  applySeller,
  getAllCategories,
  getDashboardOverview,
  getSalesHistory,
  getActiveProducts,
  getPendingProducts,
  addProduct,
} from "../controller/seller.controller.js";

import {
  getOrderHistory,
  updateOrderStatus,
} from "../controller/order.controller.js";

import upload from "../middleware/multer.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/apply", protect, upload.array("media"), applySeller);
router.get("/categories", protect, getAllCategories);

// Dashboard and Product Management
router.get("/dashboard", protect, getDashboardOverview);
router.get("/sales-history", protect, getSalesHistory);
router.get("/active-products", protect, getActiveProducts);
router.get("/pending-products", protect, getPendingProducts);
router.post(
  "/products",
  protect,
  upload.fields([{ name: "thumbnail" }, { name: "media" }]),
  addProduct
);

// Order Management
router.get("/order-history", protect, getOrderHistory);
router.patch("/order/:orderId/status", protect, updateOrderStatus);

export default router;
