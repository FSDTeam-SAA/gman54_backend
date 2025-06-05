import mongoose from "mongoose";
import crypto from "crypto";

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => crypto.randomInt(100000, 999999).toString(),
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  thumbnail: { public_id: String, url: String },
  media: [
    {
      public_id: String,
      url: String,
      type: { type: String, enum: ["photo", "video"] },
    },
  ],
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farm",
    required: true,
  },
  review: [{    
    text: String,
    rating: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      },}
  ],
  status: { type: String, enum: ["active", "pending"], default: "pending" },
},{
  timestamps: true,
});

export const Product = mongoose.model("Product", productSchema);
