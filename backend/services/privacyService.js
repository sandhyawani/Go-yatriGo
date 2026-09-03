const mongoose = require("mongoose");
const User = require("../models/User");
const UserSettings = require("../models/UserSettings");
const SecurityPreference = require("../models/SecurityPreference");
const { isBlockedPair } = require("../utils/blockHelper");

// Helper to normalize ObjectIds / strings
const normalizeId = (val) => {
  if (!val) return "";
  if (typeof val === "object") {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    if (val.user) return normalizeId(val.user);
  }
  return String(val);
};

// Default privacy settings
const PRIVACY_DEFAULTS = {
  privateAccount: false,
  whoCanMessage: "everyone", // "everyone" | "mates_only" | "none"
  connectionRequests: "everyone", // "everyone" | "mates_only"
  journeyInvites: "everyone", // "everyone" | "mates_only" | "none"
  profileLocationVisibility: "mates_only", // "everyone" | "mates_only" | "none"
  showOnlineStatus: true,
  allowStoryReplies: true,
  allowTravelGroupInvites: true,
  tripLocationSharing: false,
  emergencyLocationSharing: false,
  safetyCheckinReminders: true,
};

// Reads user privacy policy with database fallback to defaults
const getUserPrivacyPolicy = async (userId) => {
  const uId = normalizeId(userId);
  if (!uId) return { ...PRIVACY_DEFAULTS };

  const user = await User.findById(uId).select("privateAccount privacySettings").lean();
  if (!user) return { ...PRIVACY_DEFAULTS };

  const settingsDoc = await UserSettings.findOne({ userId: uId }).lean();
  const userPriv = user.privacySettings || {};

  return {
    privateAccount: Boolean(user.privateAccount || userPriv.privateAccount || settingsDoc?.accountPrivacy === "private"),
    whoCanMessage: userPriv.whoCanMessage || settingsDoc?.messageRequests || PRIVACY_DEFAULTS.whoCanMessage,
    connectionRequests: userPriv.connectionRequests || PRIVACY_DEFAULTS.connectionRequests,
    journeyInvites: userPriv.journeyInvites || PRIVACY_DEFAULTS.journeyInvites,
    profileLocationVisibility: userPriv.profileLocationVisibility || PRIVACY_DEFAULTS.profileLocationVisibility,
    showOnlineStatus: userPriv.showOnlineStatus !== undefined ? userPriv.showOnlineStatus : PRIVACY_DEFAULTS.showOnlineStatus,
    allowStoryReplies: userPriv.allowStoryReplies !== undefined ? userPriv.allowStoryReplies : PRIVACY_DEFAULTS.allowStoryReplies,
    allowTravelGroupInvites: userPriv.allowTravelGroupInvites !== undefined ? userPriv.allowTravelGroupInvites : PRIVACY_DEFAULTS.allowTravelGroupInvites,
    tripLocationSharing: settingsDoc?.tripLocationSharing !== undefined ? settingsDoc.tripLocationSharing : PRIVACY_DEFAULTS.tripLocationSharing,
    emergencyLocationSharing: settingsDoc?.emergencyLocationSharing !== undefined ? settingsDoc.emergencyLocationSharing : PRIVACY_DEFAULTS.emergencyLocationSharing,
    safetyCheckinReminders: settingsDoc?.safetyCheckinReminders !== undefined ? settingsDoc.safetyCheckinReminders : PRIVACY_DEFAULTS.safetyCheckinReminders,
  };
};

