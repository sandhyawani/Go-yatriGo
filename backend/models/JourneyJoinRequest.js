const mongoose = require("mongoose");

const journeyJoinRequestSchema = new mongoose.Schema(
{
  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "expired", "capacity_full"],
    default: "pending",
    index: true
  },
  message: {
    type: String,
    default: "",
    trim: true,
    maxlength: 300
  }
},
{
  timestamps: true
}
);

// Partial unique index for "pending" requests
// A user can only have one pending request per journey at a time
journeyJoinRequestSchema.index(
  { journeyId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("JourneyJoinRequest", journeyJoinRequestSchema);
