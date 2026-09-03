const Notification = require('../models/Notification');
const { getValidTripMates } = require('../controllers/tripMateController');

const getNotificationCategory = (type) => {
  const typeStr = (type || '').toLowerCase();
  if (
    typeStr.includes('journey') ||
    typeStr.includes('trip') ||
    typeStr.includes('group') ||
    typeStr.includes('join_request') ||
    typeStr.includes('request_approved') ||
    typeStr.includes('request_rejected') ||
    typeStr.includes('request_accept') ||
    typeStr.includes('request_reject') ||
    typeStr.includes('host_transferred')
  ) {
    return 'Journey';
  }
  if (
    typeStr.includes('message') ||
    typeStr.includes('direct') ||
    typeStr.includes('chat') ||
    typeStr === 'new_message' ||
    typeStr === 'message_request'
  ) {
    return 'Messages';
  }
  if (
    typeStr.includes('safe') ||
    typeStr.includes('sos') ||
    typeStr.includes('emergency') ||
    typeStr.includes('warning') ||
    typeStr.includes('admin_warning')
  ) {
    return 'Safety';
  }
  return 'Social';
};

const normalizeNotification = (n) => {
  const obj = typeof n.toObject === 'function' ? n.toObject() : { ...n };
  let rawCategory = obj.category || getNotificationCategory(obj.type);
  const catLower = (rawCategory || '').toLowerCase();
  let category = 'Social';
  if (catLower === 'journey' || catLower.includes('trip')) category = 'Journey';
  else if (catLower === 'messages' || catLower === 'message' || catLower === 'chat') category = 'Messages';
  else if (catLower === 'safety' || catLower === 'safe' || catLower === 'emergency') category = 'Safety';
  else if (catLower === 'social') category = 'Social';
  else category = getNotificationCategory(obj.type);

  const msg = obj.message || obj.content || obj.text || '';
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
    _id: obj._id ? obj._id.toString() : obj.id,
    sender: obj.sender || null,
    actor: obj.sender || null,
    receiver: obj.receiver ? (obj.receiver._id || obj.receiver).toString() : null,
    recipient: obj.receiver ? (obj.receiver._id || obj.receiver).toString() : null,
    category,
    message: msg,
    content: msg,
    text: msg,
    isRead: Boolean(obj.isRead),
    metadata: obj.metadata || {},
    createdAt: obj.createdAt || new Date()
  };
};

const createAndSendNotification = async (io, payload) => {
  try {
    const {
      sender,
      receiver,
      type,
      message,
      category: explicitCategory,
      journey,
      journeyModel,
      group,
      post,
      story,
      room,
      joinRequest,
      journeyJoinRequest,
      invitation,
      metadata
    } = payload;

    if (!sender || !receiver || !type || !message) {
      console.warn('[NotificationHelper] Missing required fields for notification:', { sender, receiver, type, message });
    }

    const category = explicitCategory || getNotificationCategory(type);

    const notificationDoc = await Notification.create({
      sender,
      receiver,
      type,
      category,
      message,
      journey,
      journeyModel: journeyModel || 'Journey',
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
      .populate('sender', 'name username pic avatar img profilePic isVerified')
      .populate('group', 'title destination from')
      .populate('journey', 'title destination origin startDate')
      .populate('post', 'caption images media')
      .populate('story', 'media caption')
      .populate('room', 'name type members')
      .lean();

    const normalized = normalizeNotification(populated || notificationDoc);

    if (io && receiver) {
      const receiverRoom = receiver.toString();
      io.to(receiverRoom).emit('new_notification', normalized);
    }

    return normalized;
  } catch (error) {
    console.error('[NotificationHelper] Error creating notification:', error.message);
    return null;
  }
};

const verifyTripMateEligibility = async (userId, targetUserId) => {
  try {
    const validTripMates = await getValidTripMates(userId);
    return validTripMates.some(
      (m) => (m._id || m.id || m).toString() === targetUserId.toString()
    );
  } catch (err) {
    console.error('[NotificationHelper] Error verifying trip mate eligibility:', err.message);
    return false;
  }
};

module.exports = {
  getNotificationCategory,
  normalizeNotification,
  createAndSendNotification,
  verifyTripMateEligibility
};
