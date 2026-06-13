const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: ["join_request", "request_approved", "request_rejected", "new_message", "message_request", "new_follower", "follow_request", "post_like", "post_comment", "story_like", "story_reply", "follow", "trip_cancelled", "admin_warning", "group_joined", "group_left", "direct", "group", "warning", "follow_accept"], 
      required: true 
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
