const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const TravelGroup = require("../models/TravelGroup");
const Follow = require("../models/Follow");
const Block = require("../models/Block");
const Report = require("../models/Report");
const Post = require("../models/Post"); // Moved to top to prevent runtime errors
const { INDIAN_STATES_AND_CITIES } = require("../utils/locationData");

const SOCKET_EVENTS = {
  NEW_NOTIFICATION: "new_notification",
  FOLLOWERS_UPDATED: "followers_updated",
  FOLLOWING_UPDATED: "following_updated",
  FOLLOW_REQUEST_RECEIVED: "follow_request_received",
  FOLLOW_REQUEST_ACCEPTED: "follow_request_accepted",
  FOLLOW_REQUEST_REJECTED: "follow_request_rejected",
};

// Update user profile
const updateUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  if (currentUserId.toString() !== targetUserId.toString() && !req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this profile",
    });
  }

  const hasStateUpdate = req.body.state !== undefined;
  const hasCityUpdate = req.body.city !== undefined;

  if (hasStateUpdate || hasCityUpdate) {
    const existingUser = await User.findById(targetUserId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const stateToValidate = hasStateUpdate ? req.body.state : existingUser.state;
    const cityToValidate = hasCityUpdate ? req.body.city : existingUser.city;

    if (hasStateUpdate && (!stateToValidate || !stateToValidate.trim())) {
      return res.status(400).json({ success: false, message: "State cannot be empty" });
    }
    if (hasCityUpdate && (!cityToValidate || !cityToValidate.trim())) {
      return res.status(400).json({ success: false, message: "City cannot be empty" });
    }

    const trimmedState = (stateToValidate || "").trim();
    const trimmedCity = (cityToValidate || "").trim();

    // Check if the state exists in our location data
    const validCities = INDIAN_STATES_AND_CITIES[trimmedState];
    if (!validCities) {
      return res.status(400).json({ success: false, message: `Invalid state: ${trimmedState}` });
    }

    // Check if the city belongs to the state
    if (!validCities.includes(trimmedCity)) {
      return res.status(400).json({
        success: false,
        message: `City ${trimmedCity} does not belong to ${trimmedState}`
      });
    }

    // Update req.body values to trimmed ones
    if (hasStateUpdate) req.body.state = trimmedState;
    if (hasCityUpdate) req.body.city = trimmedCity;
  }

  // Prevent mass assignment vulnerability by whitelisting safe updates
  const allowedUpdates = [
    "name", "username", "bio", "city", "state", "interests", "role", "type",
    "img", "pic", "avatar", "profilePic", "govId", "privacySettings"
  ];
  
  const updateData = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const newPic = updateData.img || updateData.pic || updateData.avatar || updateData.profilePic;
  if (newPic && typeof newPic === "string" && !newPic.includes("no-image-icon")) {
    updateData.img = newPic;
    updateData.pic = newPic;
    updateData.avatar = newPic;
  }

  if (updateData.govId) {
    updateData.verificationStatus = "pending";
    updateData.verificationNote = "";
  }

  const updatedUser = await User.findByIdAndUpdate(
    targetUserId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser.toObject ? updatedUser.toObject() : updatedUser,
  });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() !== targetUserId.toString() && !req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this account",
    });
  }

  const deletedUser = await User.findByIdAndDelete(targetUserId);
  if (!deletedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

// Get user profile
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "name username pic img avatar profilePic profilePicture userPic type isVerified rating")
    .populate("following", "name username pic img avatar profilePic profilePicture userPic type isVerified rating")
    .lean();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentUserId = req.user?._id || req.user?.id;
  const isOwner = currentUserId && currentUserId.toString() === user._id.toString();

  if (!isOwner && !req.user?.isAdmin) {
    delete user.email;
    delete user.mobile;
    delete user.govId;
  }

  let canViewContent = !user.privateAccount;
  const isFollower = currentUserId && user.followers?.some(
    (follower) => (follower._id || follower).toString() === currentUserId.toString()
  );

  if (isOwner || isFollower || req.user?.isAdmin) {
    canViewContent = true;
  }

  user.canViewContent = canViewContent;

  res.status(200).json({ success: true, user });
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  // Explicitly select public-safe fields to avoid critical data leakage
  const users = await User.find().select("name username pic img avatar profilePic profilePicture role type isVerified rating");
  res.status(200).json({ success: true, users });
});

