import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { Order } from "../model/order.model.js";

// Get Order History
export const getOrderHistory = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const orders = await Order.find({ customer: sellerId })
    .populate("product", "title thumbnail")
    .sort({ date: -1 })
    .limit(12);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: orders,
  });
});

// Update Order Status
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findOneAndUpdate(
    { orderId, customer: req.user._id },
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated",
    data: order,
  });
});
