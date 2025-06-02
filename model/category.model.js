import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Category = mongoose.model("Category", categorySchema);
