const mongoose = require("mongoose");

// Schema for collaborative travel journeys (strictly non-booking)
const journeySchema = new mongoose.Schema(
  {
    // Journey Title
    title: {
      type: String,
      required: [true, "Journey title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Description
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Cover Image (Cloudinary or local URL)
    coverImage: {
      type: String,
      default: "",
    },

    // Destination Name
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },

    // Optional Destination Coordinates
    destinationCoordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // Dates
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    // Privacy setting
    privacy: {
      type: String,
      enum: ["Public", "Followers Only", "Friends Only", "Private"],
      default: "Public",
      index: true,
    },

    // Journey Type
    journeyType: {
      type: String,
      enum: ["Solo", "Friends", "Group", "Solo Journey", "Shared Journey"],
      default: "Solo Journey",
      index: true,
    },

    // Lifecycle Status
    status: {
      type: String,
      enum: [
        "Planning",
        "Upcoming",
        "Ongoing",
        "Completed",
        "Cancelled",
        "Archived",
      ],
      default: "Planning",
      index: true,
    },

    // Journey Origin Architecture
    sourceType: {
      type: String,
      enum: [
        "explore",
        "friends",
        "followers",
        "travel_group",
        "manual",
        "ai_suggested",
        "community_event",
      ],
      default: "manual",
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    createdFrom: {
      type: String,
      default: "Manual Creation",
    },
    memberCount: {
      type: Number,
      default: 1,
    },
    acceptedInvitationCount: {
      type: Number,
      default: 0,
    },
    pendingInvitationCount: {
      type: Number,
      default: 0,
    },

    // Journey Creator/Owner
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Quick reference members list
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["Organizer", "Co-Organizer", "Member"],
          default: "Member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Associated Group Chat Room
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null,
    },

    // AI Journey Summary generated upon completion
    aiSummary: {
      type: String,
      default: "",
    },

    // Lifecycle timestamps
    cancelledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Media & Activity counters
    stats: {
      postsCount: { type: Number, default: 0 },
      storiesCount: { type: Number, default: 0 },
      photosCount: { type: Number, default: 0 },
      videosCount: { type: Number, default: 0 },
      checkInsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for duration in days
journeySchema.virtual("durationDays").get(function () {
  if (!this.startDate || !this.endDate) return 1;
  const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start and end day
  return diffDays > 0 ? diffDays : 1;
});

// Indexes for fast dashboard tab queries and search
journeySchema.index({ creator: 1, status: 1 });
journeySchema.index({ "members.user": 1, status: 1 });
journeySchema.index({
  destination: "text",
  title: "text",
  description: "text",
});

module.exports = mongoose.model("Journey", journeySchema);
