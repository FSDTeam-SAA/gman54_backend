import express from "express";
import {
  applySellerOrCreateFarm,
  getAllCategories,
  getDashboardOverview,
  getSellReport,
  getNewProductsReport,
  getSalesHistory,
  getActiveProducts,
  getPendingProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateFarm,
} from "../controller/seller.controller.js";

import {
  getFarmOrders,
  updateOrderStatus,
} from "../controller/order.controller.js";

import upload from "../middleware/multer.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Become a seller
router.post("/apply", upload.array("media"), applySellerOrCreateFarm);
router.patch("/farm/update/:farmId",protect, upload.array("media"), updateFarm);
router.get("/categories", protect, getAllCategories);

// Dashboard and Product Management
router.get("/dashboard", protect, getDashboardOverview);
router.get("/sell-report", protect, getSellReport);
router.get("/new-products-report", protect, getNewProductsReport);
router.get("/sales-history", protect, getSalesHistory);
router.get("/active-products", protect, getActiveProducts);
router.get("/pending-products", protect, getPendingProducts);
router.post(
  "/products",
  protect,
  upload.fields([{ name: "thumbnail" }, { name: "media" }]),
  addProduct
);
router.patch(
  "/products/:productId",
  protect,
  upload.fields([{ name: "thumbnail" }, { name: "media" }]),
  updateProduct
);
router.delete("/products/:productId", protect, deleteProduct);

// Order Management
router.get("/order-history", protect, getFarmOrders);
router.patch("/order/:orderId/status", protect, updateOrderStatus);

export default router;
