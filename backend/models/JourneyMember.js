const mongoose = require("mongoose");

// Dedicated relational schema for journey members and role management
const journeyMemberSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["Organizer", "Co-Organizer", "Member"],
      default: "Member",
    },
    status: {
      type: String,
      enum: ["active", "left", "removed"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate active memberships
journeyMemberSchema.index({ journeyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("JourneyMember", journeyMemberSchema);
