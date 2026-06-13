const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Session = require("../models/Session");
const SecurityPreference = require("../models/SecurityPreference");

// @desc    Get all active sessions for a user
// @route   GET /api/security/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.user._id, status: "active" }).sort({ lastActive: -1 });
  res.status(200).json({ success: true, sessions });
});

// @desc    Revoke a specific session
// @route   DELETE /api/security/sessions/:id
// @access  Private
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

  res.status(200).json({ success: true, message: "Session revoked successfully" });
});

// @desc    Revoke all other sessions
// @route   DELETE /api/security/sessions/all-others
// @access  Private
const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  // We need to keep the current session active. The current session token could be extracted from headers.
  // For now, we will revoke all where token is NOT the current token.
  let currentToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!currentToken) {
    currentToken = req.cookies.access_token;
  }

  await Session.updateMany(
    { user: req.user._id, token: { $ne: currentToken } },
    { $set: { status: "revoked" } }
  );

  res.status(200).json({ success: true, message: "All other sessions revoked" });
});

// @desc    Toggle Two-Factor Authentication
// @route   PUT /api/security/2fa
// @access  Private
const toggle2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.twoFactorEnabled = !user.twoFactorEnabled;
  await user.save();

  // TODO: Send mock email/SMS indicating 2FA status change
  console.log(`[MOCK EMAIL/SMS] 2FA status changed to ${user.twoFactorEnabled} for ${user.email}`);

  res.status(200).json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
});

// @desc    Get security preferences
// @route   GET /api/security/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
  let prefs = await SecurityPreference.findOne({ user: req.user._id });
  if (!prefs) {
    prefs = await SecurityPreference.create({ user: req.user._id });
  }
  res.status(200).json({ success: true, preferences: prefs });
});

// @desc    Update security preferences
// @route   PUT /api/security/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  let prefs = await SecurityPreference.findOne({ user: req.user._id });
  
  if (!prefs) {
    prefs = new SecurityPreference({ user: req.user._id });
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

  res.status(200).json({ success: true, preferences: prefs });
});

// @desc    Delete Account
// @route   DELETE /api/security/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // TODO: Verify password using bcrypt before deleting. 
  // Assuming a checkPassword method or standard bcrypt compare here.

  // Mark all sessions as revoked
  await Session.updateMany({ user: req.user._id }, { $set: { status: "revoked" } });

  // Delete user (or mark as inactive depending on business logic)
  await user.deleteOne();

  res.status(200).json({ success: true, message: "Account deleted successfully" });
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
