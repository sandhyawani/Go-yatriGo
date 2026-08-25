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

// Partial unique index for Pending requests to allow users to request again if previously rejected
JoinRequestSchema.index(
  { groupId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);

module.exports = mongoose.model("JoinRequest", JoinRequestSchema);