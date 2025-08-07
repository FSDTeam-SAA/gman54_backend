import express from "express";
import {
  trackIP,
  getAllHits,
  deleteHits,
} from "../controller/IPLog.controller.js";

const router = express.Router();

router.post("/track", trackIP);
router.get("/track", getAllHits);
router.delete("/track", deleteHits);

export default router;
