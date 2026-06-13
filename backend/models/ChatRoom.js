const mongoose = require("mongoose");

const ChatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    travelGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup" },
    requestStatus: { type: String, enum: ["pending", "accepted", "declined", "blocked"], default: "pending" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", ChatRoomSchema);
