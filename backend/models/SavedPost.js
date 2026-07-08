const mongoose = require("mongoose");

// Schema for storing users' saved posts
const savedPostSchema = new mongoose.Schema(
  {
    // User who saved the post
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Saved post
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Database Indexes
// Prevent duplicate saves by the same user
savedPostSchema.index(
  { userId: 1, postId: 1 },
  { unique: true }
);

// Speed up fetching saved posts
savedPostSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SavedPost", savedPostSchema);