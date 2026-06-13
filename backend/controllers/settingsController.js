const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');

exports.getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = await UserSettings.create({ userId: req.user.id });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Map frontend boolean for accountPrivacy to enum strings
    if (updates.accountPrivacy !== undefined) {
      const isPrivate = updates.accountPrivacy === true || updates.accountPrivacy === 'private';
      updates.accountPrivacy = isPrivate ? 'private' : 'public';
      
      // Sync with User model for feed logic
      const userId = req.user.id || req.user._id;
      await User.findByIdAndUpdate(userId, { privateAccount: isPrivate });
    }

    const userId = req.user.id || req.user._id;
    let settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      settings = await UserSettings.create({ userId, ...updates });
    } else {
      settings = await UserSettings.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, runValidators: true }
      );
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error("Settings Update Error:", err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.update2FA = async (req, res) => {
  try {
    const { twoFactorEnabled } = req.body;
    await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled });
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { twoFactorEnabled },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLoginActivity = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({ lastActive: -1 });
    // Assuming req.token or something can identify the current session
    // We'll mark the one that matches req.token or current request IP as current
    // In auth middleware, we should attach req.token or req.sessionId
    
    const activeSessions = sessions.map(s => ({
      _id: s._id,
      browser: s.browser,
      os: s.os,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActive: s.lastActive,
      isCurrent: req.token === s.token // Simple heuristic if req.token is populated by middleware
    }));

    res.status(200).json({ success: true, data: activeSessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logoutOtherDevices = async (req, res) => {
  try {
    if (!req.token) {
       return res.status(400).json({ success: false, message: 'Current session token not found' });
    }
    // Delete all sessions for the user except the current one
    await Session.deleteMany({ user: req.user.id, token: { $ne: req.token } });
    res.status(200).json({ success: true, message: 'Logged out of other devices' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    // Soft delete
    user.isDeleted = true;
    user.deletedAt = Date.now();
    await user.save();

    // Remove all sessions to force logout
    await Session.deleteMany({ user: req.user.id });

    // clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