// Search and filter users
const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search || req.query.q || "";
  const filterCity = req.query.city;
  const filterState = req.query.state;
  const currentUserId = req.user?._id || req.user?.id;

  let queryConditions = {
    ...(currentUserId && { _id: { $ne: currentUserId } }),
  };

  if (keyword) {
    queryConditions.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { username: { $regex: keyword, $options: "i" } },
      { city: { $regex: keyword, $options: "i" } },
      { state: { $regex: keyword, $options: "i" } },
    ];
  }

  if (filterCity) {
    queryConditions.city = { $regex: filterCity, $options: "i" };
  }
  if (filterState) {
    queryConditions.state = { $regex: filterState, $options: "i" };
  }

  const users = await User.find(queryConditions).select("-password -email -mobile -govId -blockedUsers");

  res.status(200).json({ success: true, users });
});

// Follow a user or send a follow request
const followUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId),
  ]);

  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (currentUser.following.some(id => id.toString() === targetUserId.toString())) {
    return res.status(400).json({ success: false, message: "You already follow this traveler" });
  }

  if (targetUser.followRequests?.some(id => id.toString() === currentUserId.toString())) {
    return res.status(400).json({ success: false, message: "Follow request already sent" });
  }

  const io = req.app.get("io");

  if (targetUser.privateAccount) {
    // Atomic push to eliminate target array race condition
    const updatedTarget = await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followRequests: currentUserId } },
      { new: true }
    );

    const notification = await Notification.create({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow_request",
      message: `${currentUser.username || currentUser.name} requested to follow you`,
    });

    if (io) {
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "name username avatar profilePicture pic img")
        .lean();
      io.to(targetUserId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
      io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED, {
        senderId: currentUserId.toString(),
        followRequests: updatedTarget.followRequests,
      });
    }

    return res.status(200).json({
      success: true,
      status: "requested",
      message: "Follow request sent successfully",
    });
  }

  // Atomic operations to guarantee clean data writing
  const [updatedCurrent, updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }, { new: true }),
    User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } }, { new: true })
  ]);

  if (Follow) {
    await Follow.findOneAndUpdate(
      { follower: currentUserId, following: targetUserId },
      { follower: currentUserId, following: targetUserId },
      { upsert: true, new: true }
    );
  }

  const notification = await Notification.create({
    sender: currentUserId,
    receiver: targetUserId,
    type: "follow",
    message: `${currentUser.username || currentUser.name} started following you`,
  });

  if (io) {
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name username avatar profilePicture pic img")
      .lean();
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: targetUserId.toString(),
      followersCount: updatedTarget.followers.length,
    });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: currentUserId.toString(),
      followingCount: updatedCurrent.following.length,
    });
  }

  res.status(200).json({
    success: true,
    status: "following",
    message: "Successfully followed traveler",
  });
});

// Unfollow a user or cancel a follow request
const unfollowUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const hasPendingRequest = targetUser.followRequests?.some(
    (id) => id.toString() === currentUserId.toString()
  );

  const io = req.app.get("io");

  if (hasPendingRequest) {
    await User.findByIdAndUpdate(targetUserId, { $pull: { followRequests: currentUserId } });
    await Notification.findOneAndDelete({ sender: currentUserId, receiver: targetUserId, type: "follow_request" });

    if (io) {
      io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, { userId: currentUserId.toString() });
    }

    return res.status(200).json({
      success: true,
      status: "none",
      message: "Follow request cancelled successfully",
    });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }, { new: true }),
    User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }, { new: true })
  ]);

  if (Follow) {
    await Follow.deleteOne({ follower: currentUserId, following: targetUserId });
  }

  await Notification.findOneAndDelete({ sender: currentUserId, receiver: targetUserId, type: "follow" });

  if (io) {
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: targetUserId.toString(),
      followersCount: updatedTarget.followers.length,
    });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: currentUserId.toString(),
      followingCount: updatedCurrent.following.length,
    });
  }

  res.status(200).json({
    success: true,
    status: "none",
    message: "Successfully unfollowed traveler",
  });
});

