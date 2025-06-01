import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import { uploadOnCloudinary } from "../utils/commonMethod.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { FarmCategory } from "./../model/farmCategory.model.js";

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
}