const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const TravelGroup = require("../models/TravelGroup");
const Journey = require("../models/Journey");
const Follow = require("../models/Follow");
const Block = require("../models/Block");
const Report = require("../models/Report");
const Post = require("../models/Post");
const { INDIAN_STATES_AND_CITIES } = require("../utils/locationData");

const SOCKET_EVENTS = {
  NEW_NOTIFICATION: "new_notification",
  FOLLOWERS_UPDATED: "followers_updated",
  FOLLOWING_UPDATED: "following_updated",
  FOLLOW_REQUEST_RECEIVED: "follow_request_received",
  FOLLOW_REQUEST_ACCEPTED: "follow_request_accepted",
  FOLLOW_REQUEST_REJECTED: "follow_request_rejected"
};

const updateUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  if (currentUserId.toString() !== targetUserId.toString() && !req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this profile"
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

    const validCities = INDIAN_STATES_AND_CITIES[trimmedState];
    if (!validCities) {
      return res.status(400).json({ success: false, message: `Invalid state: ${trimmedState}` });
    }

    if (!validCities.includes(trimmedCity)) {
      return res.status(400).json({
        success: false,
        message: `City ${trimmedCity} does not belong to ${trimmedState}`
      });
    }

    if (hasStateUpdate) req.body.state = trimmedState;
    if (hasCityUpdate) req.body.city = trimmedCity;
  }

  const allowedUpdates = [
  "name", "username", "bio", "city", "state", "interests", "role", "type", "mobile",
  "img", "pic", "avatar", "profilePic", "govId", "govIdType", "privacySettings",
  "preferredTravelStyle", "favoriteDestinations"];


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

  if (updateData.govIdType !== undefined && !updateData.govId) {
    delete updateData.govIdType;
  }

  if (updateData.govIdType) {
    const validGovIdTypes = ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License'];
    if (!validGovIdTypes.includes(updateData.govIdType)) {
      return res.status(400).json({ success: false, message: "Invalid document type." });
    }
  }

  if (updateData.govId) {
    updateData.verificationStatus = "pending";
    updateData.isVerified = false;
    updateData.verificationNote = "";
  }

  if (updateData.mobile !== undefined) {
    const trimmedMobile = updateData.mobile.trim();
    if (trimmedMobile !== "" && !/^[6-9]\d{9}$/.test(trimmedMobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number. Must be a 10-digit Indian mobile number starting with 6-9." });
    }
    updateData.mobile = trimmedMobile;
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
    user: updatedUser.toObject ? updatedUser.toObject() : updatedUser
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() !== targetUserId.toString() && !req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this account"
    });
  }

  const deletedUser = await User.findByIdAndDelete(targetUserId);
  if (!deletedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).
  select("-password").
  populate("followers", "name username pic img avatar profilePic profilePicture userPic type isVerified rating").
  populate("following", "name username pic img avatar profilePic profilePicture userPic type isVerified rating").
  lean();

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

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("name username pic img avatar profilePic profilePicture role type isVerified rating");
  res.status(200).json({ success: true, users });
});

