const mongoose = require("mongoose");

// Schema for user privacy and security preferences
const securityPreferenceSchema = new mongoose.Schema(
  {
    // User associated with these preferences
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Who can view the user's profile
    profileVisibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },

    // Show online/offline status
    onlineVisibility: {
      type: Boolean,
      default: true,
    },

    // Allow other users to send follow requests
    allowFollowRequests: {
      type: Boolean,
      default: true,
    },

    // Allow travel group invitations
    allowTripInvites: {
      type: Boolean,
      default: true,
    },

    // Allow direct message requests
    allowMessageRequests: {
      type: Boolean,
      default: true,
    },

    // Share live location during trips
    locationSharing: {
      type: Boolean,
      default: false,
    },

    // Share emergency information with trusted contacts
    emergencySharing: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Database Indexes
// Fast lookup of a user's security preferences
securityPreferenceSchema.index({ user: 1 });

module.exports = mongoose.model(
  "SecurityPreference",
  securityPreferenceSchema
);