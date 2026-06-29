const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: [
        "join_request", "request_approved", "request_rejected", "new_message", "message_request", 
        "new_follower", "follow_request", "post_like", "post_comment", "story_like", "story_reply", 
        "follow", "trip_cancelled", "admin_warning", "group_joined", "group_left", "direct", "group", 
        "warning", "follow_accept",
        "journey_created", "journey_invitation", "journey_invitation_accepted", "journey_started", 
        "journey_completed", "journey_cancelled", "safe_checkin", "journey_member_joined", 
        "journey_member_left", "journey_updated", "memory_added"
      ], 
      required: true 
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup" },
    journey: { type: mongoose.Schema.Types.ObjectId, ref: "Journey" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