// Updates privacy policy and synchronizes compatibility stores (UserSettings, SecurityPreference)
const updateUserPrivacyPolicy = async (userId, updates = {}) => {
  const uId = normalizeId(userId);
  if (!uId) throw new Error("User ID is required to update privacy policy");

  const user = await User.findById(uId);
  if (!user) throw new Error("User not found");

  if (!user.privacySettings) {
    user.privacySettings = { ...PRIVACY_DEFAULTS };
  }

  // Private Account
  if (updates.privateAccount !== undefined || updates.accountPrivacy !== undefined) {
    const isPrivate =
      updates.privateAccount === true ||
      updates.privateAccount === "private" ||
      updates.accountPrivacy === "private" ||
      updates.accountPrivacy === true;

    user.privateAccount = isPrivate;
    user.privacySettings.privateAccount = isPrivate;
  }

  // Direct Messaging
  if (updates.whoCanMessage !== undefined && ["everyone", "mates_only", "none"].includes(updates.whoCanMessage)) {
    user.privacySettings.whoCanMessage = updates.whoCanMessage;
  } else if (updates.messageRequests !== undefined) {
    if (updates.messageRequests === "followers" || updates.messageRequests === "mates_only") {
      user.privacySettings.whoCanMessage = "mates_only";
    } else if (updates.messageRequests === "none") {
      user.privacySettings.whoCanMessage = "none";
    } else {
      user.privacySettings.whoCanMessage = "everyone";
    }
  }

  // Follow / Connection Requests
  if (updates.connectionRequests !== undefined && ["everyone", "mates_only"].includes(updates.connectionRequests)) {
    user.privacySettings.connectionRequests = updates.connectionRequests;
  }

  // Journey Invites
  if (updates.journeyInvites !== undefined && ["everyone", "mates_only", "none"].includes(updates.journeyInvites)) {
    user.privacySettings.journeyInvites = updates.journeyInvites;
  }

  // Profile Location Visibility
  if (updates.profileLocationVisibility !== undefined && ["everyone", "mates_only", "none"].includes(updates.profileLocationVisibility)) {
    user.privacySettings.profileLocationVisibility = updates.profileLocationVisibility;
  }

  // Online Status & Story Replies & Group Invites
  if (updates.showOnlineStatus !== undefined) {
    user.privacySettings.showOnlineStatus = Boolean(updates.showOnlineStatus);
  }
  if (updates.allowStoryReplies !== undefined) {
    user.privacySettings.allowStoryReplies = Boolean(updates.allowStoryReplies);
  }
  if (updates.allowTravelGroupInvites !== undefined) {
    user.privacySettings.allowTravelGroupInvites = Boolean(updates.allowTravelGroupInvites);
  }

  await user.save();

  // Synchronize UserSettings store
  const userSettingsUpdate = {
    accountPrivacy: user.privateAccount ? "private" : "public",
    messageRequests: user.privacySettings.whoCanMessage === "none" ? "none" : user.privacySettings.whoCanMessage === "mates_only" ? "followers" : "everyone",
  };
  if (updates.tripLocationSharing !== undefined) userSettingsUpdate.tripLocationSharing = Boolean(updates.tripLocationSharing);
  if (updates.emergencyLocationSharing !== undefined) userSettingsUpdate.emergencyLocationSharing = Boolean(updates.emergencyLocationSharing);
  if (updates.safetyCheckinReminders !== undefined) userSettingsUpdate.safetyCheckinReminders = Boolean(updates.safetyCheckinReminders);
  if (updates.readReceipts !== undefined) userSettingsUpdate.readReceipts = Boolean(updates.readReceipts);

  await UserSettings.findOneAndUpdate(
    { userId: uId },
    { $set: userSettingsUpdate },
    { upsert: true, new: true, runValidators: true }
  );

  // Synchronize SecurityPreference compatibility doc
  const securityPrefUpdate = {
    profileVisibility: user.privateAccount ? "private" : "public",
    onlineVisibility: user.privacySettings.showOnlineStatus !== false,
    allowFollowRequests: user.privacySettings.connectionRequests !== "none",
    allowTripInvites: user.privacySettings.journeyInvites !== "none",
    allowMessageRequests: user.privacySettings.whoCanMessage !== "none",
  };
  if (updates.tripLocationSharing !== undefined || updates.locationSharing !== undefined) {
    securityPrefUpdate.locationSharing = Boolean(updates.tripLocationSharing ?? updates.locationSharing);
  }
  if (updates.emergencyLocationSharing !== undefined || updates.emergencySharing !== undefined) {
    securityPrefUpdate.emergencySharing = Boolean(updates.emergencyLocationSharing ?? updates.emergencySharing);
  }

  await SecurityPreference.findOneAndUpdate(
    { user: uId },
    { $set: securityPrefUpdate },
    { upsert: true, new: true }
  );

  return await getUserPrivacyPolicy(uId);
};

// Checks if two users are verified Trip Mates / mutual connections
const areTripMates = async (userAId, userBId) => {
  const aStr = normalizeId(userAId);
  const bStr = normalizeId(userBId);
  if (!aStr || !bStr) return false;
  if (aStr === bStr) return true;

  try {
    const { getValidTripMates } = require("../controllers/tripMateController");
    const validMates = await getValidTripMates(aStr);
    const isMate = validMates.some((m) => normalizeId(m._id || m.id || m) === bStr);
    if (isMate) return true;

    // Also check mutual followers as connection
    const userA = await User.findById(aStr).select("following followers").lean();
    if (userA) {
      const isFollowingB = userA.following?.some((id) => normalizeId(id) === bStr);
      const isFollowedByB = userA.followers?.some((id) => normalizeId(id) === bStr);
      if (isFollowingB && isFollowedByB) return true;
    }
  } catch (err) {
    console.error("[privacyService:areTripMates] Error checking trip mates:", err);
  }

  return false;
};

