import mongoose, { Schema } from "mongoose";

const farmCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const FarmCategory = mongoose.model("FarmCategory", farmCategorySchema);
