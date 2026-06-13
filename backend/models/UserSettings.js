const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Privacy
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
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // Safety & Emergency
  sosEnabled: {
    type: Boolean,
    default: false
  },
  emergencyLocationSharing: {
    type: Boolean,
    default: false
  },
  tripLocationSharing: {
    type: Boolean,
    default: true
  },

  // Notifications
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
  }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
