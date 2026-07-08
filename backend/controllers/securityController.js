const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Session = require("../models/Session");
const SecurityPreference = require("../models/SecurityPreference");

// Get all active sessions of logged-in user
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    user: req.user._id,
    status: "active",
  }).sort({ lastActive: -1 });

  return res.status(200).json({
    success: true,
    sessions,
  });
});

// Revoke a specific session
const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (session.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  session.status = "revoked";
  await session.save();

  return res.status(200).json({
    success: true,
    message: "Session revoked successfully",
  });
});

// Revoke all sessions except current session
const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  let currentToken =
    req.headers.authorization &&
    req.headers.authorization.split(" ")[1];

  if (!currentToken) {
    currentToken = req.cookies?.access_token;
  }

  await Session.updateMany(
    {
      user: req.user._id,
      token: { $ne: currentToken },
    },
    {
      $set: { status: "revoked" },
    }
  );

  return res.status(200).json({
    success: true,
    message: "All other sessions revoked",
  });
});

// Enable or disable two-factor authentication
const toggle2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.twoFactorEnabled = !user.twoFactorEnabled;
  await user.save();

  return res.status(200).json({
    success: true,
    twoFactorEnabled: user.twoFactorEnabled,
  });
});

// Get user security preferences
const getPreferences = asyncHandler(async (req, res) => {
  let prefs = await SecurityPreference.findOne({
    user: req.user._id,
  });

  if (!prefs) {
    prefs = await SecurityPreference.create({
      user: req.user._id,
    });
  }

  return res.status(200).json({
    success: true,
    preferences: prefs,
  });
});

// Update security preferences
const updatePreferences = asyncHandler(async (req, res) => {
  let prefs = await SecurityPreference.findOne({
    user: req.user._id,
  });

  if (!prefs) {
    prefs = new SecurityPreference({
      user: req.user._id,
    });
  }

  const {
    profileVisibility,
    onlineVisibility,
    allowFollowRequests,
    allowTripInvites,
    allowMessageRequests,
    locationSharing,
    emergencySharing,
  } = req.body;

  if (profileVisibility) prefs.profileVisibility = profileVisibility;
  if (onlineVisibility !== undefined) prefs.onlineVisibility = onlineVisibility;
  if (allowFollowRequests !== undefined) prefs.allowFollowRequests = allowFollowRequests;
  if (allowTripInvites !== undefined) prefs.allowTripInvites = allowTripInvites;
  if (allowMessageRequests !== undefined) prefs.allowMessageRequests = allowMessageRequests;
  if (locationSharing !== undefined) prefs.locationSharing = locationSharing;
  if (emergencySharing !== undefined) prefs.emergencySharing = emergencySharing;

  await prefs.save();

  return res.status(200).json({
    success: true,
    preferences: prefs,
  });
});

// Delete user account
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Revoke all active sessions
  await Session.updateMany(
    { user: req.user._id },
    { $set: { status: "revoked" } }
  );

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

module.exports = {
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  toggle2FA,
  getPreferences,
  updatePreferences,
  deleteAccount,
};