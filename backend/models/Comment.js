const mongoose = require("mongoose");

// Schema for comments on travel posts
const commentSchema = new mongoose.Schema(
  {
    // Reference to the post being commented on
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    // User who wrote the comment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Username at the time of commenting
    userName: {
      type: String,
      required: true,
      trim: true,
    },

    // User profile picture
    userPic: {
      type: String,
      default: "",
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

// Improve query performance
commentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);