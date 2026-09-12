const Notification = require("../models/Notification");
const User = require("../models/User");
const UserSettings = require("../models/UserSettings");

let socketIoInstance = null;

const setIo = (io) => {
  socketIoInstance = io;
};

const getIo = () => {
  if (socketIoInstance) return socketIoInstance;
  try {
    const serverModule = require("../server");
    if (serverModule && serverModule.io) {
      socketIoInstance = serverModule.io;
      return socketIoInstance;
    }
  } catch (err) {
  }
  return null;
};

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

const generateNotificationTitle = (type, senderName = "Go YatriGo") => {
  switch (type) {
    case "follow_request":
      return "New Follow Request";
    case "follow":
    case "new_follower":
      return "New Follower";
    case "follow_accept":
      return "Follow Request Accepted";
    case "follow_reject":
      return "Follow Request Declined";
    case "unfollow":
      return "Connection Update";
    case "request_cancelled":
      return "Request Cancelled";
    case "user_review":
      return "New Traveler Review";
    case "group_created":
      return "New Travel Group";
    case "group_joined":
      return "Member Joined Group";
    case "join_request":
      return "Group Join Request";
    case "request_approved":
    case "request_accept":
      return "Group Join Accepted";
    case "request_rejected":
    case "request_reject":
      return "Group Join Declined";
    case "group_invite":
      return "Group Invitation";
    case "group_left":
      return "Member Left Group";
    case "group_member_removed":
      return "Group Membership Update";
    case "group_admin_promoted":
      return "Role Updated";
    case "group_updated":
      return "Group Details Updated";
    case "group_warning":
    case "warning":
      return "Safety Warning";
    case "trip_cancelled":
      return "Trip Cancelled";
    case "journey_invitation":
      return "Journey Invitation";
    case "journey_invitation_accepted":
    case "journey_invite_accepted":
      return "Journey Invite Accepted";
    case "journey_invitation_rejected":
      return "Journey Invite Declined";
    case "journey_join_request":
      return "Journey Join Request";
    case "journey_join_request_accepted":
      return "Journey Request Accepted";
    case "journey_join_request_rejected":
      return "Journey Request Declined";
    case "journey_member_joined":
      return "New Companion Joined";
    case "journey_member_left":
      return "Companion Left Journey";
    case "journey_member_removed":
      return "Journey Membership Update";
    case "journey_role_updated":
      return "Journey Role Updated";
    case "journey_host_transferred":
    case "host_transferred":
      return "Host Ownership Transferred";
    case "journey_started":
      return "Journey Started";
    case "journey_completed":
      return "Journey Completed";
    case "journey_cancelled":
      return "Journey Cancelled";
    case "journey_updated":
      return "Journey Updated";
    case "new_message":
    case "direct":
      return `Message from ${senderName}`;
    case "group_message":
    case "group":
      return "New Group Message";
    case "message_mention":
      return `${senderName} mentioned you`;
    case "message_reply":
      return `${senderName} replied to your message`;
    case "message_reaction":
      return `${senderName} reacted to your message`;
    case "message_request":
      return "Chat Request";
    case "message_request_accepted":
      return "Chat Request Accepted";
    case "message_request_rejected":
      return "Chat Request Declined";
    case "post_like":
    case "memory_like":
      return "Memory Liked";
    case "post_comment":
    case "memory_comment":
      return "New Comment on Memory";
    case "story_like":
      return "Dispatch Liked";
    case "story_reply":
      return "Reply to Dispatch";
    case "story_reaction":
      return "Reaction to Dispatch";
    case "sos_alert":
    case "emergency_alert":
      return "🚨 EMERGENCY ALERT";
    case "safe_checkin":
      return "🛡️ Safe Check-in";
    default:
      return "Notification";
  }
};

const resolveDeepLink = (payload) => {
  if (payload.link) return payload.link;

  const {
    type,
    journey,
    group,
    room,
    post,
    story,
    entityId,
    entityType,
    sender
  } = payload;

  const typeStr = (type || "").toLowerCase();
  const journeyId = journey?._id || journey || (entityType === "Journey" ? entityId : null);
  const groupId = group?._id || group || (entityType === "TravelGroup" ? entityId : null);
  const roomId = room?._id || room || (entityType === "ChatRoom" ? entityId : null);
  const postId = post?._id || post || (entityType === "Post" ? entityId : null);
  const senderId = sender?._id || sender;

  if (typeStr.includes("sos") || typeStr.includes("emergency")) {
    return "/emergency-contacts";
  }
  if (journeyId) {
    return `/social/journeys/${journeyId.toString()}`;
  }
  if (groupId) {
    return `/social/buddy/${groupId.toString()}`;
  }
  if (roomId) {
    return `/social/chat/${roomId.toString()}`;
  }
  if (postId && senderId) {
    return `/profile/${senderId.toString()}?postId=${postId.toString()}`;
  }
  if (story) {
    return "/";
  }
  if (typeStr.includes("follow") || typeStr.includes("user_review")) {
    if (senderId) return `/profile/${senderId.toString()}`;
    return "/profile";
  }

  return "";
};

