import mongoose from "mongoose";
import crypto from "crypto";

const orderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      default: () => crypto.randomInt(100000, 999999).toString(),
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
