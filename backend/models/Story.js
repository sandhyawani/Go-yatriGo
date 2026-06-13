const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userPic: { type: String },
    media: { type: String, required: true }, // base64 or URL
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: { type: String, default: "" },
    captionPosition: { type: String, enum: ['top', 'center', 'bottom'], default: 'center' },
    captionColor: { type: String, default: 'white' },
    visibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hiddenFrom: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    song: {
      songTitle: String,
      artistName: String,
      audioUrl: String,
      startTime: Number,
      duration: Number
    },
    stickers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Legacy
    reactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Legacy
    viewers: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now }
    }],
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    storyReactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String },
      reactedAt: { type: Date, default: Date.now }
    }],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        userPic: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-deletes after 24 hours
  },
  { timestamps: true }
);

StorySchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model("Story", StorySchema);
