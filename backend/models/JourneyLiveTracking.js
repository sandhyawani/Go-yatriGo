const mongoose = require("mongoose");

const journeyLiveTrackingSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    autoTrackingEnabled: {
      type: Boolean,
      default: false
    },
    isLive: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      heading: { type: Number, default: null },
      speed: { type: Number, default: null },
      timestamp: { type: Date, default: null }
    },
    // Bounded recent trail (sampled coordinates, capped to prevent unbounded document size)
    recentTrail: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    distanceTraveled: {
      type: Number,
      default: 0 // Distance in kilometers
    },
    lastActive: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

journeyLiveTrackingSchema.index({ journeyId: 1, userId: 1 }, { unique: true });
journeyLiveTrackingSchema.index({ journeyId: 1, isLive: 1 });

module.exports = mongoose.model("JourneyLiveTracking", journeyLiveTrackingSchema);
