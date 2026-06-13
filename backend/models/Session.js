const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    deviceType: {
      type: String, // e.g., 'mobile', 'desktop', 'tablet'
      default: "desktop",
    },
    ipAddress: {
      type: String,
      default: "Unknown",
    },
    location: {
      type: String, // Approximate city/country
      default: "Unknown",
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
