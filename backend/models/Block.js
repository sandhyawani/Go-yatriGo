const mongoose = require("mongoose");

// Schema to store blocked user relationships
const blockSchema = new mongoose.Schema(
  {
    // User who blocks another user
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User being blocked
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent duplicate block records
blockSchema.index(
  { blocker: 1, blocked: 1 },
  { unique: true }
);

module.exports = mongoose.model("Block", blockSchema);