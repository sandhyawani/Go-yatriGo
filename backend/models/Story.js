const mongoose = require("mongoose");

// Schema for temporary travel stories (auto deleted after 24 hours)
const storySchema = new mongoose.Schema(
  {
    // Story owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userPic: {
      type: String,
      default: "",
    },

    // Story media (Cloudinary URL)
    media: {
      type: String,
      required: true,
      trim: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    // Caption
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    captionPosition: {
      type: String,
      enum: ["top", "center", "bottom"],
      default: "center",
    },

    captionColor: {
      type: String,
      default: "white",
    },

    // Story privacy
    visibility: {
      type: String,
      enum: ["public", "private", "friends"],
      default: "public",
    },

    // Attached journey
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
      index: true,
    },

    // Users allowed to view private stories
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users hidden from viewing this story
    hiddenFrom: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Optional music
    song: {
      songTitle: String,
      artistName: String,
      audioUrl: String,
      startTime: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number,
        default: 0,
      },
    },

    // Stickers, GIFs, emojis, etc.
    stickers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // Legacy fields (kept for backward compatibility)
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Detailed viewers list
    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Emoji reactions
    storyReactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          trim: true,
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Story replies/comments
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        userPic: String,
        text: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Story expires automatically after 24 hours
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ----------------------
// Database Indexes
// ----------------------

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ visibility: 1 });
storySchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Story", storySchema);