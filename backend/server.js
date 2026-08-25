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
const compression = require("compression");
const mongoose = require("mongoose");

require("dotenv").config();
require("colors");

const validateEnv = require("./config/validateEnv");
const logger = require("./utils/logger");
const requestIdMiddleware = require("./middleware/requestIdMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

validateEnv();

const connectDB = require("./config/db");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const configuredClientOrigins = (process.env.CLIENT_URL || "").
split(",").
map((origin) => origin.trim().replace(/\/$/, "")).
filter(Boolean);

const developmentClientOrigins =
process.env.NODE_ENV === "production" ?
[] :
[
"http://localhost:3000",
"http://127.0.0.1:3000",
"http://localhost:5173",
"http://127.0.0.1:5173"];


const allowedClientOrigins = [
...new Set([...configuredClientOrigins, ...developmentClientOrigins])];


const isDev = process.env.NODE_ENV !== "production";

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowedClientOrigins.includes(normalizedOrigin) ||
      (isDev && (/^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(normalizedOrigin)))
    ) {
      return callback(null, true);
    }

    if (isDev) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "cache-control",
    "Pragma",
    "Expires",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["set-cookie"]
};

// 1. Enable CORS before all other middlewares and rate limiters
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(compression());

app.use(requestIdMiddleware);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
  message: { message: "Too many login/register attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path.startsWith("/socket.io") ||
    req.path.startsWith("/health") ||
    req.path.startsWith("/api/health")
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 300,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path.startsWith("/socket.io") ||
    req.path.startsWith("/health") ||
    req.path.startsWith("/api/health")
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.use(mongoSanitize());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(xss());
app.use(hpp());

app.use(
morgan(
(tokens, req, res) => {
  const logObject = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens["response-time"](req, res) + " ms",
    requestId: req.id,
    userId: req.user ? req.user._id : "unauthenticated"
  };
  return JSON.stringify(logObject);
},
{
  stream: {
    write: (message) => {
      try {
        const parsed = JSON.parse(message);
        logger.info(
        `HTTP ${parsed.method} ${parsed.url} - Status: ${parsed.status} - Time: ${parsed.responseTime} - ReqID: ${parsed.requestId} - UserID: ${parsed.userId}`
        );
      } catch (e) {
        logger.info(message.trim());
      }
    }
  }
}
)
);

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Go YatriGo API is running"
  });
});

app.use("/api/health", require("./routes/healthRoutes"));
app.use("/health", require("./routes/healthRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/auth", require("./routes/authRoutes"));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/users", require("./routes/userRoutes"));


app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/chat", require("./routes/chatRoutes"));

app.use("/api/social", require("./routes/socialTravelRoute"));
app.use("/social", require("./routes/socialTravelRoute"));

app.use("/api/posts", require("./routes/postRoutes"));
app.use("/posts", require("./routes/postRoutes"));

app.use("/api/stories", require("./routes/storyRoutes"));
app.use("/stories", require("./routes/storyRoutes"));

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/contact", require("./routes/contactRoutes"));

app.use("/api/emergency", require("./routes/emergencyRoutes"));
app.use("/emergency", require("./routes/emergencyRoutes"));

app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

app.use("/api/support", require("./routes/supportRoutes"));
app.use("/support", require("./routes/supportRoutes"));

app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/upload", require("./routes/uploadRoute"));

app.use("/api/security", require("./routes/securityRoutes"));
app.use("/security", require("./routes/securityRoutes"));

app.use("/api/settings", require("./routes/settings"));
app.use("/settings", require("./routes/settings"));

app.use("/api/legal", require("./routes/legal"));
app.use("/legal", require("./routes/legal"));


app.use("/api/journeys", require("./routes/journeyRoutes"));
app.use("/journeys", require("./routes/journeyRoutes"));

app.use("/api/music", require("./routes/musicRoute"));
app.use("/music", require("./routes/musicRoute"));

app.use("/api/trip-mates", require("./routes/tripMateRoutes"));
app.use("/trip-mates", require("./routes/tripMateRoutes"));

app.use(notFound);
app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: allowedClientOrigins,
    credentials: true
  }
});

