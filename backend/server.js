const http = require("http");
const path = require("path");

require("./config/nodeCompatibility");
require("dotenv").config();
require("colors");

const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.REACT_APP_CLIENT_URL,
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://10.126.5.219:3000",
];

const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

function mountRoute(basePath, routePath) {
  try {
    app.use(basePath, require(routePath));
    console.log(`Mounted ${basePath}`);
  } catch (error) {
    console.error(`Failed to mount ${basePath}: ${error.message}`);
  }
}

mountRoute("/api/admin", "./routes/adminRoutes");
mountRoute("/api/auth", "./routes/authRoutes");
mountRoute("/api/chat", "./routes/chatRoutes");
mountRoute("/api/contact", "./routes/contactRoutes");
mountRoute("/api/emergency", "./routes/emergencyRoutes");
mountRoute("/api/legal", "./routes/legal");
mountRoute("/api/music", "./routes/musicRoute");
mountRoute("/api/notifications", "./routes/notificationRoutes");
mountRoute("/api/posts", "./routes/postRoutes");
mountRoute("/api/security", "./routes/securityRoutes");
mountRoute("/api/settings", "./routes/settings");
mountRoute("/api/social", "./routes/socialTravelRoute");
mountRoute("/api/stories", "./routes/storyRoutes");
mountRoute("/api/support", "./routes/supportRoutes");
mountRoute("/api/upload", "./routes/uploadRoute");
mountRoute("/api/users", "./routes/userRoutes");

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.status || error.statusCode || 500;

  console.error(error.stack || error.message);
  res.status(statusCode).json({
    message: error.message || "Server error",
  });
});

const io = new Server(server, {
  cors: corsOptions,
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("go_online", (userId) => {
    if (!userId) return;

    onlineUsers.set(String(userId), socket.id);
    socket.broadcast.emit("user_presence", { userId, online: true });
  });

  socket.on("join_room", (roomId) => {
    if (roomId) socket.join(String(roomId));
  });

  socket.on("send_chat_message", (payload) => {
    const roomId = payload && payload.roomId;
    if (roomId) {
      socket.to(String(roomId)).emit("receive_chat_message", payload);
    }
  });

  socket.on("typing", (payload) => {
    const roomId = payload && payload.roomId;
    if (roomId) {
      socket.to(String(roomId)).emit("is_typing", payload);
    }
  });

  socket.on("stop_typing", (payload) => {
    const roomId = payload && payload.roomId;
    if (roomId) {
      socket.to(String(roomId)).emit("not_typing", payload);
    }
  });

  socket.on("mark_messages_read", (payload) => {
    const roomId = payload && payload.roomId;
    if (roomId) {
      socket.to(String(roomId)).emit("messages_read", payload);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user_presence", { userId, online: false });
        break;
      }
    }
  });
});

connectDB()
  .catch((error) => {
    console.error(`Database setup failed: ${error.message}`);
  })
  .finally(() => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`.cyan.bold);
    });
  });

module.exports = { app, server, io };

// Trigger restart