const normalizeNotification = (n) => {
  if (!n) return null;
  const obj = typeof n.toObject === "function" ? n.toObject() : { ...n };
  const rawCategory = obj.category || getNotificationCategory(obj.type);
  const catLower = (rawCategory || "").toLowerCase();
  let category = "Social";
  if (catLower === "journey" || catLower.includes("trip")) category = "Journey";
  else if (catLower === "messages" || catLower === "message" || catLower === "chat") category = "Messages";
  else if (catLower === "safety" || catLower === "safe" || catLower === "emergency") category = "Safety";
  else if (catLower === "social") category = "Social";
  else category = getNotificationCategory(obj.type);

  const msg = obj.message || obj.content || obj.text || "";
  const notifId = obj._id ? obj._id.toString() : obj.id ? obj.id.toString() : "";

  return {
    ...obj,
    id: notifId,
    _id: notifId,
    sender: obj.sender || null,
    actor: obj.sender || null,
    receiver: obj.receiver ? (obj.receiver._id || obj.receiver).toString() : null,
    recipient: obj.receiver ? (obj.receiver._id || obj.receiver).toString() : null,
    type: obj.type,
    title: obj.title || generateNotificationTitle(obj.type, obj.sender?.name),
    category,
    message: msg,
    content: msg,
    text: msg,
    link: obj.link || resolveDeepLink(obj),
    entityId: obj.entityId ? obj.entityId.toString() : null,
    entityType: obj.entityType || "",
    isRead: Boolean(obj.isRead),
    metadata: obj.metadata || {},
    createdAt: obj.createdAt || new Date()
  };
};

const isNotificationAllowedByPreferences = async (receiverId, type, category) => {
  if (
    category === "Safety" ||
    type.includes("sos") ||
    type.includes("emergency") ||
    type.includes("warning")
  ) {
    return true;
  }

  try {
    const settings = await UserSettings.findOne({ userId: receiverId }).lean();
    if (!settings) return true; // Default to enabled if no custom settings exist

    if (category === "Messages") {
      if (settings.messageNotifications === false) return false;
    }

    if (type.includes("follow") || type === "new_follower") {
      if (settings.followActivityNotifications === false) return false;
    }

    if (type.includes("request") && (type.includes("join") || type.includes("connection"))) {
      if (settings.connectionRequestNotifications === false) return false;
    }

    if (type.includes("journey_invitation") || type === "group_invite") {
      if (settings.journeyInviteNotifications === false) return false;
    }

    if (type.includes("journey_updated") || type === "group_updated" || type === "journey_role_updated") {
      if (settings.journeyUpdateNotifications === false) return false;
    }

    if (type.includes("trip") || type.includes("journey")) {
      if (settings.tripAlerts === false) return false;
    }

    if (
      type.includes("like") ||
      type.includes("comment") ||
      type.includes("reaction") ||
      type.includes("story")
    ) {
      if (settings.likesCommentsNotifications === false) return false;
    }

    return true;
  } catch (err) {
    console.error("[NotificationService] Error checking user settings:", err.message);
    return true; // Fail open to ensure notifications aren't lost
  }
};

const findDuplicateNotification = async ({ senderId, receiverId, type, entityId, group, journey, post, story, room }) => {
  const statefulRequestTypes = [
    "follow_request",
    "join_request",
    "journey_join_request",
    "journey_invitation",
    "message_request"
  ];

  if (statefulRequestTypes.includes(type)) {
    const query = {
      sender: senderId,
      receiver: receiverId,
      type,
      isRead: false
    };
    if (journey) query.journey = journey;
    if (group) query.group = group;
    if (room) query.room = room;

    const existingPending = await Notification.findOne(query).lean();
    if (existingPending) return existingPending;
  }

  const debounceTypes = [
    "post_like",
    "memory_like",
    "story_like",
    "story_reaction",
    "message_reaction",
    "safe_checkin"
  ];

  if (debounceTypes.includes(type)) {
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const query = {
      sender: senderId,
      receiver: receiverId,
      type,
      createdAt: { $gte: fifteenSecondsAgo }
    };
    if (post) query.post = post;
    if (story) query.story = story;
    if (room) query.room = room;
    if (journey) query.journey = journey;

    const recentDuplicate = await Notification.findOne(query).lean();
    if (recentDuplicate) return recentDuplicate;
  }

  return null;
};

