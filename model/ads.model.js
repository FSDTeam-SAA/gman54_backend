import mongoose from "mongoose";

const adsSchema = new mongoose.Schema({
  title: String,
  thumbnail: { public_id: String, url: String },
  link: String,
},{
  timestamps: true
});

export const Ads = mongoose.model("Ads", adsSchema);
