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
        required: true,
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

    // Tracks when each member last read messages in this room (for unread counts)
    lastReadBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        seenAt: { type: Date, default: Date.now }
      }
    ],

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

// High-performance index for loading active chat list sorted by newest message activity
chatRoomSchema.index({ members: 1, updatedAt: -1 });

// Optimize lookups for specific trip integrations
chatRoomSchema.index({ travelGroupId: 1 }, { sparse: true });
chatRoomSchema.index({ journeyId: 1 }, { sparse: true });

// Enforce unique 1-to-1 rooms between identical participants
chatRoomSchema.index(
  { members: 1 },
  { 
    unique: true, 
    partialFilterExpression: { type: "direct" } 
  }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);