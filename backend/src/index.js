// src/index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Message from "./models/Message.js";

dotenv.config();

const app = express();

// DB
connectDB();

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Health
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
// nested: /api/channels/:channelId/messages
app.use("/api/channels/:channelId/messages", messageRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map(); // userId -> { sockets: Set<socketId>, user: { id, name, avatar, status } }

const broadcastOnlineUsers = () => {
  const list = Array.from(onlineUsers.values()).map((entry) => entry.user);
  io.emit("onlineUsers", list);
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      console.log("Socket connection without token rejected");
      return next(new Error("No auth token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  if (!userId) return;

  console.log("Socket connected:", socket.id, "user:", userId);

  // Mark user online
  const entry = onlineUsers.get(userId) || {
    sockets: new Set(),
    user: null,
  };
  entry.sockets.add(socket.id);

  if (!entry.user) {
    const userDoc = await User.findById(userId);
    if (userDoc) {
      entry.user = {
        id: userDoc._id.toString(),
        name: userDoc.name,
        avatar: userDoc.avatar,
        status: "online",
      };
    }
  }

  onlineUsers.set(userId, entry);
  broadcastOnlineUsers();

  // Join channel room
  socket.on("joinChannel", (channelId) => {
    if (!channelId) return;
    socket.join(`channel:${channelId}`);
  });

  // Leave channel room
  socket.on("leaveChannel", (channelId) => {
    if (!channelId) return;
    socket.leave(`channel:${channelId}`);
  });

  // Receive & broadcast message
  socket.on("sendMessage", ({ channelId, message }) => {
    try {
      if (!channelId || !message) return;

      // Broadcast to everyone in this channel room (including sender)
      io.to(`channel:${channelId}`).emit("newMessage", {
        channelId,
        message,
      });
    } catch (err) {
      console.error("sendMessage broadcast error:", err);
    }
  });

  // Typing indicators
  socket.on("typing", ({ channelId }) => {
    if (!channelId) return;

    const entry = onlineUsers.get(userId);
    if (!entry || !entry.user) return;

    // send to others in this channel
    socket.to(`channel:${channelId}`).emit("userTyping", {
      channelId,
      user: entry.user, // { id, name, avatar, status }
    });
  });

  // Stop typing indicators
  socket.on("stopTyping", ({ channelId }) => {
    if (!channelId) return;

    const entry = onlineUsers.get(userId);
    if (!entry || !entry.user) return;

    socket.to(`channel:${channelId}`).emit("userStopTyping", {
      channelId,
      userId: entry.user.id,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const entry = onlineUsers.get(userId);
    if (!entry) return;

    entry.sockets.delete(socket.id);
    if (entry.sockets.size === 0) {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.set(userId, entry);
    }

    broadcastOnlineUsers();
    console.log("Socket disconnected:", socket.id, "user:", userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
