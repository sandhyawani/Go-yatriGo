const mongoose = require("mongoose");

const JoinRequestSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

// Prevent duplicate pending/approved requests for the same user in a group
JoinRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("JoinRequest", JoinRequestSchema);