const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search || req.query.q || "";
  const filterCity = req.query.city;
  const filterState = req.query.state;
  const currentUserId = req.user?._id || req.user?.id;

  let queryConditions = {
    ...(currentUserId && { _id: { $ne: currentUserId } })
  };

  if (keyword) {
    queryConditions.$or = [
    { name: { $regex: keyword, $options: "i" } },
    { username: { $regex: keyword, $options: "i" } },
    { city: { $regex: keyword, $options: "i" } },
    { state: { $regex: keyword, $options: "i" } }];

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

const followUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(400).json({ success: false, message: "You cannot follow yourself" });
  }

  const [currentUser, targetUser] = await Promise.all([
  User.findById(currentUserId),
  User.findById(targetUserId)]
  );

  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (currentUser.following.some((id) => id.toString() === targetUserId.toString())) {
    return res.status(400).json({ success: false, message: "You already follow this traveler" });
  }

  if (targetUser.privacySettings?.connectionRequests === "mates_only") {
    const isTargetFollowingCurrent = targetUser.following?.some((id) => id.toString() === currentUserId.toString());
    if (!isTargetFollowingCurrent) {
      return res.status(403).json({
        success: false,
        message: "This traveler only accepts connection requests from mutual mates."
      });
    }
  }

  if (targetUser.followRequests?.some((id) => id.toString() === currentUserId.toString())) {
    return res.status(400).json({ success: false, message: "Journey Mate request already sent" });
  }

  const io = req.app.get("io");

  if (targetUser.privateAccount) {
    const updatedTarget = await User.findByIdAndUpdate(
    targetUserId,
    { $addToSet: { followRequests: currentUserId } },
    { new: true }
    );

    const notification = await Notification.create({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow_request",
      message: `${currentUser.username || currentUser.name} sent you a Journey Mate request`
    });

    if (io) {
      const populatedNotification = await Notification.findById(notification._id).
      populate("sender", "name username avatar profilePicture pic img").
      lean();
      io.to(targetUserId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
      io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED, {
        senderId: currentUserId.toString(),
        followRequests: updatedTarget.followRequests
      });
    }

    return res.status(200).json({
      success: true,
      status: "requested",
      message: "Journey Mate request sent successfully"
    });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
  User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }, { new: true }),
  User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } }, { new: true })]
  );

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
    message: `${currentUser.username || currentUser.name} added you as a Journey Mate`
  });

  if (io) {
    const populatedNotification = await Notification.findById(notification._id).
    populate("sender", "name username avatar profilePicture pic img").
    lean();
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: targetUserId.toString(),
      followersCount: updatedTarget.followers.length
    });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: currentUserId.toString(),
      followingCount: updatedCurrent.following.length
    });
  }

  res.status(200).json({
    success: true,
    status: "following",
    message: "Successfully added as Journey Mate"
  });
});

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
      message: "Journey Mate request cancelled successfully"
    });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
  User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }, { new: true }),
  User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } }, { new: true })]
  );

  if (Follow) {
    await Follow.deleteOne({ follower: currentUserId, following: targetUserId });
  }

  await Notification.findOneAndDelete({ sender: currentUserId, receiver: targetUserId, type: "follow" });

  if (io) {
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: targetUserId.toString(),
      followersCount: updatedTarget.followers.length
    });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: currentUserId.toString(),
      followingCount: updatedCurrent.following.length
    });
  }

  res.status(200).json({
    success: true,
    status: "none",
    message: "Successfully removed Journey Mate"
  });
});

const rateUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const { rating, journeyId } = req.body;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res.status(400).json({ success: false, message: "You cannot rate or review yourself" });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
  }

  const TravelGroup = require("../models/TravelGroup");
  const now = new Date();

  const query = {
    $or: [{ status: "completed" }, { endDate: { $lt: now } }],
    $and: [
    { $or: [{ host: currentUserId }, { "members.user": currentUserId }] },
    { $or: [{ host: targetUserId }, { "members.user": targetUserId }] }]

  };

  if (journeyId) {
    query._id = journeyId;
  }

  const sharedJourney = await TravelGroup.findOne(query);

  if (!sharedJourney) {
    return res.status(403).json({
      success: false,
      message: "You can only rate travelers with whom you have completed a journey"
    });
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
    reviewsCount: targetUser.reviewsCount
  });
});

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

  if (currentUser.blockedUsers.some((id) => id.toString() === targetUserId.toString())) {
    return res.status(400).json({ success: false, message: "User is already blocked" });
  }

  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: targetUserId },
    $pull: { followers: targetUserId, following: targetUserId, followRequests: targetUserId }
  });
  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId, following: currentUserId, followRequests: currentUserId }
  });
  await Block.findOneAndUpdate(
  { blocker: currentUserId, blocked: targetUserId },
  { blocker: currentUserId, blocked: targetUserId },
  { upsert: true, new: true }
  );

  res.status(200).json({ success: true, message: "User blocked successfully" });
});

const unblockUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: targetUserId } });
  await Block.deleteOne({ blocker: currentUserId, blocked: targetUserId });

  res.status(200).json({ success: true, message: "User unblocked successfully" });
});

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
    targetId: targetUserId,
    reason
  });

  res.status(200).json({ success: true, message: "User reported successfully" });
});

const getTravelerSuggestions = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const currentUser = await User.findById(currentUserId).
  select("following city state interests preferredTravelStyle favoriteDestinations");
  const followingList = currentUser?.following || [];

  const queryDestination = req.query.destination?.trim().toLowerCase();
  const queryStartDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const queryEndDate = req.query.endDate ? new Date(req.query.endDate) : null;
  const queryCity = (req.query.from || req.query.city || req.query.departureCity)?.trim().toLowerCase();
  const queryGroupId = req.query.groupId;

  const userDestinations = new Set();
  const userDates = [];

  if (queryDestination) {
    userDestinations.add(queryDestination);
  }
  if (queryStartDate) {
    userDates.push({ startDate: queryStartDate, endDate: queryEndDate || queryStartDate });
  }

  const userBaseCity = queryCity || currentUser?.city?.trim().toLowerCase();
  const userBaseState = currentUser?.state?.trim().toLowerCase();
  const userInterests = new Set((currentUser?.interests || []).map((i) => i.toLowerCase()));
  if (currentUser?.preferredTravelStyle) {
    userInterests.add(currentUser.preferredTravelStyle.toLowerCase());
  }

  if (currentUser?.favoriteDestinations) {
    currentUser.favoriteDestinations.forEach((dest) => {
      if (dest) userDestinations.add(dest.trim().toLowerCase());
    });
  }

  if (!queryDestination || !queryStartDate) {
    const userJourneys = await Journey.find({
      $or: [{ creator: currentUserId }, { "members.user": currentUserId }],
      status: { $in: ["Planning", "Upcoming", "Ongoing"] }
    }).select("destination startDate endDate");

    const userGroups = await TravelGroup.find({
      $or: [{ host: currentUserId }, { "members.user": currentUserId }],
      status: "open"
    }).select("destination startDate endDate");

    userJourneys.forEach((j) => {
      if (j.destination) userDestinations.add(j.destination.trim().toLowerCase());
      if (j.startDate && j.endDate) {
        userDates.push({ startDate: new Date(j.startDate), endDate: new Date(j.endDate) });
      }
    });

    userGroups.forEach((g) => {
      if (g.destination) userDestinations.add(g.destination.trim().toLowerCase());
      if (g.startDate && g.endDate) {
        userDates.push({ startDate: new Date(g.startDate), endDate: new Date(g.endDate) });
      }
    });
  }

  const activeJourneys = await Journey.find({
    status: { $in: ["Planning", "Upcoming", "Ongoing"] }
  }).select("creator members destination startDate endDate title").lean();

  const activeGroups = await TravelGroup.find({
    status: "open"
  }).select("host members destination startDate endDate title from").lean();

  const excludeUserIds = new Set();
  excludeUserIds.add(currentUserId.toString());
  if (queryGroupId) {
    const targetGroup = activeGroups.find((g) => g._id.toString() === queryGroupId);
    if (targetGroup) {
      if (targetGroup.host) excludeUserIds.add(targetGroup.host.toString());
      if (targetGroup.members) {
        targetGroup.members.forEach((m) => {
          if (m.user) excludeUserIds.add((m.user._id || m.user).toString());
        });
      }
    }
  }

  const candidateTripsMap = {};
  const addTripToMap = (userId, trip) => {
    if (!userId) return;
    const uid = userId.toString();
    if (!candidateTripsMap[uid]) {
      candidateTripsMap[uid] = [];
    }
    candidateTripsMap[uid].push(trip);
  };

  activeJourneys.forEach((j) => {
    const tripInfo = {
      type: "journey",
      destination: j.destination,
      startDate: j.startDate,
      endDate: j.endDate,
      title: j.title
    };
    if (j.creator) addTripToMap(j.creator, tripInfo);
    if (j.members) {
      j.members.forEach((m) => {
        if (m.user) addTripToMap(m.user, tripInfo);
      });
    }
  });

  activeGroups.forEach((g) => {
    const tripInfo = {
      type: "group",
      destination: g.destination,
      startDate: g.startDate,
      endDate: g.endDate,
      title: g.title,
      from: g.from
    };
    if (g.host) addTripToMap(g.host, tripInfo);
    if (g.members) {
      g.members.forEach((m) => {
        if (m.user) addTripToMap(m.user, tripInfo);
      });
    }
  });

  const candidateQuery = {
    isAdmin: { $ne: true },
    isDeleted: { $ne: true },
    isSuspended: { $ne: true },
    isDeactivated: { $ne: true },
    _id: { $nin: Array.from(excludeUserIds).concat(followingList.map((id) => id.toString())) },
    $or: [
    { role: { $in: ["Traveler", "traveler"] } },
    { type: { $in: ["Traveler", "traveler"] } }]

  };

  const candidates = await User.find(candidateQuery).
  select("name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests preferredTravelStyle favoriteDestinations followers following followRequests privateAccount city state bio").
  lean();

  const filterUsers = (users) => {
    const bannedNames = /^(test|admin|owner|seed|demo)/i;
    return users.filter(
    (user) => !bannedNames.test(user.name || "") && !bannedNames.test(user.username || "")
    );
  };

  const filteredCandidates = filterUsers(candidates);

  const scoredSuggestions = filteredCandidates.map((c) => {
    let score = 0;
    let isSameCity = false;
    let isNearbyCity = false;
    let isSameDestination = false;
    let matchedTrip = null;

    const cId = c._id.toString();
    const cCity = c.city?.trim().toLowerCase();
    const cState = c.state?.trim().toLowerCase();
    const cTrips = candidateTripsMap[cId] || [];

    const cDestinations = new Set();
    if (c.favoriteDestinations) {
      c.favoriteDestinations.forEach((d) => {
        if (d) cDestinations.add(d.trim().toLowerCase());
      });
    }
    cTrips.forEach((t) => {
      if (t.destination) cDestinations.add(t.destination.trim().toLowerCase());
    });

    let hasDestMatch = false;
    for (const userDest of userDestinations) {
      if (cDestinations.has(userDest)) {
        hasDestMatch = true;
        isSameDestination = true;
        break;
      }
    }
    if (hasDestMatch) {
      score += 1000;
    }

    let hasDateMatch = false;
    if (userDates.length > 0 && cTrips.length > 0) {
      for (const uRange of userDates) {
        for (const cTrip of cTrips) {
          if (!cTrip.startDate) continue;
          const uStart = uRange.startDate;
          const uEnd = uRange.endDate || uStart;
          const cStart = new Date(cTrip.startDate);
          const cEnd = cTrip.endDate ? new Date(cTrip.endDate) : cStart;

          const overlap = cStart <= uEnd && cEnd >= uStart;
          const diffDays = Math.abs(cStart - uStart) / (1000 * 60 * 60 * 24);

          if (overlap || diffDays <= 7) {
            hasDateMatch = true;
            matchedTrip = cTrip;
            break;
          }
        }
        if (hasDateMatch) break;
      }
    }
    if (hasDateMatch) {
      score += 500;
    }

    if (userBaseCity && cCity === userBaseCity) {
      score += 2000;
      isSameCity = true;
    }

    if (userBaseState && cState === userBaseState && cCity !== userBaseCity) {
      score += 1500;
      isNearbyCity = true;
    }

    let interestMatchesCount = 0;
    const cInterests = (c.interests || []).map((i) => i.toLowerCase());
    if (c.preferredTravelStyle) {
      cInterests.push(c.preferredTravelStyle.toLowerCase());
    }
    cInterests.forEach((ci) => {
      if (userInterests.has(ci)) {
        interestMatchesCount++;
      }
    });
    score += interestMatchesCount * 50;

    if (!matchedTrip && hasDestMatch && cTrips.length > 0) {
      for (const t of cTrips) {
        if (t.destination && userDestinations.has(t.destination.trim().toLowerCase())) {
          matchedTrip = t;
          break;
        }
      }
    }

    if (!matchedTrip && cTrips.length > 0) {
      matchedTrip = cTrips[0];
    }

    let suggestionReasonType = "explore";
    let suggestionReasonText = "Recommended Journey Mate";
    let matchedDestText = c.favoriteDestinations && c.favoriteDestinations.length > 0 ? c.favoriteDestinations[0] : "";
    let matchedDateText = "";

    if (matchedTrip) {
      matchedDestText = matchedTrip.title || matchedTrip.destination;
      if (matchedTrip.startDate) {
        const dObj = new Date(matchedTrip.startDate);
        matchedDateText = `Leaving ${dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    }

    if (isSameCity && c.city) {
      suggestionReasonType = "starting";
      suggestionReasonText = `📍 From ${c.city}`;
    } else if (isNearbyCity && c.city) {
      suggestionReasonType = "nearby";
      const stateName = c.state ? c.state.charAt(0).toUpperCase() + c.state.slice(1) : c.city;
      suggestionReasonText = `📍 From ${c.city}, ${stateName}`;
    } else if (hasDestMatch && matchedDestText) {
      suggestionReasonType = "heading";
      const cleanDest = matchedDestText.split(":")[0].split(",")[0].trim();
      const shortDest = cleanDest.length > 22 ? cleanDest.slice(0, 20) + "..." : cleanDest;
      suggestionReasonText = `🏔 Heading to ${shortDest}`;
    } else if (hasDateMatch && matchedDateText) {
      suggestionReasonType = "dates";
      suggestionReasonText = `📅 Traveling around ${matchedDateText.toLowerCase().replace("leaving ", "")}`;
    } else if (interestMatchesCount > 0) {
      suggestionReasonType = "interests";
      suggestionReasonText = `🎒 Similar travel interests`;
    }

    return {
      ...c,
      score,
      interestMatchesCount,
      isSameCity,
      isNearbyCity,
      isSameDestination,
      suggestionReasonType,
      suggestionReasonText,
      matchedDestination: matchedDestText,
      matchedDates: matchedDateText,
      matchedInterest: c.preferredTravelStyle || (c.interests && c.interests.length > 0 ? c.interests[0] : "Adventure"),
      departureCity: c.city || ""
    };
  });

  scoredSuggestions.sort((a, b) => b.score - a.score);

  const LOCAL_SLOTS = 5;
  const localPool = scoredSuggestions.filter((s) => s.isSameCity || s.isNearbyCity);
  const otherPool = scoredSuggestions.filter((s) => !s.isSameCity && !s.isNearbyCity);

  const guaranteedLocals = localPool.slice(0, LOCAL_SLOTS);
  const localIds = new Set(guaranteedLocals.map((s) => s._id.toString()));
  const remainingOthers = otherPool.
  filter((s) => !localIds.has(s._id.toString())).
  slice(0, 15 - guaranteedLocals.length);

  const topSuggestions = [...guaranteedLocals, ...remainingOthers];

  res.status(200).json({ success: true, suggestions: topSuggestions });
});

const reportItem = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const { targetId, targetType, reportedUserId, reason } = req.body;

  if (!targetId || !targetType || !reportedUserId || !reason?.trim()) {
    return res.status(400).json({
      success: false,
      message: "targetId, targetType, reportedUserId and reason are required"
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
    reason
  });

  res.status(200).json({ success: true, message: "Report submitted successfully" });
});

const acceptFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  const currentUser = await User.findById(currentUserId);
  if (!currentUser || !currentUser.followRequests.some((id) => id.toString() === requesterId.toString())) {
    return res.status(400).json({ success: false, message: "No active Journey Mate request found" });
  }

  const [updatedCurrent, updatedRequester] = await Promise.all([
  User.findByIdAndUpdate(currentUserId, { $pull: { followRequests: requesterId }, $addToSet: { followers: requesterId } }, { new: true }),
  User.findByIdAndUpdate(requesterId, { $addToSet: { following: currentUserId } }, { new: true })]
  );

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
    message: `${updatedCurrent.username || updatedCurrent.name} accepted your Journey Mate request`
  });

  await Notification.findOneAndDelete({ sender: requesterId, receiver: currentUserId, type: "follow_request" });

  const io = req.app.get("io");
  if (io) {
    const populatedNotification = await Notification.findById(notification._id).
    populate("sender", "name username avatar profilePicture pic img").
    lean();

    io.to(requesterId.toString()).emit(SOCKET_EVENTS.NEW_NOTIFICATION, populatedNotification);
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, { userId: currentUserId.toString() });
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: currentUserId.toString(),
      followersCount: updatedCurrent.followers.length
    });
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: requesterId.toString(),
      followingCount: updatedRequester.following.length
    });
  }

  res.status(200).json({
    success: true,
    message: "Journey Mate request accepted successfully",
    followersCount: updatedCurrent.followers.length,
    followingCount: updatedCurrent.following.length,
    requesterFollowingCount: updatedRequester.following.length
  });
});

const rejectFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  await User.findByIdAndUpdate(currentUserId, { $pull: { followRequests: requesterId } });
  await Notification.findOneAndDelete({ sender: requesterId, receiver: currentUserId, type: "follow_request" });

  const io = req.app.get("io");
  if (io) {
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, { userId: currentUserId.toString() });
  }

  res.status(200).json({ success: true, message: "Journey Mate request rejected" });
});

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

const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id || req.user.id;

  const [posts, trips, followers, following] = await Promise.all([
  Post.countDocuments({ userId }),
  TravelGroup.countDocuments({ host: userId }),
  Follow.countDocuments({ following: userId }),
  Follow.countDocuments({ follower: userId })]
  );

  res.status(200).json({
    success: true,
    stats: { posts, trips, followers, following }
  });
});

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
      connectionRequests: "everyone",
      journeyInvites: "everyone",
      whoCanMessage: "everyone",
      profileLocationVisibility: "mates_only"
    }
  });
});

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
      connectionRequests: "everyone",
      journeyInvites: "everyone",
      whoCanMessage: "everyone",
      profileLocationVisibility: "mates_only"
    };
  }

  const {
    privateAccount,
    allowStoryReplies,
    allowTravelGroupInvites,
    showOnlineStatus,
    connectionRequests,
    journeyInvites,
    whoCanMessage,
    profileLocationVisibility
  } = req.body;

  if (privateAccount !== undefined) {
    user.privateAccount = privateAccount;
    user.privacySettings.privateAccount = privateAccount;
  }
  if (allowStoryReplies !== undefined) user.privacySettings.allowStoryReplies = allowStoryReplies;
  if (allowTravelGroupInvites !== undefined) user.privacySettings.allowTravelGroupInvites = allowTravelGroupInvites;
  if (showOnlineStatus !== undefined) user.privacySettings.showOnlineStatus = showOnlineStatus;

  if (connectionRequests !== undefined) {
    if (["everyone", "mates_only"].includes(connectionRequests)) {
      user.privacySettings.connectionRequests = connectionRequests;
    }
  }
  if (journeyInvites !== undefined) {
    if (["everyone", "mates_only", "none"].includes(journeyInvites)) {
      user.privacySettings.journeyInvites = journeyInvites;
    }
  }
  if (whoCanMessage !== undefined) {
    if (["everyone", "mates_only", "none"].includes(whoCanMessage)) {
      user.privacySettings.whoCanMessage = whoCanMessage;
    }
  }
  if (profileLocationVisibility !== undefined) {
    if (["everyone", "mates_only", "none"].includes(profileLocationVisibility)) {
      user.privacySettings.profileLocationVisibility = profileLocationVisibility;
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Privacy settings updated successfully",
    privacySettings: user.privacySettings
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
  updatePrivacySettings
};
