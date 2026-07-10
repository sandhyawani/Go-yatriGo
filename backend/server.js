const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

require("dotenv").config();
require("colors");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const configuredClientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const developmentClientOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

const allowedClientOrigins = [
  ...new Set([...configuredClientOrigins, ...developmentClientOrigins]),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedClientOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/socket.io")
});
app.use("/api", limiter);

app.use(mongoSanitize());

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(xss());
app.use(hpp());

app.use(morgan("dev"));

// Static folders
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Go  YatriGo API is running",
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/stories", require("./routes/storyRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/social", require("./routes/socialTravelRoute"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/emergency", require("./routes/emergencyRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/api/security", require("./routes/securityRoutes"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/legal", require("./routes/legal"));
app.use("/api/music", require("./routes/musicRoute"));
app.use("/api/journeys", require("./routes/journeyRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(err.statusCode || 500).json({
    message: err.message || "Server Error",
  });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedClientOrigins,
    credentials: true,
  },
});

const onlineUsers = new Map();
app.set("io", io);
app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  console.log("[SERVER] Connected:", socket.id);

  socket.on("go_online", async (userId) => {
    const isReconnect = onlineUsers.has(userId);
    socket.userId = userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(userId);

    // SERVER STEP 0 — personal room registration
    console.log("[SERVER] go_online received", {
      userId,
      socketId: socket.id,
      personalRoom: userId,
      totalSocketsForUser: onlineUsers.get(userId).size,
      isReconnect,
      time: Date.now(),
    });

    if (!isReconnect) {
      socket.broadcast.emit("user_presence", {
        userId,
        status: "online",
      });
    }

    socket.emit("initial_online_users", Array.from(onlineUsers.keys()));

    // Find all rooms containing this user and mark messages from others as delivered
    try {
      const ChatRoom = require("./models/ChatRoom");
      const Message = require("./models/Message");
      
      const rooms = await ChatRoom.find({ members: userId });
      const roomIds = rooms.map(r => r._id);
      
      if (roomIds.length > 0) {
        const undeliveredMessages = await Message.find({
          roomId: { $in: roomIds },
          sender: { $ne: userId },
          deliveredTo: { $ne: userId }
        });

        if (undeliveredMessages.length > 0) {
          const messageIds = undeliveredMessages.map(m => m._id);
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { deliveredTo: userId } }
          );

          undeliveredMessages.forEach((m) => {
            console.log("[SERVER] EMIT message_delivered", { roomId: m.roomId.toString(), messageId: m._id.toString(), userId });
            io.to(m.roomId.toString()).emit("message_delivered", {
              roomId: m.roomId.toString(),
              messageId: m._id.toString(),
              userId: userId,
            });
            io.to(m.roomId.toString()).emit("message_delivered_update", {
              roomId: m.roomId.toString(),
              messageId: m._id.toString(),
              userId: userId,
            });
          });
        }
      }
    } catch (err) {
      console.error("Error marking undelivered messages on go_online:", err);
    }
  });

  socket.on("join_room", (roomId) => {
    console.log("[SERVER] join_room:", roomId);
    socket.join(roomId);
  });

  socket.on("join_chat_room", (roomId) => {
    socket.join(roomId);
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    console.log("[SERVER] join_chat_room", {
      roomId,
      socketId: socket.id,
      socketsInRoom: roomSockets ? roomSockets.size : 0,
      time: Date.now(),
    });
  });

  socket.on("send_chat_message", (data) => {
    console.log("RECEIVED send_chat_message (legacy/broadcast fallback):", data);
    socket.to(data.roomId).emit("receive_chat_message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("is_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.roomId).emit("not_typing", data);
  });

  socket.on("mark_messages_read", async (data) => {
    console.log("RECEIVED mark_messages_read:", data);
    try {
      const Message = require("./models/Message");
        await Message.updateMany(
          { roomId: data.roomId, unreadBy: data.userId },
          { 
            $pull: { unreadBy: data.userId },
            $addToSet: { seenBy: data.userId, deliveredTo: data.userId },
            $set: { seenAt: new Date() }
          }
        );

      console.log("[SERVER] EMIT messages_seen", data);
      socket.to(data.roomId).emit("messages_read", data);
      socket.to(data.roomId).emit("messages_seen", data);
    } catch (err) {
      console.error("Error updating messages read status:", err);
    }
  });

  socket.on("message_delivered", async (data) => {
    console.log("RECEIVED message_delivered:", data);
    try {
      const Message = require("./models/Message");
        const message = await Message.findById(data.messageId);
        if (message) {
          if (!message.deliveredTo.includes(data.userId)) {
            message.deliveredTo.push(data.userId);
          }
          if (!message.deliveredAt) {
            message.deliveredAt = new Date();
          }
          await message.save();
        }
      if (message) {
        console.log("[SERVER] EMIT message_delivered", { roomId: data.roomId, messageId: data.messageId, userId: data.userId });
        socket.to(data.roomId).emit("message_delivered", {
          roomId: data.roomId,
          messageId: data.messageId,
          userId: data.userId,
        });
        socket.to(data.roomId).emit("message_delivered_update", {
          roomId: data.roomId,
          messageId: data.messageId,
          userId: data.userId,
        });
      }
    } catch (err) {
      console.error("Error updating message delivery status:", err);
    }
  });

  socket.on("disconnect", (reason) => {
    const remainingSockets = socket.userId
      ? (onlineUsers.get(socket.userId)?.size ?? 0) - 1
      : 0;

    // SERVER — socket lifecycle
    console.log("[SERVER] socket disconnected", {
      socketId: socket.id,
      userId: socket.userId || "unknown",
      reason,
      remainingSocketsForUser: Math.max(remainingSockets, 0),
      time: Date.now(),
    });

    if (socket.userId) {
      const socketIds = onlineUsers.get(socket.userId);
      if (socketIds) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          const userId = socket.userId;
          setTimeout(() => {
            const currentSockets = onlineUsers.get(userId);
            if (!currentSockets || currentSockets.size === 0) {
              onlineUsers.delete(userId);
              socket.broadcast.emit("user_presence", {
                userId,
                status: "offline",
              });
              console.log("[SERVER] user fully offline", { userId, time: Date.now() });
            }
          }, 1500);
        }
      }
    } else {
      // Fallback scan if go_online was not called
      for (const [userId, socketIds] of onlineUsers.entries()) {
        if (socketIds instanceof Set && socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            setTimeout(() => {
              const currentSockets = onlineUsers.get(userId);
              if (!currentSockets || currentSockets.size === 0) {
                onlineUsers.delete(userId);
                socket.broadcast.emit("user_presence", {
                  userId,
                  status: "offline",
                });
              }
            }, 1500);
          }
          break;
        }
      }
    }
  });
});

// Connect Database and Start Server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`.cyan.bold);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

module.exports = { app, server, io };
