import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import router from "./mainroute/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import webhookRoutes from './route/stripe.webhook.route.js'

import globalErrorHandler from "./middleware/globalErrorHandler.js";
import notFound from "./middleware/notFound.js";



const app = express();

// ********* Must be BEFORE app.use(express.json********************
app.use('/api/stripe', webhookRoutes) 

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount the main router
app.use("/api/v1", router);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Server is running...!!");
});
app.use(globalErrorHandler);
app.use(notFound);

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  // Join user-specific room for notifications
  socket.on("joinChatRoom", (userId) => {
    if (userId) {
      socket.join(`chat_${userId}`);
      console.log(`Client ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
});
