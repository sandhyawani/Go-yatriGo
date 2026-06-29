const mongoose = require("mongoose");

// Schema for persistent archived Journey Memories page generated upon completion
const journeyMemorySchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    durationDays: {
      type: Number,
      default: 1,
    },
    participantsCount: {
      type: Number,
      default: 1,
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        pic: String,
        role: String,
      },
    ],
    // AI generated summary of the trip
    aiSummary: {
      type: String,
      default: "",
    },
    // Top timeline highlights
    highlights: [
      {
        title: String,
        eventType: String,
        createdAt: Date,
      },
    ],
    // Post-completion reactions & comments
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        userPic: String,
        text: { type: String, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("JourneyMemory", journeyMemorySchema);
