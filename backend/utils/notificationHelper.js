const Notification = require('../models/Notification');
const { getValidTripMates } = require('../controllers/tripMateController');
const notificationService = require('../services/notificationService');

const getNotificationCategory = notificationService.getNotificationCategory;
const normalizeNotification = notificationService.normalizeNotification;

const createAndSendNotification = async (io, payload) => {
  return await notificationService.createNotification(payload, io);
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
  createNotification: notificationService.createNotification,
  verifyTripMateEligibility
};
