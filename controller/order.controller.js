// import catchAsync from "../utils/catchAsync.js";
// import sendResponse from "../utils/sendResponse.js";
// import AppError from "../errors/AppError.js";
// import httpStatus from "http-status";
// import { Order } from "../model/order.model.js";

// // Get Order History
// export const getOrderHistory = catchAsync(async (req, res) => {
//   const sellerId = req.user._id;
//   const orders = await Order.find({ customer: sellerId })
//     .populate("product", "title thumbnail")
//     .sort({ date: -1 })
//     .limit(12);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     data: orders,
//   });
// });

// // Update Order Status
// export const updateOrderStatus = catchAsync(async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body;

//   const order = await Order.findOneAndUpdate(
//     { orderId, customer: req.user._id },
//     { status },
//     { new: true, runValidators: true }
//   );

//   if (!order) {
//     throw new AppError(httpStatus.NOT_FOUND, "Order not found");
//   }

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Order status updated",
//     data: order,
//   });
// });


import { Order } from "../model/order.model.js";
import { Cart } from "../model/cart.model.js";
import { Product } from "../model/product.model.js";
import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from "http-status";
import sendResponse from "../utils/sendResponse.js";
import { Farm } from "../model/farm.model.js";

// 1. Checkout - Create farm-wise orders from cart
export const checkoutCart = catchAsync(async (req, res) => {
  const customerId = req.user._id;
  const {address} = req.body;

  const cart = await Cart.findOne({ customer: customerId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new AppError(404, "Cart is empty");
  }

  // Get the farm ID from the first item
  const farmId = cart.items[0].farm.toString();

  // Validate all items belong to the same farm
  const isSingleFarm = cart.items.every(
    (item) => item.farm.toString() === farmId
  );

  if (!isSingleFarm) {
    throw new AppError(400, "All items in the cart must be from the same farm to checkout");
  }

  // Build product list and calculate total
  const products = [];
  let totalOrderPrice = 0;

  for (const item of cart.items) {
    const productTotalPrice = item.quantity * item.price;

    products.push({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      totalPrice: productTotalPrice,
    });

    totalOrderPrice += productTotalPrice;
  }

  // Create single farm order
  const order = new Order({
    customer: customerId,
    farm: farmId,
    products,
    totalPrice: totalOrderPrice,
    address
  });

  await order.save();

  // Clear cart
  cart.items = [];
  cart.total = 0;
  await cart.save();

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully for the farm",
    success: true,
    data: order,
  });
});


// 2. Get my orders
export const getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).populate("products.product");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Orders retrieved successfully",
    success: true,
    data: orders,
  });
});

// 3. Get all orders (admin)
export const getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find().populate("product").populate("customer");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "All orders retrieved",
    success: true,
    data: orders,
  });
});

// 4. Update order status (admin or farm manager)
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  order.status = status;
  await order.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order status updated",
    success: true,
    data: order,
  });
});

// 5. Get orders for a farm (farm user)
export const getFarmOrders = catchAsync(async (req, res) => {
  const farmId = req.user._id; // Assuming farm users are authenticated
  const farm = await Farm.findOne({ seller: farmId });

  if (!farm) {
    throw new AppError(404, "Farm not found");
  }

  const orders = await Order.find({ farm: farm._id })
    .populate("products.product")
    .populate("customer", "name email username phone")
    .lean(); // Use .lean() so we can modify the result

  const enrichedOrders = orders.map(order => {
    // Step 1: Compute total amount if not stored
    let total = 0;
    if (order.totalAmount) {
      total = order.totalAmount;
    } else {
      total = order.products.reduce((sum, item) => {
        const price = item.price || item.product?.price || 0;
        const qty = item.quantity || 1;
        return sum + price * qty;
      }, 0);
    }

    // Step 2: Calculate admin cut and seller revenue
    const adminCommission = +(total * 0.0499).toFixed(2);
    const sellerRevenue = +(total - adminCommission).toFixed(2);

    return {
      ...order,
      totalAmount: +total.toFixed(2),
      adminCommission,
      sellerRevenue,
    };
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Orders for your farm retrieved",
    success: true,
    data: enrichedOrders,
  });
});


// 6. Cancel Order (customer only)
export const cancelOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (!order.customer.equals(req.user._id)) {
    throw new AppError(403, "You are not allowed to cancel this order");
  }

  if (order.status !== "pending") {
    throw new AppError(400, "Only pending orders can be cancelled");
  }

  order.status = "cancelled"

  await order.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order cancelled",
    success: true,
  });
});
