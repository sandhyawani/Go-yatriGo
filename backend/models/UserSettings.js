const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  accountPrivacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  storyPrivacy: {
    type: String,
    enum: ['everyone', 'followers', 'close_friends'],
    default: 'everyone'
  },
  messageRequests: {
    type: String,
    enum: ['everyone', 'followers', 'none'],
    default: 'everyone'
  },
  readReceipts: {
    type: Boolean,
    default: true
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  sosEnabled: {
    type: Boolean,
    default: true
  },
  emergencyLocationSharing: {
    type: Boolean,
    default: false
  },
  tripLocationSharing: {
    type: Boolean,
    default: false
  },
  safetyCheckinReminders: {
    type: Boolean,
    default: true
  },

  pushNotifications: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  tripAlerts: {
    type: Boolean,
    default: true
  },
  messageNotifications: {
    type: Boolean,
    default: true
  },
  followActivityNotifications: {
    type: Boolean,
    default: true
  },
  connectionRequestNotifications: {
    type: Boolean,
    default: true
  },
  journeyInviteNotifications: {
    type: Boolean,
    default: true
  },
  journeyUpdateNotifications: {
    type: Boolean,
    default: true
  },
  safetyReminderNotifications: {
    type: Boolean,
    default: true
  },
  likesCommentsNotifications: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);