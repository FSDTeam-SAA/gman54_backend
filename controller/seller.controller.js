import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import { uploadOnCloudinary } from "../utils/commonMethod.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { Farm } from "./../model/farm.model.js";
import { Product } from "./../model/product.model.js";
import { Order } from "./../model/order.model.js";

// Apply to become a seller or create a farm
export const applySellerOrCreateFarm = catchAsync(async (req, res) => {
  const { farmName, description } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!farmName || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide farm name and description"
    );
  }

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

  if (user.role === "seller") {
    user.sellerRequest = {
      status: "pending",
      farmName,
      farmImages: images,
      farmVideos: videos,
      description,
      submittedAt: new Date(),
    };
    await user.save();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Farm request submitted successfully. Awaiting admin approval.",
      data: user.sellerRequest,
    });
    return;
  }

  if (user.sellerRequest?.status === "pending") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have a pending seller or farm request"
    );
  }

  user.sellerRequest = {
    status: "pending",
    farmName,
    farmImages: images,
    farmVideos: videos,
    description,
    submittedAt: new Date(),
  };

  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Seller application submitted successfully. Awaiting admin approval.",
    data: user.sellerRequest,
  });
});

// All categories
export const getAllCategories = catchAsync(async (req, res) => {
  const categories = await Farm.find().select("-__v");
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
    farm: { $in: await Farm.find({ seller: sellerId }).distinct("_id") },
    status: "active",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      totalSales: totalSales[0]?.total || 0,
      liveProducts,
      userId: req.user.uniqueId,
    },
  });
});

// Sell Report
export const getSellReport = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const { period = "month" } = req.query;
  const periods = { day: 1, week: 7, month: 30, year: 365 };
  const days = periods[period] || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const lastMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const currentSales = await Order.aggregate([
    { $match: { customer: sellerId, date: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const lastMonthSales = await Order.aggregate([
    {
      $match: {
        customer: sellerId,
        date: { $gte: lastMonthStart, $lt: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        total: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      thisMonth: currentSales.map((d) => ({ date: d._id, total: d.total })),
      lastMonth: lastMonthSales.map((d) => ({ date: d._id, total: d.total })),
      userId: req.user.uniqueId,
    },
  });
});

// Total New Products Report
export const getNewProductsReport = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const { period = "month" } = req.query;
  const periods = { day: 1, week: 7, month: 30, year: 365 };
  const days = periods[period] || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const products = await Product.aggregate([
    {
      $match: {
        farm: { $in: await Farm.find({ seller: sellerId }).distinct("_id") },
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: {
      report: products.map((p) => ({ date: p._id, count: p.count })),
      userId: req.user.uniqueId,
    },
  });
});

// My Sales History
export const getSalesHistory = catchAsync(async (req, res) => {
  const sellerId = req.user._id;
  const sales = await Order.find({ customer: sellerId })
    .populate("product", "title thumbnail code")
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
  const products = await Product.find({
    farm: { $in: await Farm.find({ seller: sellerId }).distinct("_id") },
    status: "active",
  })
    .populate("category", "name")
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
  const products = await Product.find({
    farm: { $in: await Farm.find({ seller: sellerId }).distinct("_id") },
    status: "pending",
  })
    .populate("category", "name")
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
  const { title, price, quantity, category, farmId } = req.body;
  const files = req.files || [];

  const farm = await Farm.findOne({ _id: farmId, seller: sellerId });
  if (!farm) {
    throw new AppError(httpStatus.NOT_FOUND, "Farm not found or unauthorized");
  }

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
    farm: farmId,
    status: "pending",
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product added successfully and is pending admin approval",
    data: product,
  });
});

// Update Product
export const updateProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { title, price, quantity, category, farmId } = req.body;
  const files = req.files || [];

  const product = await Product.findById(productId).populate("farm");
  if (!product || product.farm.seller.toString() !== req.user._id.toString()) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Product not found or unauthorized"
    );
  }

  if (title) product.title = title;
  if (price) product.price = price;
  if (quantity) product.quantity = quantity;
  if (category) product.category = category;
  if (farmId) {
    const farm = await Farm.findOne({ _id: farmId, seller: req.user._id });
    if (!farm) throw new AppError(httpStatus.NOT_FOUND, "Farm not found");
    product.farm = farmId;
  }

  if (files.length > 0) {
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
    product.thumbnail = media[0] || product.thumbnail;
    product.media = media.length > 0 ? media : product.media;
  }

  await product.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

// Delete Product
export const deleteProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOneAndDelete({
    _id: productId,
    farm: { $in: await Farm.find({ seller: req.user._id }).distinct("_id") },
  });
  if (!product) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Product not found or unauthorized"
    );
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product deleted successfully",
  });
});
