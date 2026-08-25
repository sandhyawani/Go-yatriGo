const mongoose = require("mongoose");

const getNotificationCategory = (type) => {
  const typeStr = (type || "").toLowerCase();
  if (
    typeStr.includes("journey") ||
    typeStr.includes("trip") ||
    typeStr.includes("group") ||
    typeStr.includes("join_request") ||
    typeStr.includes("request_approved") ||
    typeStr.includes("request_rejected") ||
    typeStr.includes("request_accept") ||
    typeStr.includes("request_reject") ||
    typeStr.includes("host_transferred")
  ) {
    return "Journey";
  }
  if (
    typeStr.includes("message") ||
    typeStr.includes("direct") ||
    typeStr.includes("chat")
  ) {
    return "Messages";
  }
  if (
    typeStr.includes("safe") ||
    typeStr.includes("sos") ||
    typeStr.includes("emergency") ||
    typeStr.includes("warning") ||
    typeStr.includes("admin_warning")
  ) {
    return "Safety";
  }
  return "Social";
};

const NotificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "join_request", "request_approved", "request_rejected", "request_accept", "request_reject",
        "new_message", "message_request", "new_follower", "follow_request", "post_like", "post_comment",
        "story_like", "story_reply", "follow", "trip_cancelled", "admin_warning", "group_joined", "group_left",
        "direct", "group", "warning", "follow_accept",
        "journey_created", "journey_invitation", "journey_invitation_accepted", "journey_invite_accepted",
        "journey_started", "journey_completed", "journey_cancelled", "safe_checkin", "journey_member_joined",
        "journey_member_left", "journey_updated", "memory_added", "host_transferred", "journey_host_transferred",
        "journey_join_request", "journey_join_request_accepted", "journey_join_request_rejected",
        "sos_alert", "emergency_alert"
      ],
      required: true
    },
    category: {
      type: String,
      enum: ["Journey", "Social", "Messages", "Safety"],
      required: true,
      default: function () {
        return getNotificationCategory(this.type);
      }
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup" },
    journey: { type: mongoose.Schema.Types.ObjectId, refPath: "journeyModel" },
    journeyModel: { type: String, enum: ["Journey", "TravelGroup"], default: "Journey" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    journeyJoinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JourneyJoinRequest" },
    invitation: { type: mongoose.Schema.Types.ObjectId, ref: "JourneyInvitation" },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.pre("validate", function (next) {
  if (!this.category) {
    this.category = getNotificationCategory(this.type);
  }
  next();
});

module.exports = mongoose.model("Notification", NotificationSchema);