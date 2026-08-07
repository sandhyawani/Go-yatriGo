const mongoose = require("mongoose");

const travelGroupSchema = new mongoose.Schema(
{
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  destination: {
    type: String,
    required: true,
    trim: true
  },

  from: {
    type: String,
    default: "",
    trim: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  maxMembers: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  coverImage: {
    type: String,
    default: ""
  },

  budget: {
    type: Number,
    default: 0,
    min: 0
  },

  members: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    role: {
      type: String,
      enum: ["host", "cohost", "member"],
      default: "member"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],


  bannedUsers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  warnings: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    message: {
      type: String,
      trim: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }],


  activityLogs: [
  {
    action: {
      type: String,
      trim: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }],


  category: {
    type: String,
    default: "Adventure",
    trim: true
  },

  isPrivate: {
    type: Boolean,
    default: false,
    index: true
  },

  tags: [
  {
    type: String,
    trim: true
  }],


  likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  allowJoinAfterStart: {
    type: Boolean,
    default: true
  },

  status: {
    type: String,
    enum: ["open", "full", "completed", "cancelled"],
    default: "open",
    index: true
  },

  completedAt: Date,

  cancelledAt: Date,

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },

  isCancelled: {
    type: Boolean,
    default: false
  },

  lastActivityAt: {
    type: Date,
    default: Date.now
  }
},
{
  timestamps: true,
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
}
);

travelGroupSchema.virtual("lifecycleStatus").get(function () {
  if (this.status === "cancelled") return "cancelled";

  const now = new Date();

  if (this.endDate < now) return "completed";

  if (this.startDate > now) return "upcoming";

  return "active";
});

travelGroupSchema.index({ host: 1 });

travelGroupSchema.index({ destination: 1 });

travelGroupSchema.index({ category: 1 });

travelGroupSchema.index({ startDate: 1 });

travelGroupSchema.index({ status: 1 });

travelGroupSchema.index({ isPrivate: 1 });

travelGroupSchema.index({ createdAt: -1 });

module.exports = mongoose.model("TravelGroup", travelGroupSchema);