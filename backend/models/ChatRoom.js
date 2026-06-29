const mongoose = require("mongoose");

// Schema for one-to-one and group chat rooms
const chatRoomSchema = new mongoose.Schema(
  {
    // Chat room name (mainly used for group chats)
    name: {
      type: String,
      default: "",
      trim: true,
    },

    // Chat type: direct (1-to-1) or group
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    // Users participating in the chat
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Associated travel group (only for group chats)
    travelGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelGroup",
      default: null,
    },

    // Associated journey (for collaborative journeys)
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
    },

    // Request status for direct chat requests
    requestStatus: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
    },

    // User who initiated the chat request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Date when the request was accepted
    acceptedAt: {
      type: Date,
      default: null,
    },

    // Users who have muted this chat
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users who have pinned this chat
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users who have deleted/hidden this chat from their list
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Improve query performance
chatRoomSchema.index({ members: 1 });
chatRoomSchema.index({ travelGroupId: 1 });
chatRoomSchema.index({ journeyId: 1 });
chatRoomSchema.index({ type: 1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);