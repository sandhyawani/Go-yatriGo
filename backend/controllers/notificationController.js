const Notification = require("../models/Notification");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");
const Journey = require("../models/Journey");
const ChatRoom = require("../models/ChatRoom");
const JoinRequest = require("../models/JoinRequest");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");
const { getNotificationCategory, normalizeNotification } = require("../utils/notificationHelper");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category } = req.query;

    const filter = { receiver: userId };
    if (category && category !== "All") {
      const catLower = category.toLowerCase();
      if (catLower === "messages" || catLower === "message") {
        filter.$or = [
          { category: { $in: ["Messages", "messages", "Message", "message"] } },
          { type: { $in: ["new_message", "message_request", "direct", "group"] } }
        ];
      } else if (catLower === "safety" || catLower === "safe") {
        filter.$or = [
          { category: { $in: ["Safety", "safety", "Safe", "safe"] } },
          { type: { $in: ["sos_alert", "emergency_alert", "safe_checkin", "warning", "admin_warning"] } }
        ];
      } else if (catLower === "journey") {
        filter.$or = [
          { category: { $in: ["Journey", "journey"] } },
          { type: { $in: ["journey_invitation", "journey_join_request", "join_request", "journey_created", "journey_updated"] } }
        ];
      } else {
        filter.category = new RegExp(`^${category}$`, "i");
      }
    }

    let notifications = [];

    try {
      notifications = await Notification.find(filter)
        .populate("sender", "name username pic img avatar profilePic isVerified")
        .populate("group", "title destination from")
        .populate("journey", "title destination origin startDate")
        .populate("post", "caption images media")
        .populate("story", "media caption")
        .populate("room", "name type members")
        .sort({ createdAt: -1 });
    } catch (dbError) {
      console.warn("Notification lookup failed, returning empty result:", dbError.message);
    }

    // All notifications for authoritative counts
    const allUserNotifs = await Notification.find({ receiver: userId }).select("category type isRead").lean();
    let unreadCount = 0;
    let journeyCount = 0;
    let socialCount = 0;
    let messagesCount = 0;
    let safetyCount = 0;

    allUserNotifs.forEach((n) => {
      if (!n.isRead) unreadCount++;
      const cat = (n.category || getNotificationCategory(n.type) || "Social").toLowerCase();
      if (cat === "journey" || cat.includes("trip")) journeyCount++;
      else if (cat === "messages" || cat === "message" || cat === "chat") messagesCount++;
      else if (cat === "safety" || cat === "safe" || cat === "emergency") safetyCount++;
      else socialCount++;
    });

    const normalizedNotifications = notifications.map(normalizeNotification);

    return res.status(200).json({
      success: true,
      notifications: normalizedNotifications,
      counts: {
        all: allUserNotifs.length,
        journey: journeyCount,
        social: socialCount,
        messages: messagesCount,
        safety: safetyCount,
        unread: unreadCount
      }
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      notifications: [],
      counts: { all: 0, journey: 0, social: 0, messages: 0, safety: 0, unread: 0 },
      message: error.message || "Server Error"
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiver: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    const unreadCount = await Notification.countDocuments({ receiver: userId, isRead: false });

    return res.status(200).json({
      success: true,
      notification: normalizeNotification(notification),
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany(
      {
        receiver: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiver: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    const unreadCount = await Notification.countDocuments({ receiver: userId, isRead: false });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      id: req.params.id,
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.deleteMany({
      receiver: userId,
      type: {
        $nin: [
          "follow_request",
          "journey_invitation",
          "message_request",
          "join_request",
          "journey_join_request"
        ]
      }
    });

    const remainingUnread = await Notification.countDocuments({
      receiver: userId,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: "Notifications cleared (pending requests preserved)",
      unreadCount: remainingUnread
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const sentList = [];
    const seenMap = new Set();

    const notifs = await Notification.find({
      sender: userId,
      type: {
        $in: [
          "follow_request",
          "join_request",
          "journey_join_request",
          "journey_invitation",
          "message_request"
        ]
      }
    })
      .populate("receiver", "name username pic img avatar profilePic userPic isVerified")
      .populate("group", "title destination from host")
      .populate("journey", "title destination origin startDate creator")
      .populate("room", "name type members")
      .populate("joinRequest", "groupId userId status")
      .populate("journeyJoinRequest", "journeyId userId status")
      .populate("invitation", "journey status invitedBy user")
      .sort({ createdAt: -1 })
      .lean();

    const pendingFollowUsers = await User.find({
      followRequests: userId
    }).select("name username pic img avatar profilePic userPic isVerified privateAccount").lean();

    const pendingJoinRequests = await JoinRequest.find({
      userId,
      status: "Pending"
    }).populate("groupId", "title destination from host").lean();

    const pendingJourneyJoinRequests = await JourneyJoinRequest.find({
      userId,
      status: "pending"
    }).populate("journeyId", "title destination origin startDate creator").lean();

    const pendingJourneyInvitations = await JourneyInvitation.find({
      invitedBy: userId,
      status: "pending"
    })
      .populate("user", "name username pic img avatar profilePic userPic isVerified")
      .populate("journey", "title destination origin startDate").lean();

    const pendingChatRooms = await ChatRoom.find({
      requestedBy: userId,
      requestStatus: "pending"
    }).populate("members", "name username pic img avatar profilePic userPic isVerified").lean();

    for (const n of notifs) {
      const type = n.type;
      const receiver = n.receiver;
      if (!receiver) continue;

      const receiverId = receiver._id?.toString();
      const notifId = n._id?.toString();

      if (type === "follow_request") {
        const key = `follow_${receiverId}`;
        seenMap.add(key);
        sentList.push({
          _id: notifId,
          id: notifId,
          type: "follow_request",
          category: "Social",
          recipient: receiver,
          receiver,
          targetId: receiverId,
          targetName: receiver.name || receiver.username || "Traveler",
          message: `You requested to follow @${receiver.username || receiver.name || "traveler"}`,
          status: "pending",
          createdAt: n.createdAt,
          cancelType: "follow",
          cancelId: receiverId
        });
      } else if (type === "join_request") {
        const groupId = n.group?._id?.toString() || n.metadata?.groupId;
        const key = `group_${groupId}`;
        seenMap.add(key);
        sentList.push({
          _id: notifId,
          id: notifId,
          type: "join_request",
          category: "Journey",
          recipient: receiver,
          receiver,
          group: n.group,
          targetId: groupId,
          targetName: n.group?.title || "Travel Group",
          message: `You requested to join ${n.group?.title ? `"${n.group.title}"` : "squad trip"}`,
          status: "pending",
          createdAt: n.createdAt,
          cancelType: "buddy",
          cancelId: groupId
        });
      } else if (type === "journey_join_request") {
        const journeyId = n.journey?._id?.toString() || n.metadata?.journeyId;
        const reqId = n.journeyJoinRequest?._id?.toString() || notifId;
        const key = `journey_join_${journeyId}`;
        seenMap.add(key);
        sentList.push({
          _id: notifId,
          id: notifId,
          type: "journey_join_request",
          category: "Journey",
          recipient: receiver,
          receiver,
          journey: n.journey,
          targetId: journeyId,
          targetName: n.journey?.title || "Journey",
          message: `You requested to join ${n.journey?.title ? `"${n.journey.title}"` : "journey"}`,
          status: "pending",
          createdAt: n.createdAt,
          cancelType: "journey_join",
          cancelId: reqId,
          journeyId: journeyId
        });
      } else if (type === "journey_invitation") {
        const journeyId = n.journey?._id?.toString();
        const invId = n.invitation?._id?.toString() || notifId;
        const key = `journey_invite_${invId}`;
        seenMap.add(key);
        sentList.push({
          _id: notifId,
          id: notifId,
          type: "journey_invitation",
          category: "Journey",
          recipient: receiver,
          receiver,
          journey: n.journey,
          targetId: journeyId,
          targetName: n.journey?.title || "Journey",
          message: `You invited ${receiver.name || receiver.username || "traveler"} to ${n.journey?.title ? `"${n.journey.title}"` : "journey"}`,
          status: "pending",
          createdAt: n.createdAt,
          cancelType: "journey_invite",
          cancelId: invId
        });
      } else if (type === "message_request") {
        const roomId = n.room?._id?.toString();
        const key = `chat_${roomId || receiverId}`;
        seenMap.add(key);
        sentList.push({
          _id: notifId,
          id: notifId,
          type: "message_request",
          category: "Messages",
          recipient: receiver,
          receiver,
          room: n.room,
          targetId: roomId,
          targetName: receiver.name || "Chat",
          message: `You sent a message request to @${receiver.username || receiver.name || "traveler"}`,
          status: "pending",
          createdAt: n.createdAt,
          cancelType: "chat",
          cancelId: roomId
        });
      }
    }

    for (const targetUser of pendingFollowUsers) {
      const targetId = targetUser._id?.toString();
      const key = `follow_${targetId}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        sentList.push({
          _id: `follow_${targetId}`,
          id: `follow_${targetId}`,
          type: "follow_request",
          category: "Social",
          recipient: targetUser,
          receiver: targetUser,
          targetId: targetId,
          targetName: targetUser.name || targetUser.username || "Traveler",
          message: `You requested to follow @${targetUser.username || targetUser.name || "traveler"}`,
          status: "pending",
          createdAt: targetUser.updatedAt || new Date(),
          cancelType: "follow",
          cancelId: targetId
        });
      }
    }

    for (const jr of pendingJoinRequests) {
      if (!jr.groupId) continue;
      const groupId = jr.groupId._id?.toString();
      const key = `group_${groupId}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        sentList.push({
          _id: jr._id?.toString(),
          id: jr._id?.toString(),
          type: "join_request",
          category: "Journey",
          group: jr.groupId,
          targetId: groupId,
          targetName: jr.groupId.title || "Travel Group",
          message: `You requested to join ${jr.groupId.title ? `"${jr.groupId.title}"` : "squad trip"}`,
          status: "pending",
          createdAt: jr.createdAt,
          cancelType: "buddy",
          cancelId: groupId
        });
      }
    }

    for (const jjr of pendingJourneyJoinRequests) {
      if (!jjr.journeyId) continue;
      const journeyId = jjr.journeyId._id?.toString();
      const key = `journey_join_${journeyId}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        sentList.push({
          _id: jjr._id?.toString(),
          id: jjr._id?.toString(),
          type: "journey_join_request",
          category: "Journey",
          journey: jjr.journeyId,
          targetId: journeyId,
          targetName: jjr.journeyId.title || "Journey",
          message: `You requested to join ${jjr.journeyId.title ? `"${jjr.journeyId.title}"` : "journey"}`,
          status: "pending",
          createdAt: jjr.createdAt,
          cancelType: "journey_join",
          cancelId: jjr._id?.toString(),
          journeyId: journeyId
        });
      }
    }

    for (const ji of pendingJourneyInvitations) {
      const invId = ji._id?.toString();
      const key = `journey_invite_${invId}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        sentList.push({
          _id: invId,
          id: invId,
          type: "journey_invitation",
          category: "Journey",
          recipient: ji.user,
          receiver: ji.user,
          journey: ji.journey,
          targetId: ji.journey?._id?.toString(),
          targetName: ji.journey?.title || "Journey",
          message: `You invited ${ji.user?.name || ji.user?.username || "traveler"} to ${ji.journey?.title ? `"${ji.journey.title}"` : "journey"}`,
          status: "pending",
          createdAt: ji.createdAt,
          cancelType: "journey_invite",
          cancelId: invId
        });
      }
    }

    for (const cr of pendingChatRooms) {
      const otherUser = cr.members?.find((m) => m._id?.toString() !== userId.toString());
      const roomId = cr._id?.toString();
      const key = `chat_${roomId || otherUser?._id?.toString()}`;
      if (!seenMap.has(key) && otherUser) {
        seenMap.add(key);
        sentList.push({
          _id: roomId,
          id: roomId,
          type: "message_request",
          category: "Messages",
          recipient: otherUser,
          receiver: otherUser,
          room: cr,
          targetId: roomId,
          targetName: otherUser.name || "Chat",
          message: `You sent a message request to @${otherUser.username || otherUser.name || "traveler"}`,
          status: "pending",
          createdAt: cr.createdAt,
          cancelType: "chat",
          cancelId: roomId
        });
      }
    }

    sentList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      sentRequests: sentList,
      count: sentList.length
    });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load sent requests",
      sentRequests: [],
      count: 0
    });
  }
};