// Checks if followerId follows targetUserId
const isFollowingUser = async (followerId, targetUserId) => {
  const fStr = normalizeId(followerId);
  const tStr = normalizeId(targetUserId);
  if (!fStr || !tStr) return false;
  if (fStr === tStr) return true;

  const target = await User.findById(tStr).select("followers").lean();
  if (!target || !Array.isArray(target.followers)) return false;

  return target.followers.some((id) => normalizeId(id) === fStr);
};

// Checks if viewer is authorized to view target's location (city & state)
const canViewLocation = async (targetUser, viewerUser) => {
  const targetId = normalizeId(targetUser);
  const viewerId = normalizeId(viewerUser);
  if (!targetId) return false;

  const isOwner = viewerId && targetId === viewerId;
  const isAdmin = typeof viewerUser === "object" && viewerUser?.isAdmin === true;
  if (isOwner || isAdmin) return true;

  if (viewerId) {
    const isBlocked = await isBlockedPair(targetId, viewerId);
    if (isBlocked) return false;
  }

  let locationVisibility = "mates_only";
  if (typeof targetUser === "object" && targetUser?.privacySettings?.profileLocationVisibility) {
    locationVisibility = targetUser.privacySettings.profileLocationVisibility;
  } else {
    const policy = await getUserPrivacyPolicy(targetId);
    locationVisibility = policy.profileLocationVisibility;
  }

  if (locationVisibility === "none") {
    return false;
  }

  if (locationVisibility === "everyone") {
    return true;
  }

  if (locationVisibility === "mates_only") {
    if (!viewerId) return false;
    return await areTripMates(targetId, viewerId);
  }

  return false;
};

// Checks if viewer is authorized to message target user
const canMessageUser = async (targetUser, viewerUser) => {
  const targetId = normalizeId(targetUser);
  const viewerId = normalizeId(viewerUser);
  if (!targetId || !viewerId) return { allowed: false, reason: "Authentication required" };
  if (targetId === viewerId) return { allowed: false, reason: "You cannot message yourself" };

  const isAdmin = typeof viewerUser === "object" && viewerUser?.isAdmin === true;
  if (isAdmin) return { allowed: true };

  const isBlocked = await isBlockedPair(targetId, viewerId);
  if (isBlocked) return { allowed: false, reason: "Cannot message a blocked user" };

  let policy;
  let targetDoc = typeof targetUser === "object" ? targetUser : null;
  if (targetDoc && targetDoc.privacySettings) {
    policy = {
      privateAccount: Boolean(targetDoc.privateAccount),
      whoCanMessage: targetDoc.privacySettings.whoCanMessage || "everyone",
    };
  } else {
    policy = await getUserPrivacyPolicy(targetId);
  }

  if (policy.whoCanMessage === "none") {
    return { allowed: false, reason: "This traveler does not accept direct messages." };
  }

  if (policy.whoCanMessage === "mates_only") {
    const isMate = await areTripMates(targetId, viewerId);
    if (!isMate) {
      return { allowed: false, reason: "Only approved Trip Mates can message this traveler." };
    }
  }

  if (policy.privateAccount) {
    const isFollower = await isFollowingUser(viewerId, targetId);
    if (!isFollower) {
      return { allowed: false, reason: "Only approved followers can message this private account." };
    }
  }

  return { allowed: true };
};

// Checks if viewer is authorized to reply to target user's story / dispatch
const canReplyToStory = async (storyAuthor, viewerUser) => {
  const targetId = normalizeId(storyAuthor);
  const viewerId = normalizeId(viewerUser);
  if (!targetId || !viewerId) return { allowed: false, reason: "Authentication required" };
  if (targetId === viewerId) return { allowed: true };

  let authorDoc = typeof storyAuthor === "object" ? storyAuthor : null;
  let allowReplies = true;
  if (authorDoc && authorDoc.privacySettings) {
    allowReplies = authorDoc.privacySettings.allowStoryReplies !== false;
  } else {
    const policy = await getUserPrivacyPolicy(targetId);
    allowReplies = policy.allowStoryReplies !== false;
  }

  if (!allowReplies) {
    return { allowed: false, reason: "This traveler has disabled replies to their dispatches." };
  }

  return await canMessageUser(storyAuthor, viewerUser);
};

