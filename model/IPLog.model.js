// model/IPLog.model.js
import mongoose from "mongoose";

const ipLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  path: { type: String },
  timestamp: { type: Date, default: Date.now },
});

ipLogSchema.index({ ip: 1, path: 1, timestamp: 1 });

const IPLog = mongoose.model("IPLog", ipLogSchema);

export default IPLog;
