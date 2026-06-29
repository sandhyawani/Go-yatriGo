const mongoose = require("mongoose");

// Schema for journey member invites and user join requests
const journeyInvitationSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["invitation", "request"],
      default: "invitation",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days default
      index: true,
    },
    role: {
      type: String,
      enum: ["Organizer", "Co-Organizer", "Member"],
      default: "Member",
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  },
);

journeyInvitationSchema.index({ journeyId: 1, inviteeId: 1, status: 1 });

module.exports = mongoose.model("JourneyInvitation", journeyInvitationSchema);