// Checks journey visibility: Public, Followers Only, Friends Only (Trip Mates), and Private
const canViewJourney = async (journey, viewerUser) => {
  if (!journey) return { allowed: false, reason: "Journey not found", statusCode: 404 };

  const viewerId = normalizeId(viewerUser);
  const isAdmin = typeof viewerUser === "object" && viewerUser?.isAdmin === true;
  const creatorId = normalizeId(journey.creator || journey.host);

  // Creator or Admin is always allowed
  if (isAdmin || (viewerId && creatorId && viewerId === creatorId)) {
    return { allowed: true };
  }

  // Active Journey member is always allowed
  if (viewerId && Array.isArray(journey.members)) {
    const isMember = journey.members.some((m) => {
      const mId = normalizeId(m.user || m._id || m);
      const status = m.status || "active";
      return mId === viewerId && status === "active";
    });
    if (isMember) return { allowed: true };
  }

  // Check bidirectional block with creator
  if (viewerId && creatorId) {
    const isBlocked = await isBlockedPair(creatorId, viewerId);
    if (isBlocked) {
      return { allowed: false, reason: "Journey unavailable", statusCode: 403 };
    }
  }

  const privacy = journey.privacy || "Public";

  if (privacy === "Private" || journey.isPrivate === true || journey.isExplorePrivate === true) {
    return { allowed: false, reason: "This journey is private and only accessible to participants.", statusCode: 403 };
  }

  if (privacy === "Followers Only") {
    if (!viewerId) {
      return { allowed: false, reason: "This journey is only visible to approved followers.", statusCode: 403 };
    }
    const isFollower = await isFollowingUser(viewerId, creatorId);
    if (!isFollower) {
      return { allowed: false, reason: "This journey is only visible to followers of the organizer.", statusCode: 403 };
    }
  }

  if (privacy === "Friends Only") {
    if (!viewerId) {
      return { allowed: false, reason: "This journey is only visible to Trip Mates.", statusCode: 403 };
    }
    const isMate = await areTripMates(creatorId, viewerId);
    if (!isMate) {
      return { allowed: false, reason: "This journey is only visible to Trip Mates of the organizer.", statusCode: 403 };
    }
  }

  return { allowed: true };
};

// Redacts sensitive internal fields, personal credentials, and location if restricted
const sanitizeUserForViewer = async (rawUser, viewerUser) => {
  if (!rawUser) return null;

  const user = typeof rawUser.toObject === "function" ? rawUser.toObject() : { ...rawUser };
  const targetId = normalizeId(user._id || user.id);
  const viewerId = normalizeId(viewerUser);
  const isOwner = viewerId && targetId && viewerId === targetId;
  const isAdmin = typeof viewerUser === "object" && viewerUser?.isAdmin === true;

  // Always delete sensitive internal security fields
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.__v;

  if (!isOwner && !isAdmin) {
    // Redact personal contact and identity credentials
    delete user.email;
    delete user.mobile;
    delete user.govId;
    delete user.govIdType;
    delete user.verificationNote;
    delete user.blockedUsers;
    delete user.reportedBy;

    // Check location visibility (city & state)
    const allowedLocation = await canViewLocation(user, viewerUser);
    if (!allowedLocation) {
      user.city = "";
      user.state = "";
    }

    // Follow requests privacy (do not expose other users' follow request IDs)
    if (user.followRequests && Array.isArray(user.followRequests) && viewerId) {
      const hasPendingReq = user.followRequests.some((id) => normalizeId(id) === viewerId);
      user.followRequests = hasPendingReq ? [viewerId] : [];
    } else {
      user.followRequests = [];
    }

    // Limit exposed privacySettings
    if (user.privacySettings) {
      user.privacySettings = {
        whoCanMessage: user.privacySettings.whoCanMessage || "everyone",
        connectionRequests: user.privacySettings.connectionRequests || "everyone",
        journeyInvites: user.privacySettings.journeyInvites || "everyone",
        profileLocationVisibility: user.privacySettings.profileLocationVisibility || "mates_only",
        showOnlineStatus: user.privacySettings.showOnlineStatus !== false,
      };
    }
  }

  return user;
};

module.exports = {
  PRIVACY_DEFAULTS,
  getUserPrivacyPolicy,
  updateUserPrivacyPolicy,
  areTripMates,
  isFollowingUser,
  canViewLocation,
  canMessageUser,
  canReplyToStory,
  canViewJourney,
  sanitizeUserForViewer,
};
