import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import { uploadOnCloudinary } from "../utils/commonMethod.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { FarmCategory } from "./../model/farmCategory.model.js";
import { Product } from "./../model/product.model.js";
import { Order } from "./../model/order.model.js";

// Apply to become a seller
export const applySeller = catchAsync(async (req, res) => {
  const { farmName, farmCategory, description } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === "seller") {
    throw new AppError(httpStatus.BAD_REQUEST, "You are already a seller");
  }

  if (user.sellerRequest.status === "pending") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have a pending seller request"
    );
  }

  if (!farmName || !farmCategory || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide farm name, category, and description"
    );
  }

  const category = await FarmCategory.findById(farmCategory);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Farm category not found");
  }

  // Handle media uploads (optional)
  const images = [];
  const videos = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadOnCloudinary(file.buffer, {
        resource_type: file.mimetype.startsWith("video") ? "video" : "image",
        folder: "farms",
      });
      const media = { public_id: result.public_id, url: result.secure_url };
      if (file.mimetype.startsWith("video")) {
        videos.push(media);
      } else {
        images.push(media);
      }
    }
  }

  user.sellerRequest = {
    status: "pending",
    farmName,
    farmImages: images,
    farmVideos: videos,
    farmCategory,
    description,
    submittedAt: new Date(),
  };

  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller application submitted successfully",
    data: user.sellerRequest,
  });
});

// All categories
export const getAllCategories = catchAsync(async (req, res) => {
  const categories = await FarmCategory.find().select("-__v");
  if (!categories || categories.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No farm categories found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Farm categories fetched successfully",
    data: categories,
  });
});

// Dashboard overview
export const getDashboardOverview = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const totalSales = await Order.aggregate([
    { $match: { customer: sellerId } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  const liveProducts = await Product.countDocuments({
    seller: sellerId,
    status: "active",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      totalSales: totalSales[0]?.total || 0,
      liveProducts,
    },
  });
});

// My Sales history
export const getSalesHistory = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const sales = await Order.find({ customer: sellerId })
    .populate("product", "title thumbnail")
    .sort({ date: -1 })
    .limit(12);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: sales,
  });
});

// Active Product List
export const getActiveProducts = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const products = await Product.find({ seller: sellerId, status: "active" })
    .sort({ date: -1 })
    .limit(12);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: products,
  });
});

// Pending Product List
export const getPendingProducts = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const products = await Product.find({ seller: sellerId, status: "pending" })
    .sort({ date: -1 })
    .limit(12);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: products,
  });
});

// Add Product
export const addProduct = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const { title, price, quantity, category } = req.body;
  const files = req.files || [];

  const media = await Promise.all(
    files.map(async (file) => {
      const result = await uploadOnCloudinary(file.buffer, {
        folder: "products",
        resource_type: file.mimetype.startsWith("video") ? "video" : "image",
      });
      return {
        public_id: result.public_id,
        url: result.secure_url,
        type: file.mimetype.startsWith("video") ? "video" : "photo",
      };
    })
  );

  const product = await Product.create({
    title,
    price,
    quantity,
    category,
    thumbnail: media[0] || null,
    media,
    seller: sellerId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product added successfully",
    data: product,
  });
});
