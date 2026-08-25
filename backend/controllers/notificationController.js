const Notification = require("../models/Notification");
const { getNotificationCategory, normalizeNotification } = require("../utils/notificationHelper");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category } = req.query;

    const filter = { receiver: userId };
    if (category && category !== "All") {
      filter.category = category;
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

    // Authoritative backend counts for the user
    const [allCount, journeyCount, socialCount, messagesCount, safetyCount, unreadCount] = await Promise.all([
      Notification.countDocuments({ receiver: userId }),
      Notification.countDocuments({ receiver: userId, category: "Journey" }),
      Notification.countDocuments({ receiver: userId, category: "Social" }),
      Notification.countDocuments({ receiver: userId, category: "Messages" }),
      Notification.countDocuments({ receiver: userId, category: "Safety" }),
      Notification.countDocuments({ receiver: userId, isRead: false })
    ]);

    const normalizedNotifications = notifications.map(normalizeNotification);

    return res.status(200).json({
      success: true,
      notifications: normalizedNotifications,
      counts: {
        all: allCount,
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
    await Notification.deleteMany({ receiver: userId });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted",
      unreadCount: 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};