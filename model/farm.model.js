import mongoose from "mongoose";
import crypto from "crypto";

const farmSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
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
  description: {
    type: String,
  },
  isOrganic: {
    type: Boolean,
  },
  images: [{ public_id: String, url: String }],
  videos: [{ public_id: String, url: String }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
},{
  timestamps: true,
});

export const Farm = mongoose.model("Farm", farmSchema);