exports.cancelSentRequest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { cancelType, cancelId } = req.body || {};

    const targetType = cancelType || req.query.type;
    const targetId = cancelId || id;

    if (targetType === "follow") {
      await User.findByIdAndUpdate(targetId, {
        $pull: { followRequests: userId }
      });
      await Notification.findOneAndDelete({
        sender: userId,
        receiver: targetId,
        type: "follow_request"
      });
      const io = req.app.get("io");
      if (io) {
        io.to(targetId.toString()).emit("follow_request_rejected", { userId: userId.toString() });
      }
    } else if (targetType === "buddy") {
      await JoinRequest.findOneAndDelete({
        groupId: targetId,
        userId: userId
      });
      await Notification.findOneAndDelete({
        sender: userId,
        group: targetId,
        type: "join_request"
      });
    } else if (targetType === "journey_join") {
      const jjr = await JourneyJoinRequest.findById(targetId);
      if (jjr) {
        jjr.status = "cancelled";
        await jjr.save();
      } else {
        await JourneyJoinRequest.findOneAndUpdate(
          { journeyId: targetId, userId: userId },
          { status: "cancelled" }
        );
      }
      await Notification.findOneAndDelete({
        sender: userId,
        journey: targetId,
        type: "journey_join_request"
      });
    } else if (targetType === "journey_invite") {
      await JourneyInvitation.findByIdAndDelete(targetId);
      await Notification.findOneAndDelete({
        sender: userId,
        invitation: targetId,
        type: "journey_invitation"
      });
    } else {
      // General notification deletion if matching sender
      await Notification.findOneAndDelete({
        _id: targetId,
        sender: userId
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling sent request:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel sent request"
    });
  }
};