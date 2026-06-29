const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Server } = require("socket.io");

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

    if (
      allowedClientOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith(".vercel.app") ||
      normalizedOrigin.includes("localhost") ||
      normalizedOrigin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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
  console.log("User connected:", socket.id);

  socket.on("go_online", (userId) => {
    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("user_presence", {
      userId,
      online: true,
    });
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
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

  socket.on("mark_messages_read", (data) => {
    socket.to(data.roomId).emit("messages_read", data);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        socket.broadcast.emit("user_presence", {
          userId,
          online: false,
        });

        break;
      }
    }

    console.log("User disconnected:", socket.id);
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
