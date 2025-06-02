import mongoose from "mongoose";
import crypto from "crypto";

const farmSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => crypto.randomInt(100000, 999999).toString(),
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export const Farm = mongoose.model("Farm", farmSchema);
