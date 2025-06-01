import express from "express";
import { approveSellerRequest } from "../controller/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.patch(
  "/seller-requests/:requestId/approve",
  protect,
  approveSellerRequest
);

export default router;