const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./config/jwt");
const User = require("./models/User");

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    const decoded = jwt.verify(token, getJwtSecret());
    const userId = decoded.id || decoded._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    if (user.isSuspended) {
      return next(new Error("Authentication error: User is suspended"));
    }

    socket.userId = userId.toString();
    next();
  } catch (err) {
    console.error("[SOCKET AUTH ERROR]:", err.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
});

const onlineUsers = new Map();
app.set("io", io);
app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  socket.on("go_online", async (userId) => {
    const authUserId = socket.userId;
    if (!authUserId) {
      console.error("[SERVER] Unauthorized go_online event");
      return;
    }

    const finalUserId = authUserId;
    const isReconnect = onlineUsers.has(finalUserId);

    if (!onlineUsers.has(finalUserId)) {
      onlineUsers.set(finalUserId, new Set());
    }
    onlineUsers.get(finalUserId).add(socket.id);

    socket.join(finalUserId);

    if (!isReconnect) {
      socket.broadcast.emit("user_presence", {
        userId: finalUserId,
        status: "online"
      });
    }

    socket.emit("initial_online_users", Array.from(onlineUsers.keys()));

    try {
      const ChatRoom = require("./models/ChatRoom");
      const Message = require("./models/Message");

      const rooms = await ChatRoom.find({ members: finalUserId });
      const roomIds = rooms.map((r) => r._id);

      if (roomIds.length > 0) {
        const undeliveredMessages = await Message.find({
          roomId: { $in: roomIds },
          sender: { $ne: finalUserId },
          deliveredTo: { $ne: finalUserId }
        });

        if (undeliveredMessages.length > 0) {
          const messageIds = undeliveredMessages.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { deliveredTo: finalUserId } }
          );

          undeliveredMessages.forEach((m) => {
            io.to(m.roomId.toString()).emit("message_delivered", {
              roomId: m.roomId.toString(),
              messageId: m._id.toString(),
              userId: finalUserId
            });
            io.to(m.roomId.toString()).emit("message_delivered_update", {
              roomId: m.roomId.toString(),
              messageId: m._id.toString(),
              userId: finalUserId
            });
          });
        }
      }
    } catch (err) {
      console.error("Error marking undelivered messages on go_online:", err);
    }
  });

  socket.on("join_room", async (roomId) => {
    const userId = socket.userId;
    if (!userId) {
      console.warn(`[SERVER] Blocked unauthenticated socket from joining room ${roomId}`);
      return;
    }

    if (roomId && roomId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const Journey = require("./models/Journey");
        const ChatRoom = require("./models/ChatRoom");

        const journey = await Journey.findById(roomId);
        if (journey) {
          const isMember = journey.members.some(
            (m) => (m.user?._id || m.user).toString() === userId.toString()
          );
          if (isMember) {
            socket.join(roomId);
          } else {
            console.warn(`[SERVER] Blocked user ${userId} joining Journey room ${roomId}: Not a member`);
          }
          return;
        }

        const room = await ChatRoom.findById(roomId);
        if (room) {
          if (room.journeyId) {
            const journey = await Journey.findById(room.journeyId);
            if (journey) {
              const isMember = journey.members.some(
                (m) => (m.user?._id || m.user).toString() === userId.toString()
              );
              if (isMember) {
                socket.join(roomId);
              } else {
                console.warn(`[SERVER] Blocked user ${userId} joining Chat room ${roomId}: Not a member of Journey`);
              }
            }
          } else if (room.members.some((m) => m.toString() === userId.toString())) {
            socket.join(roomId);
          } else {
            console.warn(`[SERVER] Blocked user ${userId} joining Chat room ${roomId}: Not a member of ChatRoom`);
          }
          return;
        }

        if (roomId === userId.toString()) {
          socket.join(roomId);
          return;
        }

        console.warn(`[SERVER] Blocked user ${userId} joining unrecognized room ${roomId}`);
      } catch (err) {
        console.error("Error verifying room join:", err);
      }
    } else {
      if (roomId === userId.toString()) {
        socket.join(roomId);
      } else {
        console.warn(`[SERVER] Blocked user ${userId} joining invalid room ${roomId}`);
      }
    }
  });

  socket.on("join_chat_room", async (roomId) => {
    if (!roomId || typeof roomId !== "string" || !roomId.match(/^[0-9a-fA-F]{24}$/)) return;
    try {
      const ChatRoom = require("./models/ChatRoom");
      const room = await ChatRoom.findById(roomId);
      if (!room) return;

      const userId = socket.userId;
      if (!userId) return;

      if (room.journeyId) {
        const Journey = require("./models/Journey");
        const journey = await Journey.findById(room.journeyId);
        if (!journey) return;

        const isMember = journey.members.some(
          (m) => (m.user?._id || m.user).toString() === userId.toString()
        );
        if (!isMember) {
          console.warn(`[SERVER] Blocked socket ${socket.id} (user ${userId}) joining journey chat room ${roomId}: Not a member`);
          return;
        }
      } else if (!room.members.some((m) => m.toString() === userId.toString())) {
        console.warn(`[SERVER] Blocked socket ${socket.id} (user ${userId}) joining chat room ${roomId}: Not a member`);
        return;
      }

      if (room.type === "direct") {
        const { isBlockedPair } = require("./utils/blockHelper");
        const otherMember = room.members.find((m) => m.toString() !== userId.toString());
        if (otherMember && (await isBlockedPair(userId, otherMember))) {
          console.warn(`[SERVER] Blocked socket ${socket.id} (user ${userId}) joining blocked direct chat room ${roomId}`);
          return;
        }
      }

      socket.join(roomId);
    } catch (err) {
      console.error("Error in join_chat_room socket authorization:", err);
    }
  });

  socket.on("send_chat_message", (data) => {
    socket.to(data.roomId).emit("receive_chat_message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("is_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.roomId).emit("not_typing", data);
  });

  socket.on("mark_messages_read", async (data) => {
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

      socket.to(data.roomId).emit("messages_read", data);
      socket.to(data.roomId).emit("messages_seen", data);
    } catch (err) {
      console.error("Error updating messages read status:", err);
    }
  });

  socket.on("message_delivered", async (data) => {
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
        socket.to(data.roomId).emit("message_delivered", {
          roomId: data.roomId,
          messageId: data.messageId,
          userId: data.userId
        });
        socket.to(data.roomId).emit("message_delivered_update", {
          roomId: data.roomId,
          messageId: data.messageId,
          userId: data.userId
        });
      }
    } catch (err) {
      console.error("Error updating message delivery status:", err);
    }
  });

  socket.on("workspace_change", (data) => {
    if (data && data.journeyId) {
      if (socket.rooms.has(data.journeyId)) {
        socket.to(data.journeyId).emit("workspace_changed", data);
      } else {
        console.warn(`[SERVER] Unauthorized workspace_change: Socket is not authorized in room ${data.journeyId}`);
      }
    }
  });

  socket.on("workspace_editing_start", (data) => {
    if (data && data.journeyId) {
      if (socket.rooms.has(data.journeyId)) {
        socket.to(data.journeyId).emit("workspace_editing_started", data);
      }
    }
  });

  socket.on("workspace_editing_stop", (data) => {
    if (data && data.journeyId) {
      if (socket.rooms.has(data.journeyId)) {
        socket.to(data.journeyId).emit("workspace_editing_stopped", data);
      }
    }
  });

  socket.on("disconnect", (reason) => {
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
                status: "offline"
              });
            }
          }, 1500);
        }
      }
    } else {
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
                  status: "offline"
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

connectDB().
then(() => {
  server.listen(PORT, () => {
    logger.info(`[Server] running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}).
catch((error) => {
  logger.error(`[Server] Database connection failed: ${error.message}`);
});

const gracefulShutdown = (signal) => {
  logger.warn(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info("[Server] Express HTTP server closed.");
    try {
      await mongoose.connection.close();
      logger.info("[Server] MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      logger.error(`[Server] Error during database shutdown: ${err.message}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("[Server] Force shutdown triggered after timeout limit.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = { app, server, io };