// Rate a traveler after completing a trip
const rateUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentRating = targetUser.rating || 0;
  const currentReviews = targetUser.reviewsCount || 0;
  const totalReviews = currentReviews + 1;
  const averageRating = (currentRating * currentReviews + Number(rating)) / totalReviews;

  targetUser.rating = Number(averageRating.toFixed(1));
  targetUser.reviewsCount = totalReviews;
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "Rating submitted successfully",
    rating: targetUser.rating,
    reviewsCount: targetUser.reviewsCount,
  });
});

// Block a user
const blockUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(400).json({ success: false, message: "You cannot block yourself" });
  }

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (currentUser.blockedUsers.some(id => id.toString() === targetUserId.toString())) {
    return res.status(400).json({ success: false, message: "User is already blocked" });
  }

  await User.findByIdAndUpdate(currentUserId, { $addToSet: { blockedUsers: targetUserId } });
  await Block.findOneAndUpdate(
    { blocker: currentUserId, blocked: targetUserId },
    { blocker: currentUserId, blocked: targetUserId },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, message: "User blocked successfully" });
});

// Unblock a user
const unblockUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: targetUserId } });
  await Block.deleteOne({ blocker: currentUserId, blocked: targetUserId });

  res.status(200).json({ success: true, message: "User unblocked successfully" });
});

// Report a user
const reportUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: "Please provide a reason for reporting" });
  }

  const targetUser = await User.findByIdAndUpdate(
    targetUserId,
    { $push: { reportedBy: { reporterId: currentUserId, reason } } },
    { new: true }
  );

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await Report.create({
    reporter: currentUserId,
    reportedUser: targetUserId,
    targetType: "user",
    reason,
  });

  res.status(200).json({ success: true, message: "User reported successfully" });
});

// Get traveler suggestions
const getTravelerSuggestions = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const currentUser = await User.findById(currentUserId).select("following city state");
  const followingList = currentUser?.following || [];

  const suggestionQuery = {
    isAdmin: { $ne: true },
    $or: [
      { role: { $in: ["Traveler", "traveler"] } },
      { type: { $in: ["Traveler", "traveler"] } },
    ],
  };

  const filterUsers = (users) => {
    const bannedNames = /^(test|admin|owner|seed|demo)/i;
    return users.filter(
      (user) => !bannedNames.test(user.name || "") && !bannedNames.test(user.username || "")
    );
  };

  const userCity = currentUser?.city?.trim().toLowerCase();
  const userState = currentUser?.state?.trim().toLowerCase();

  const getPriorityScore = (u) => {
    let score = 0;
    const uCity = u.city?.trim().toLowerCase();
    const uState = u.state?.trim().toLowerCase();

    if (userCity && uCity === userCity) {
      score += 100;
    }
    if (userState && uState === userState) {
      score += 10;
    }
    return score;
  };

  let suggestions = await User.find({
    ...suggestionQuery,
    _id: { $ne: currentUserId, $nin: followingList },
  })
    .select("name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city state bio")
    .limit(100)
    .lean();

  suggestions = filterUsers(suggestions);
  suggestions.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  suggestions = suggestions.slice(0, 12);

  if (suggestions.length === 0) {
    suggestions = await User.find({
      ...suggestionQuery,
      _id: { $ne: currentUserId },
    })
      .select("name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city state bio")
      .limit(100)
      .lean();

    suggestions = filterUsers(suggestions);
    suggestions.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    suggestions = suggestions.slice(0, 12);
  }

  if (suggestions.length === 0) {
    suggestions = await User.find({ _id: { $ne: currentUserId } })
      .select("name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city state bio")
      .limit(5)
      .lean();
  }

  res.status(200).json({ success: true, suggestions });
});

// Report a user, post, story, or travel group
const reportItem = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const { targetId, targetType, reportedUserId, reason } = req.body;

  if (!targetId || !targetType || !reportedUserId || !reason?.trim()) {
    return res.status(400).json({
      success: false,
      message: "targetId, targetType, reportedUserId and reason are required",
    });
  }

  const existingReport = await Report.findOne({ reporter: currentUserId, targetId, targetType });
  if (existingReport) {
    return res.status(400).json({ success: false, message: "You have already reported this item" });
  }

  await Report.create({
    reporter: currentUserId,
    reportedUser: reportedUserId,
    targetId,
    targetType,
    reason,
  });

  res.status(200).json({ success: true, message: "Report submitted successfully" });
});

