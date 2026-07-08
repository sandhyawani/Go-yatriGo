const mongoose = require("mongoose");

// Schema for comments on travel posts
const commentSchema = new mongoose.Schema(
  {
    // Reference to the post being commented on
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // User who wrote the comment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Comment content
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// High-performance index for loading a post's comment feed chronologically
commentSchema.index({ postId: 1, createdAt: -1 });

// Index for lookup chains tracking historical comments written by a specific user
commentSchema.index({ userId: 1 });

module.exports = mongoose.model("Comment", commentSchema);