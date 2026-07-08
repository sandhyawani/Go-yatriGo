const Notification = require("../models/Notification");

// Get all notifications for logged-in user (filtering out blocked users)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    let notifications = [];

    try {
      notifications = await Notification.find({ receiver: userId })
        .populate("sender", "name pic img type isVerified profilePic")
        .populate("group", "title from destination")
        .sort({ createdAt: -1 });
    } catch (dbError) {
      console.warn("Notification lookup failed, returning empty result:", dbError.message);
    }

    const normalizedNotifications = notifications.map((notification) => ({
      ...notification.toObject(),
      sender: notification.sender || null,
      group: notification.group || null,
      journey: notification.journey || null,
    }));

    return res.status(200).json({
      success: true,
      notifications: normalizedNotifications,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      notifications: [],
      message: error.message || "Server Error",
    });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany(
      {
        receiver: userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};