const createNotification = async (payload, customIo = null) => {
  try {
    const {
      sender,
      actor,
      receiver,
      recipient,
      type,
      message,
      title,
      category: explicitCategory,
      link,
      entityId,
      entityType,
      journey,
      journeyModel,
      group,
      post,
      story,
      room,
      joinRequest,
      journeyJoinRequest,
      invitation,
      metadata,
      allowSelf = false
    } = payload;

    const senderId = sender || actor;
    const receiverId = receiver || recipient;

    if (!receiverId || !type) {
      console.warn("[NotificationService] Missing required recipient or type:", { senderId, receiverId, type });
      return null;
    }

    const senderStr = senderId ? senderId.toString() : null;
    const receiverStr = receiverId.toString();

    if (senderStr && senderStr === receiverStr && !allowSelf) {
      return null;
    }

    const category = explicitCategory || getNotificationCategory(type);

    const isAllowed = await isNotificationAllowedByPreferences(receiverStr, type, category);
    if (!isAllowed) {
      return null;
    }

    const resolvedEntityId = entityId || journey || group || post || story || room || null;
    const duplicate = await findDuplicateNotification({
      senderId: senderStr,
      receiverId: receiverStr,
      type,
      entityId: resolvedEntityId,
      group,
      journey,
      post,
      story,
      room
    });

    if (duplicate) {
      return normalizeNotification(duplicate);
    }

    const deepLink = resolveDeepLink({
      link,
      type,
      journey,
      group,
      room,
      post,
      story,
      entityId: resolvedEntityId,
      entityType,
      sender: senderStr
    });

    let finalTitle = title;
    if (!finalTitle) {
      let senderName = "A traveler";
      if (senderStr) {
        const senderUser = await User.findById(senderStr).select("name username").lean();
        if (senderUser) {
          senderName = senderUser.name || senderUser.username || "A traveler";
        }
      }
      finalTitle = generateNotificationTitle(type, senderName);
    }

    const notificationDoc = await Notification.create({
      sender: senderStr,
      receiver: receiverStr,
      type,
      title: finalTitle,
      category,
      message: message || finalTitle,
      link: deepLink,
      entityId: resolvedEntityId,
      entityType: entityType || (journey ? "Journey" : group ? "TravelGroup" : post ? "Post" : story ? "Story" : room ? "ChatRoom" : ""),
      journey,
      journeyModel: journeyModel || (group && !journey ? "TravelGroup" : "Journey"),
      group,
      post,
      story,
      room,
      joinRequest,
      journeyJoinRequest,
      invitation,
      metadata: metadata || {},
      isRead: false
    });

    const populated = await Notification.findById(notificationDoc._id)
      .populate("sender", "name username pic avatar img profilePic isVerified")
      .populate("group", "title destination from host")
      .populate("journey", "title destination origin startDate creator")
      .populate("post", "caption images media")
      .populate("story", "media caption")
      .populate("room", "name type members")
      .lean();

    const normalized = normalizeNotification(populated || notificationDoc);

    const io = customIo || getIo();
    if (io && receiverStr) {
      try {
        io.to(receiverStr).emit("new_notification", normalized);

        const unreadCount = await Notification.countDocuments({
          receiver: receiverStr,
          isRead: false
        });
        io.to(receiverStr).emit("notification_count", { unreadCount });
      } catch (socketErr) {
        console.error("[NotificationService] Socket emission error (notification preserved in DB):", socketErr.message);
      }
    }

    return normalized;
  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error);
    return null;
  }
};

const getUnreadCount = async (userId) => {
  try {
    if (!userId) return 0;
    return await Notification.countDocuments({ receiver: userId, isRead: false });
  } catch (err) {
    console.error("[NotificationService] Error counting unread:", err.message);
    return 0;
  }
};

module.exports = {
  createNotification,
  getUnreadCount,
  setIo,
  getIo,
  normalizeNotification,
  getNotificationCategory
};
