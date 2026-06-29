const mongoose = require("mongoose");

// Schema for travel buddy groups
const travelGroupSchema = new mongoose.Schema(
  {
    // Trip creator
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Trip title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Destination
    destination: {
      type: String,
      required: true,
      trim: true,
    },

    // Starting location
    from: {
      type: String,
      default: "",
      trim: true,
    },

    // Trip dates
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // Maximum travelers allowed
    maxMembers: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },

    // Trip description
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Cover image (Cloudinary URL)
    coverImage: {
      type: String,
      default: "",
    },

    // Estimated budget
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Group members
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: ["host", "cohost", "member"],
          default: "member",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Users banned from joining
    bannedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Warning history
    warnings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        message: {
          type: String,
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Activity log
    activityLogs: [
      {
        action: {
          type: String,
          trim: true,
        },

        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Category
    category: {
      type: String,
      default: "Adventure",
      trim: true,
    },

    // Private/Public trip
    isPrivate: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Search tags
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Users who liked the trip
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Current trip status
    status: {
      type: String,
      enum: ["open", "full", "completed", "cancelled"],
      default: "open",
      index: true,
    },

    completedAt: Date,

    cancelledAt: Date,

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    isCancelled: {
      type: Boolean,
      default: false,
    },

    // Last activity timestamp
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// ----------------------
// Virtual Properties
// ----------------------

// Returns current lifecycle of the trip
travelGroupSchema.virtual("lifecycleStatus").get(function () {
  if (this.status === "cancelled") return "cancelled";

  const now = new Date();

  if (this.endDate < now) return "completed";

  if (this.startDate > now) return "upcoming";

  return "active";
});

// ----------------------
// Database Indexes
// ----------------------

travelGroupSchema.index({ host: 1 });

travelGroupSchema.index({ destination: 1 });

travelGroupSchema.index({ category: 1 });

travelGroupSchema.index({ startDate: 1 });

travelGroupSchema.index({ status: 1 });

travelGroupSchema.index({ isPrivate: 1 });

travelGroupSchema.index({ createdAt: -1 });

module.exports = mongoose.model("TravelGroup", travelGroupSchema);