// Accept a follow request
const acceptFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  const currentUser = await User.findById(currentUserId);
  if (!currentUser || !currentUser.followRequests.some(id => id.toString() === requesterId.toString())) {
    return res.status(400).json({ success: false, message: "No active follow request found" });
  }

  const [updatedCurrent, updatedRequester] = await Promise.all([
    User.findByIdAndUpdate(currentUserId, { $pull: { followRequests: requesterId }, $addToSet: { followers: requesterId } }, { new: true }),
    User.findByIdAndUpdate(requesterId, { $addToSet: { following: currentUserId } }, { new: true })
  ]);

  if (Follow) {
    await Follow.findOneAndUpdate(
      { follower: requesterId, following: currentUserId },
      { follower: requesterId, following: currentUserId },
      { upsert: true, new: true }
    );
  }

  const notification = await Notification.create({
    sender: currentUserId,
    receiver: requesterId,
    type: "follow_accept",
    message: `${updatedCurrent.username || updatedCurrent.name} accepted your follow request`,
  });

  await Notification.findOneAndDelete({ sender: requesterId, receiver: currentUserId, type: "follow_request" });

  const io = req.app.get("io");
  if (io) {
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name username avatar profilePicture pic img")
      .lean();
    
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, { userId: currentUserId.toString() });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: currentUserId.toString(),
      followersCount: updatedCurrent.followers.length,
    });
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: requesterId.toString(),
      followingCount: updatedRequester.following.length,
    });
  }

  res.status(200).json({
    success: true,
    message: "Follow request accepted successfully",
    followersCount: updatedCurrent.followers.length,
    followingCount: updatedCurrent.following.length,
    requesterFollowingCount: updatedRequester.following.length,
  });
});

// Reject a follow request
const rejectFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  await User.findByIdAndUpdate(currentUserId, { $pull: { followRequests: requesterId } });
  await Notification.findOneAndDelete({ sender: requesterId, receiver: currentUserId, type: "follow_request" });

  const io = req.app.get("io");
  if (io) {
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, { userId: currentUserId.toString() });
  }

  res.status(200).json({ success: true, message: "Follow request rejected" });
});

// Get followers
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "followers",
    "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, followers: user.followers });
});

// Get following list
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "following",
    "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, following: user.following });
});

// Get blocked users
const getBlockedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id).populate(
    "blockedUsers",
    "name username pic img avatar profilePic profilePicture userPic isVerified"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, blockedUsers: user.blockedUsers || [] });
});

// Get profile statistics
const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id || req.user.id;

  const [posts, trips, followers, following] = await Promise.all([
    Post.countDocuments({ userId }),
    TravelGroup.countDocuments({ host: userId }),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);

  res.status(200).json({
    success: true,
    stats: { posts, trips, followers, following },
  });
});

// Get privacy settings
const getPrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    privacySettings: user.privacySettings || {
      privateAccount: user.privateAccount,
      allowStoryReplies: true,
      allowTravelGroupInvites: true,
      showOnlineStatus: true,
    },
  });
});

// Update privacy settings
const updatePrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.privacySettings) {
    user.privacySettings = {
      privateAccount: user.privateAccount,
      allowStoryReplies: true,
      allowTravelGroupInvites: true,
      showOnlineStatus: true,
    };
  }

  const { privateAccount, allowStoryReplies, allowTravelGroupInvites, showOnlineStatus } = req.body;

  if (privateAccount !== undefined) {
    user.privateAccount = privateAccount;
    user.privacySettings.privateAccount = privateAccount;
  }
  if (allowStoryReplies !== undefined) user.privacySettings.allowStoryReplies = allowStoryReplies;
  if (allowTravelGroupInvites !== undefined) user.privacySettings.allowTravelGroupInvites = allowTravelGroupInvites;
  if (showOnlineStatus !== undefined) user.privacySettings.showOnlineStatus = showOnlineStatus;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Privacy settings updated successfully",
    privacySettings: user.privacySettings,
  });
});

module.exports = {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  rateUser,
  blockUser,
  unblockUser,
  reportUser,
  reportItem,
  getTravelerSuggestions,
  getBlockedUsers,
  searchUsers,
  getProfileStats,
  getPrivacySettings,
  updatePrivacySettings,
};