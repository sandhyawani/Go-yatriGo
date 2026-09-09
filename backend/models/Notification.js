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
    typeStr.includes("host_transferred") ||
    typeStr.includes("workspace") ||
    typeStr.includes("co_leader")
  ) {
    return "Journey";
  }
  if (
    typeStr.includes("message") ||
    typeStr.includes("direct") ||
    typeStr.includes("chat") ||
    typeStr.includes("mention") ||
    typeStr.includes("reply")
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
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        // Social / Connections
        "follow_request",
        "follow",
        "follow_accept",
        "follow_reject",
        "unfollow",
        "request_cancelled",
        "user_review",
        "new_follower",
        // Groups (TravelBuddy)
        "group_created",
        "group_joined",
        "join_request",
        "request_approved",
        "request_rejected",
        "request_accept",
        "request_reject",
        "group_invite",
        "group_left",
        "group_member_removed",
        "group_admin_promoted",
        "group_updated",
        "group_warning",
        "trip_cancelled",
        // Journeys
        "journey_created",
        "journey_invitation",
        "journey_invitation_accepted",
        "journey_invite_accepted",
        "journey_invitation_rejected",
        "journey_join_request",
        "journey_join_request_accepted",
        "journey_join_request_rejected",
        "journey_member_joined",
        "journey_member_left",
        "journey_member_removed",
        "journey_role_updated",
        "journey_host_transferred",
        "host_transferred",
        "journey_started",
        "journey_completed",
        "journey_cancelled",
        "journey_updated",
        // Messages / Chat
        "new_message",
        "group_message",
        "message_mention",
        "message_reply",
        "message_reaction",
        "message_request",
        "message_request_accepted",
        "message_request_rejected",
        "direct",
        "group",
        // Content / Social
        "post_like",
        "post_comment",
        "story_like",
        "story_reply",
        "story_reaction",
        "memory_comment",
        "memory_like",
        "memory_added",
        // Safety
        "sos_alert",
        "emergency_alert",
        "safe_checkin",
        "warning",
        "admin_warning"
      ],
      required: true
    },
    title: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Journey", "Social", "Messages", "Safety"],
      required: true,
      default: function () {
        return getNotificationCategory(this.type);
      }
    },
    // Direct link for deep navigation
    link: { type: String, default: "", trim: true },
    // Generic entity pointers
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityType: { type: String, default: "", trim: true },
    // Specific legacy entity references (retained for full backward compatibility)
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "TravelGroup" },
    journey: { type: mongoose.Schema.Types.ObjectId, refPath: "journeyModel" },
    journeyModel: { type: String, enum: ["Journey", "TravelGroup"], default: "Journey" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    journeyJoinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JourneyJoinRequest" },
    invitation: { type: mongoose.Schema.Types.ObjectId, ref: "JourneyInvitation" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ sender: 1, receiver: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ entityId: 1, entityType: 1 });

NotificationSchema.pre("validate", function (next) {
  if (!this.category) {
    this.category = getNotificationCategory(this.type);
  }
  next();
});

module.exports = mongoose.model("Notification", NotificationSchema);