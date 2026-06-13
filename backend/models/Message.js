const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderPic: { type: String },
    text: { type: String }, // Kept for backward compatibility
    content: { type: String }, // New preferred field for text
    media: { type: String }, // Cloudinary URL
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" }, // For story replies
    unreadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For backward compatibility unread counts
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }
      }
    ],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isUnsent: { type: Boolean, default: false },
    unsentAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
