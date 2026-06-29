const mongoose = require("mongoose");

// Schema for social activity feed and animated timeline events
const journeyTimelineSchema = new mongoose.Schema(
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
    },
    userName: {
      type: String,
      default: "",
    },
    userPic: {
      type: String,
      default: "",
    },
    eventType: {
      type: String,
      enum: [
        "journey_created",
        "journey_started",
        "journey_completed",
        "member_joined",
        "member_left",
        "photo_uploaded",
        "story_added",
        "story_shared",
        "post_shared",
        "safe_checkin",
        "memory_shared",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // SOS / Safe check-in subtype
    checkInType: {
      type: String,
      enum: [
        "Started Journey",
        "Reached Destination",
        "Reached Accommodation",
        "Returning Home",
        "Reached Home Safely",
        "",
      ],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

journeyTimelineSchema.index({ journeyId: 1, createdAt: -1 });

module.exports = mongoose.model("JourneyTimeline", journeyTimelineSchema);
