import express from "express";
import {
  checkoutCart,
  getMyOrders,
  getAllOrders,
  getFarmOrders,
  updateOrderStatus,
  cancelOrder,
  createSingleOrder,
} from "../controller/order.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/checkout", protect, checkoutCart);
router.post("/single-order", protect, createSingleOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, isAdmin, getAllOrders);
router.get("/vendor", protect, getFarmOrders);
router.put("/:orderId/status", protect, updateOrderStatus);
router.delete("/:orderId", protect, cancelOrder);

export default router;
