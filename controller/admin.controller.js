import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import httpStatus from "http-status";
import { User } from "./../model/user.model.js";
import { Farm } from "../model/farm.model.js";

// Admin: Approve seller request
export const approveSellerRequest = catchAsync(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Access denied. You are not an admin."
    );
  }

  const user = await User.findOne({
    "sellerRequest._id": req.params.requestId,
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Seller request not found");
  }

  if (user.sellerRequest.status !== "pending") {
    throw new AppError(httpStatus.BAD_REQUEST, "Seller request is not pending");
  }

  // Create farm upon approval
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
