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

// Optimize reverse queries (checking if current user is blocked by someone)
blockSchema.index({ blocked: 1 });

// Prevent users from blocking themselves
blockSchema.pre("save", function (next) {
  if (this.blocker.toString() === this.blocked.toString()) {
    return next(new Error("You cannot block yourself."));
  }
  next();
});

module.exports = mongoose.model("Block", blockSchema);