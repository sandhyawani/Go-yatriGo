const mongoose = require("mongoose");

// Schema for travel memories/posts
const postSchema = new mongoose.Schema(
  {
    // User who created the post
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User information (stored for faster display)
    userName: {
      type: String,
      required: true,
      trim: true,
    },

    userPic: {
      type: String,
      default: "",
    },

    // Optional title
    title: {
      type: String,
      trim: true,
      default: "",
    },

    // Main caption
    caption: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    // Travel location
    location: {
      type: String,
      trim: true,
      default: "",
    },

    // Searchable tags
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Legacy media fields (kept for backward compatibility)
    image: {
      type: String,
      default: "",
    },

    mediaUrl: {
      type: String,
      default: "",
    },

    // Multiple images/videos for carousel posts
    mediaUrls: [
      {
        type: String,
      },
    ],

    // Media type
    mediaType: {
      type: String,
      enum: ["image", "video", "carousel"],
      default: "image",
    },

    // Type of post
    postType: {
      type: String,
      enum: [
        "travel_memory",
        "travel_photo",
        "travel_video",
        "document",
        "profile_update",
        "general",
      ],
      default: "travel_memory",
    },

    // Optional background music
    music: {
      title: {
        type: String,
        default: "",
      },
      artist: {
        type: String,
        default: "",
      },
      cover: {
        type: String,
        default: "",
      },
      preview: {
        type: String,
        default: "",
      },
    },

    // Tagged users
    taggedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Attached active journey
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
      index: true,
    },

    // Privacy options
    disableComments: {
      type: Boolean,
      default: false,
    },

    hideLikes: {
      type: Boolean,
      default: false,
    },

    // Users who liked the post
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Comments on the post
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Database Indexes
// User profile feed
postSchema.index({ userId: 1, createdAt: -1 });

// Global feed
postSchema.index({ createdAt: -1 });

// Search optimization
postSchema.index({ location: "text", caption: "text", tags: "text" });

module.exports = mongoose.model("Post", postSchema);