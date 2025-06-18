import mongoose from "mongoose";

const adsSchema = new mongoose.Schema({
  thumbnail: { public_id: String, url: String },
},{
  timestamps: true
});

export const Ads = mongoose.model("Ads", badsSchemalogSchema);
