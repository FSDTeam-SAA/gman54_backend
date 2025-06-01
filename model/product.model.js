import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    thumbnail: {
      public_id: String,
      url: String,
    },
    media: [
      {
        public_id: String,
        url: String,
        type: {
          type: String,
          enum: ["photo", "video"],
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "pending",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
