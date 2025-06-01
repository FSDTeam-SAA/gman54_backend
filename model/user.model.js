import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: 0, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String },
    credit: { type: Number, default: null },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "seller"],
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },
    sellerRequest: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      farmName: { type: String },
      farmImages: [{ public_id: String, url: String }],
      farmVideos: [{ public_id: String, url: String }],
      farmCategory: { type: Schema.Types.ObjectId, ref: "FarmCategory" },
      description: { type: String },
      submittedAt: { type: Date },
    },
    verificationInfo: {
      verified: { type: Boolean, default: false },
      token: { type: String, default: "" },
    },
    password_reset_token: { type: String, default: "" },
    fine: { type: Number, default: 0 },
    refreshToken: { type: String, default: "" },
  },
  { timestamps: true }
);

// Pre save middleware: Hash password
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    const saltRounds = Number(process.env.bcrypt_salt_round) || 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }

  next();
});

userSchema.statics.isUserExistsByEmail = async function (email) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.isOTPVerified = async function (id) {
  const user = await User.findById(id).select("+verificationInfo");
  return user?.verificationInfo.verified;
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashPassword
) {
  return await bcrypt.compare(plainTextPassword, hashPassword);
};

export const User = mongoose.model("User", userSchema);
