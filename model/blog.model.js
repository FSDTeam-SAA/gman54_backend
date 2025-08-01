import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  blogName: { type: String, required: true },
  thumbnail: { public_id: String, url: String },
  description: { type: String, required: true },
},{
  timestamps: true
});

export const Blog = mongoose.model("Blog", blogSchema);
