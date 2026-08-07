const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
{
  name: {
    type: String,
    default: "",
    trim: true
  },

  type: {
    type: String,
    enum: ["direct", "group"],
    default: "direct"
  },

  members: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],


  travelGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelGroup",
    default: null
  },

  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    default: null
  },

  requestStatus: {
    type: String,
    enum: ["pending", "accepted", "declined", "blocked"],
    default: "pending"
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  acceptedAt: {
    type: Date,
    default: null
  },

  lastReadBy: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seenAt: { type: Date, default: Date.now }
  }],


  mutedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  pinnedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  hiddenFor: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

},
{
  timestamps: true
}
);

chatRoomSchema.index({ members: 1, updatedAt: -1 });

chatRoomSchema.index({ travelGroupId: 1 }, { sparse: true });
chatRoomSchema.index({ journeyId: 1 }, { sparse: true });

chatRoomSchema.index(
{ members: 1 },
{
  unique: true,
  partialFilterExpression: { type: "direct" }
}
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);