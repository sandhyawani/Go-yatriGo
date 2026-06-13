const mongoose = require("mongoose");

const TravelGroupSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    from: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxMembers: { type: Number, required: true, default: 5 },
    description: { type: String, required: true },
    coverImage: { type: String, default: "" }, // base64 or URL
    budget: { type: Number, default: 0 },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["host", "cohost", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    warnings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    activityLogs: [
      {
        action: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    category: { type: String, default: "Adventure" },
    isPrivate: { type: Boolean, default: false },
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["open", "full", "completed", "cancelled"],
      default: "open",
    },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: { type: String },
    isCancelled: { type: Boolean, default: false },
    lastActivityAt: { type: Date },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

TravelGroupSchema.virtual('lifecycleStatus').get(function() {
  if (this.status === 'cancelled') return 'cancelled';
  
  const now = new Date();
  if (this.endDate && this.endDate < now) return 'completed';
  if (this.startDate && this.startDate > now) return 'upcoming';
  return 'active'; // today is between startDate and endDate
});

TravelGroupSchema.index({ host: 1 });
TravelGroupSchema.index({ isPrivate: 1 });

module.exports = mongoose.model("TravelGroup", TravelGroupSchema);
