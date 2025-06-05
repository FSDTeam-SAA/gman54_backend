import httpStatus from "http-status";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/commonMethod.js";
import AppError from "../errors/AppError.js";
import sendResponse from "../utils/sendResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { Order } from "../model/order.model.js";

// Get user profile
export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -verificationInfo -password_reset_token"
  );
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res) => {
  const { name, username, phone, street, city, state, zipCode } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Update fields that are included in the request body
  if (name) user.name = name;
  if (username) user.username = username;
  if (phone) user.phone = phone;
  if (street) user.address.street = street;
  if (city) user.address.city = city;
  if (state) user.address.state = state;
  if (zipCode) user.address.zipCode = zipCode;

  // If avatar file is uploaded, process it
  if (req.file) {
    const result = await uploadOnCloudinary(req.file.buffer, {
      folder: "avatars",
    });
    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Change user password
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "New password and confirm password do not match"
    );
  }

  if (!(await User.isPasswordMatched(currentPassword, user.password))) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: user,
  });
});


export const getUserWiseOrderStatusSummary = catchAsync(
  async (req, res) => {
 const summary = await Order.aggregate([
      {
        $group: {
          _id: {
            user: "$customer",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.user",
          statusCounts: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          user: "$_id",
          _id: 0,
          statusCounts: 1,
          pending: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$statusCounts",
                    as: "item",
                    cond: { $eq: ["$$item.status", "pending"] },
                  },
                },
                as: "item",
                in: "$$item.count",
              },
            },
          },
          completed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$statusCounts",
                    as: "item",
                    cond: { $eq: ["$$item.status", "completed"] },
                  },
                },
                as: "item",
                in: "$$item.count",
              },
            },
          },
                    shipping: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$statusCounts",
                    as: "item",
                    cond: { $eq: ["$$item.status", "shipping"] }
                  }
                },
                as: "item",
                in: "$$item.count"
              }
            }
          },
          cancelled: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$statusCounts",
                    as: "item",
                    cond: { $eq: ["$$item.status", "cancelled"] },
                  },
                },
                as: "item",
                in: "$$item.count",
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
          },
          pending: 1,
          completed: 1,
          shipping: 1,
          cancelled: 1,
        },
      },
    ]);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User-wise order status summary fetched successfully",
      data: summary,
    });
  }
);



export const getOrdersWithAdminRevenue = catchAsync(
  async (req, res) => {
    const ordersWithRevenue = await Order.aggregate([
      // 1) Lookup Farm data
      {
        $lookup: {
          from: "farms",           // MongoDB collection name for Farm
          localField: "farm",
          foreignField: "_id",
          as: "farm",
        },
      },
      { $unwind: "$farm" },

      // 2) Lookup Product data
      {
        $lookup: {
          from: "products",       // MongoDB collection name for Product
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // 3) Project only the fields we need + compute adminRevenue = totalPrice * 4.99%
      {
        $project: {
          _id: 0,
          farm: {
            _id: "$farm._id",
            name: "$farm.name",
          },
          product: {
            _id: "$product._id",
            name: "$product.title",
          },
          adminRevenue: {
            // 4.99% = 0.0499
            $round: [{ $multiply: ["$totalPrice", 0.0499] }, 2],
          },
        },
      },
    ]);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Fetched all orders with admin revenue (4.99%)",
      data: ordersWithRevenue,
    });
  }
);


