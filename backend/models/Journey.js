const mongoose = require("mongoose");

const journeySchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: [true, "Journey title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },

  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"]
  },

  coverImage: {
    type: String,
    default: ""
  },

  destination: {
    type: String,
    required: [true, "Destination is required"],
    trim: true
  },

  from: {
    type: String,
    default: "",
    trim: true
  },

  destinationCoordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },

  startDate: {
    type: Date,
    required: [true, "Start date is required"],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },

  privacy: {
    type: String,
    enum: ["Public", "Followers Only", "Friends Only", "Private"],
    default: "Public",
    index: true
  },

  journeyType: {
    type: String,
    enum: ["Solo", "Friends", "Group", "Solo Journey", "Shared Journey"],
    default: "Solo Journey",
    index: true
  },

  status: {
    type: String,
    enum: [
    "Planning",
    "Upcoming",
    "Ongoing",
    "Completed",
    "Cancelled",
    "Archived"],

    default: "Planning",
    index: true
  },

  sourceType: {
    type: String,
    enum: [
    "explore",
    "friends",
    "followers",
    "travel_group",
    "manual",
    "ai_suggested",
    "community_event"],

    default: "manual",
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  createdFrom: {
    type: String,
    default: "Manual Creation"
  },
  memberCount: {
    type: Number,
    default: 1
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  acceptedInvitationCount: {
    type: Number,
    default: 0
  },
  pendingInvitationCount: {
    type: Number,
    default: 0
  },

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  members: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      enum: ["Organizer", "Co-Organizer", "Member"],
      default: "Member"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],


  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    default: null
  },

  aiSummary: {
    type: String,
    default: ""
  },

  cancelledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },

  stats: {
    postsCount: { type: Number, default: 0 },
    storiesCount: { type: Number, default: 0 },
    photosCount: { type: Number, default: 0 },
    videosCount: { type: Number, default: 0 },
    checkInsCount: { type: Number, default: 0 }
  }
},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

journeySchema.virtual("durationDays").get(function () {
  if (!this.startDate || !this.endDate) return 1;
  const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
});

journeySchema.index({ creator: 1, status: 1 });
journeySchema.index({ "members.user": 1, status: 1 });
journeySchema.index({
  destination: "text",
  title: "text",
  description: "text"
});

module.exports = mongoose.model("Journey", journeySchema);