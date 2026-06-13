const mongoose = require("mongoose");

const securityPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profileVisibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
    onlineVisibility: {
      type: Boolean,
      default: true,
    },
    allowFollowRequests: {
      type: Boolean,
      default: true,
    },
    allowTripInvites: {
      type: Boolean,
      default: true,
    },
    allowMessageRequests: {
      type: Boolean,
      default: true,
    },
    locationSharing: {
      type: Boolean,
      default: false,
    },
    emergencySharing: {
      type: Boolean,
      default: true, // Allow emergency contacts to see active trips
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityPreference", securityPreferenceSchema);
