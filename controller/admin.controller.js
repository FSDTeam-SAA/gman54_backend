import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { Farm } from "../model/farm.model.js";
import { Category } from "./../model/category.model.js";
import { Product } from "./../model/product.model.js";
import { Blog } from "./../model/blog.model.js";
import { uploadOnCloudinary } from "./../utils/commonMethod.js";

// Overview
export const getAdminOverview = catchAsync(async (req, res) => {
  const totalSellers = await User.countDocuments({ role: "seller" });
  const totalUsers = await User.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { totalSellers, totalUsers },
  });
});

// Categories List
export const getCategoriesList = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const categories = await Category.find()
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });
  const total = await Category.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { categories, total, page, limit },
  });
});

// Add Category
export const addCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide name and description"
    );
  }

  const category = await Category.create({ name, description });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category added successfully",
    data: category,
  });
});

// Update Category
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide name and description"
    );
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

// Delete Category
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
  });
});

// Request Product
export const getRequestProducts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const products = await Product.find({ status: "pending" })
    .populate("category", "name")
    .skip(skip)
    .limit(limit)
    .sort({ date: -1 });
  const total = await Product.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { products, total, page, limit },
  });
});

// Approve Product Request
export const approveProductRequest = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findByIdAndUpdate(
    productId,
    { status: "active" },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product request approved successfully",
    data: product,
  });
});

// Delete Product Request
export const deleteProductRequest = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product request deleted successfully",
  });
});

// Upload Banner Ads
export const uploadBannerAds = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please upload at least one banner"
    );
  }

  const banners = await Promise.all(
    req.files.map(async (file) => {
      const result = await uploadOnCloudinary(file.buffer, {
        resource_type: "image",
        folder: "banners",
      });
      return { public_id: result.public_id, url: result.secure_url };
    })
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banners uploaded successfully",
    data: banners,
  });
});

// Blog Management List
export const getBlogList = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const blogs = await Blog.find().skip(skip).limit(limit).sort({ date: -1 });
  const total = await Blog.countDocuments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { blogs, total, page, limit },
  });
});

// Add Blog
export const addBlog = catchAsync(async (req, res) => {
  const { blogName, description } = req.body;

  if (!blogName || !description) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide blog name and description"
    );
  }

  let thumbnail = null;
  if (req.files && req.files.length > 0) {
    const result = await uploadOnCloudinary(req.files[0].buffer, {
      resource_type: "image",
      folder: "blogs",
    });
    thumbnail = { public_id: result.public_id, url: result.secure_url };
  }

  const blog = await Blog.create({ blogName, description, thumbnail });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog added successfully",
    data: blog,
  });
});

// Delete Blog
export const deleteBlog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog deleted successfully",
  });
});

// Seller Profile List
export const getSellerProfiles = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const sellers = await User.find({ role: "seller" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await User.countDocuments({ role: "seller" });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { sellers, total, page, limit },
  });
});

// Seller Profile Request
export const getSellerProfileRequests = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const users = await User.find({ "sellerRequest.status": "pending" })
    .skip(skip)
    .limit(limit)
    .sort({ "sellerRequest.submittedAt": -1 });
  const total = await User.countDocuments({
    "sellerRequest.status": "pending",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: { users, total, page, limit },
  });
});

// Approve Seller Request
export const approveSellerRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const user = await User.findOne({ "sellerRequest._id": requestId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  if (user.sellerRequest.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Seller request is not pending");
  }

  const farm = await Farm.create({
    name: user.sellerRequest.farmName,
    location: {},
    seller: user._id,
  });

  if (user.role !== "seller") {
    user.role = "seller";
  }
  user.sellerRequest.status = "approved";
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller request approved successfully",
    data: { user, farm },
  });
});

// Delete Seller Request
export const deleteSellerRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const user = await User.findOne({ "sellerRequest._id": requestId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  user.sellerRequest = undefined;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Seller request deleted successfully",
  });
});

// Setting (Update Profile)
export const updateProfile = catchAsync(async (req, res) => {
  const { fullName, username, phoneNumber, dateOfBirth, gender, address } =
    req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (fullName) user.fullName = fullName;
  if (username) user.username = username;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (gender) user.gender = gender;
  if (address) user.address = address;

  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Change Password (Stub, implement secure password hashing)
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Add password comparison and hashing logic here
  user.password = newPassword; // Replace with secure hashing
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
  });
});
