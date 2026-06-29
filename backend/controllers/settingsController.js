const UserSettings = require("../models/UserSettings");
const User = require("../models/User");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({
      userId: req.user.id,
    });

    if (!settings) {
      settings = await UserSettings.create({
        userId: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Sync account privacy with User model
    if (updates.accountPrivacy !== undefined) {
      const isPrivate =
        updates.accountPrivacy === true ||
        updates.accountPrivacy === "private";

      updates.accountPrivacy = isPrivate ? "private" : "public";

      const userId = req.user.id || req.user._id;

      await User.findByIdAndUpdate(userId, {
        privateAccount: isPrivate,
      });
    }

    const userId = req.user.id || req.user._id;

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = await UserSettings.create({
        userId,
        ...updates,
      });
    } else {
      settings = await UserSettings.findOneAndUpdate(
        { userId },
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    console.error("Settings Update Error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// Update two-factor authentication setting
exports.update2FA = async (req, res) => {
  try {
    const { twoFactorEnabled } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      twoFactorEnabled,
    });

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { twoFactorEnabled },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get login activity from all sessions
exports.getLoginActivity = async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user.id,
    }).sort({ lastActive: -1 });

    const activeSessions = sessions.map((session) => ({
      _id: session._id,
      browser: session.browser,
      os: session.os,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      location: session.location,
      lastActive: session.lastActive,
      isCurrent: req.token === session.token,
    }));

    res.status(200).json({
      success: true,
      data: activeSessions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Logout from all devices except current one
exports.logoutOtherDevices = async (req, res) => {
  try {
    if (!req.token) {
      return res.status(400).json({
        success: false,
        message: "Current session token not found",
      });
    }

    await Session.deleteMany({
      user: req.user.id,
      token: { $ne: req.token },
    });

    res.status(200).json({
      success: true,
      message: "Logged out of other devices",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Soft delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Mark account as deleted
    user.isDeleted = true;
    user.deletedAt = Date.now();

    await user.save();

    // Remove all user sessions
    await Session.deleteMany({
      user: req.user.id,
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Deactivate user account temporarily
exports.deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to deactivate account",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Mark account as deactivated
    user.isDeactivated = true;
    user.privateAccount = true;

    await user.save();

    // Remove all user sessions
    await Session.deleteMany({
      user: req.user.id,
    });

    res.clearCookie("access_token");
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};