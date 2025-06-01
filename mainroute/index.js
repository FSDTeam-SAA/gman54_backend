import express from "express";
import authRoute from "../route/auth.route.js";
import userRoute from "../route/user.route.js";
import sellerRoute from "../route/seller.route.js";
import adminRoute from "../route/admin.route.js";

const router = express.Router();

// Mounting the routes
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/seller", sellerRoute);
router.use("/admin", adminRoute);

export default router;
