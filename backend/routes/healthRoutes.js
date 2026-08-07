const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { cloudinary } = require("../utils/cloudinary");

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime(),
    version: require("../package.json").version || "1.0.0",
    memoryUsage: process.memoryUsage()
  });
});

router.get("/live", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date()
  });
});

router.get("/ready", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const cloudinaryConfig = cloudinary.config();
  const isCloudinaryConfigured = !!(
  cloudinaryConfig.cloud_name &&
  cloudinaryConfig.api_key &&
  cloudinaryConfig.api_secret);


  const io = req.app.get("io");
  const isSocketInitialized = !!io;
  const activeSocketClients = io ? io.engine.clientsCount : 0;

  const isReady = dbStatus === "connected" && isCloudinaryConfigured && isSocketInitialized;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? "ready" : "not_ready",
    timestamp: new Date(),
    services: {
      database: {
        status: dbStatus,
        details: dbStatus === "connected" ? "Mongoose connection active" : "Mongoose connection disconnected"
      },
      cloudinary: {
        status: isCloudinaryConfigured ? "configured" : "unconfigured"
      },
      socketio: {
        status: isSocketInitialized ? "initialized" : "uninitialized",
        connectedClients: activeSocketClients
      }
    }
  });
});

module.exports = router;