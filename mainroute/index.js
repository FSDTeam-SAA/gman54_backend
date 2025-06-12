import express from "express";
import authRoute from "../route/auth.route.js";
import userRoute from "../route/user.route.js";
import sellerRoute from "../route/seller.route.js";
import adminRoute from "../route/admin.route.js";
import cartRoute from "../route/cart.route.js";
import orderRoute from "../route/order.route.js";
import paymentRouter from "../route/payment.route.js";
import chatRoute from "../route/chat.route.js";

const router = express.Router();

// Mounting the routes
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/seller", sellerRoute);
router.use("/admin", adminRoute);
router.use("/cart", cartRoute);
router.use("/order", orderRoute);
router.use("/payment",paymentRouter)
router.use("/chat", chatRoute);

export default router;
