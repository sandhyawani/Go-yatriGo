const mongoose = require("mongoose");

// Schema for chat messages
const messageSchema = new mongoose.Schema(
  {
    // Chat room where the message belongs
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },

    // User who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Sender information (stored for faster retrieval)
    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderPic: {
      type: String,
      default: "",
    },

    // Legacy text field (kept for backward compatibility)
    text: {
      type: String,
      trim: true,
      default: "",
    },

    // Preferred message content field
    content: {
      type: String,
      trim: true,
      default: "",
    },

    // Media attachment (Cloudinary URL)
    media: {
      type: String,
      default: "",
    },

    // Story reference for story replies
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      default: null,
    },

    // Users who haven't read the message yet
    unreadBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users who have seen the message
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users to whom the message has been delivered
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Emoji reactions
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    // Users who deleted the message from their chat
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Indicates whether the sender unsent the message
    isUnsent: {
      type: Boolean,
      default: false,
    },

    // Time when the message was unsent
    unsentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Improve query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ storyId: 1 });

module.exports = mongoose.model("Message", messageSchema);