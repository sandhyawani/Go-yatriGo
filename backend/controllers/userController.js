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
const {
  isBlockedPair,
  getBlockedUserIds,
  getBlockFilter,
  blockUserAction,
  unblockUserAction,
} = require("../utils/blockHelper");

const SOCKET_EVENTS = {
  NEW_NOTIFICATION: "new_notification",
  FOLLOWERS_UPDATED: "followers_updated",
  FOLLOWING_UPDATED: "following_updated",
  FOLLOW_REQUEST_RECEIVED: "follow_request_received",
  FOLLOW_REQUEST_ACCEPTED: "follow_request_accepted",
  FOLLOW_REQUEST_REJECTED: "follow_request_rejected",
  USER_BLOCKED: "user_blocked",
  USER_UNBLOCKED: "user_unblocked",
};

const updateUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  if (
    currentUserId.toString() !== targetUserId.toString() &&
    !req.user?.isAdmin
  ) {
    return res.status(403).json({
      success: false,
      code: "PROFILE_UPDATE_FORBIDDEN",
      message: "You are not authorized to update this profile",
    });
  }

  const hasStateUpdate = req.body.state !== undefined;
  const hasCityUpdate = req.body.city !== undefined;

  if (hasStateUpdate || hasCityUpdate) {
    const existingUser = await User.findById(targetUserId);
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const stateToValidate = hasStateUpdate
      ? req.body.state
      : existingUser.state;
    const cityToValidate = hasCityUpdate ? req.body.city : existingUser.city;

    if (hasStateUpdate && (!stateToValidate || !stateToValidate.trim())) {
      return res
        .status(400)
        .json({ success: false, message: "State cannot be empty" });
    }
    if (hasCityUpdate && (!cityToValidate || !cityToValidate.trim())) {
      return res
        .status(400)
        .json({ success: false, message: "City cannot be empty" });
    }

    const trimmedState = (stateToValidate || "").trim();
    const trimmedCity = (cityToValidate || "").trim();

    const validCities = INDIAN_STATES_AND_CITIES[trimmedState];
    if (!validCities) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid state: ${trimmedState}` });
    }

    if (!validCities.includes(trimmedCity)) {
      return res.status(400).json({
        success: false,
        message: `City ${trimmedCity} does not belong to ${trimmedState}`,
      });
    }

    if (hasStateUpdate) req.body.state = trimmedState;
    if (hasCityUpdate) req.body.city = trimmedCity;
  }

  const allowedUpdates = [
    "name",
    "username",
    "bio",
    "city",
    "state",
    "interests",
    "role",
    "type",
    "mobile",
    "img",
    "pic",
    "avatar",
    "profilePic",
    "coverImage",
    "coverPic",
    "govId",
    "govIdType",
    "privacySettings",
    "preferredTravelStyle",
    "favoriteDestinations",
  ];

  const updateData = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const newCover = updateData.coverImage || updateData.coverPic;
  if (newCover && typeof newCover === "string") {
    updateData.coverImage = newCover;
    updateData.coverPic = newCover;
  }

  const newPic =
    updateData.img ||
    updateData.pic ||
    updateData.avatar ||
    updateData.profilePic;
  if (
    newPic &&
    typeof newPic === "string" &&
    !newPic.includes("no-image-icon")
  ) {
    updateData.img = newPic;
    updateData.pic = newPic;
    updateData.avatar = newPic;
  }

  if (updateData.govIdType !== undefined && !updateData.govId) {
    delete updateData.govIdType;
  }

  if (updateData.govIdType) {
    const validGovIdTypes = [
      "Aadhaar Card",
      "PAN Card",
      "Passport",
      "Driving License",
    ];
    if (!validGovIdTypes.includes(updateData.govIdType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid document type." });
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
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid mobile number. Must be a 10-digit Indian mobile number starting with 6-9.",
        });
    }
    updateData.mobile = trimmedMobile;
  }

  const updatedUser = await User.findByIdAndUpdate(
    targetUserId,
    { $set: updateData },
    { new: true, runValidators: true },
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

const deleteUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (
    currentUserId.toString() !== targetUserId.toString() &&
    !req.user?.isAdmin
  ) {
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

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate(
      "followers",
      "name username pic img avatar profilePic profilePicture userPic type isVerified rating",
    )
    .populate(
      "following",
      "name username pic img avatar profilePic profilePicture userPic type isVerified rating",
    )
    .lean();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentUserId = req.user?._id || req.user?.id;
  const isOwner =
    currentUserId && currentUserId.toString() === user._id.toString();

  // Check bidirectional blocking
  if (currentUserId && !isOwner && !req.user?.isAdmin) {
    const isBlocked = await isBlockedPair(currentUserId, user._id);
    if (isBlocked) {
      const isBlockedByMe =
        (await Block.findOne({ blocker: currentUserId, blocked: user._id })) ||
        (await User.findOne({ _id: currentUserId, blockedUsers: user._id }));

      if (isBlockedByMe) {
        return res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            pic: user.pic,
            img: user.img,
            avatar: user.avatar,
            profilePic: user.profilePic,
            profilePicture: user.profilePicture,
            userPic: user.userPic,
            role: user.role,
            type: user.type,
            isBlockedByMe: true,
            canViewContent: false,
            followers: [],
            following: [],
            followersCount: 0,
            followingCount: 0,
            mutualsCount: 0,
            tripMatesCount: 0
          },
          isBlocked: true,
          isBlockedByMe: true
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "User profile unavailable",
          isBlocked: true,
          isBlockedByThem: true
        });
      }
    }
  }

  // Filter out any blocked users from populated followers/following lists
  if (currentUserId) {
    const { idSet: blockedIdSet } = await getBlockedUserIds(currentUserId);
    if (blockedIdSet.size > 0) {
      user.followers = (user.followers || []).filter(
        (f) => !blockedIdSet.has((f._id || f).toString())
      );
      user.following = (user.following || []).filter(
        (f) => !blockedIdSet.has((f._id || f).toString())
      );
    }
  }

  // Compute stats before any privacy stripping for private accounts
  user.followersCount = (user.followers || []).length;
  user.followingCount = (user.following || []).length;
  const followersList = (user.followers || []).map((f) => (f._id || f).toString());
  const followingSet = new Set((user.following || []).map((f) => (f._id || f).toString()));
  user.mutualsCount = followersList.filter((id) => followingSet.has(id)).length;

  if (!isOwner && !req.user?.isAdmin) {
    delete user.email;
    delete user.mobile;
    delete user.govId;
    delete user.govIdType;
    delete user.blockedUsers;
    // For privacy: do not leak other users' pending requests, but preserve whether current user has requested to follow
    if (user.followRequests && Array.isArray(user.followRequests) && currentUserId) {
      const hasPendingReq = user.followRequests.some(
        (id) => (id._id || id).toString() === currentUserId.toString()
      );
      user.followRequests = hasPendingReq ? [currentUserId.toString()] : [];
    } else {
      user.followRequests = [];
    }
    delete user.verificationNote;
    if (user.privacySettings) {
      user.privacySettings = {
        whoCanMessage: user.privacySettings.whoCanMessage || "everyone",
        connectionRequests: user.privacySettings.connectionRequests || "everyone"
      };
    }
  }

  let canViewContent = !user.privateAccount;
  const isFollower =
    currentUserId &&
    user.followers?.some(
      (follower) =>
        (follower._id || follower).toString() === currentUserId.toString(),
    );

  if (isOwner || isFollower || req.user?.isAdmin) {
    canViewContent = true;
  }

  user.canViewContent = canViewContent;

  if (!canViewContent) {
    user.followers = [];
    user.following = [];
  }

  const { getValidTripMates } = require("./tripMateController");
  const validTripMates = await getValidTripMates(user._id);
  user.tripMatesCount = validTripMates.length;

  if (currentUserId && !isOwner) {
    const TravelGroup = require("../models/TravelGroup");
    const Journey = require("../models/Journey");
    const Review = require("../models/Review");

    const completedGroups = await TravelGroup.find({
      status: "completed",
      isCancelled: { $ne: true },
      $and: [
        { $or: [{ host: currentUserId }, { "members.user": currentUserId }] },
        { $or: [{ host: user._id }, { "members.user": user._id }] },
      ],
    }).select("_id").lean();

    const completedJourneys = await Journey.find({
      status: { $in: ["Completed", "completed"] },
      isCancelled: { $ne: true },
      $and: [
        { $or: [{ creator: currentUserId }, { "members.user": currentUserId }] },
        { $or: [{ creator: user._id }, { "members.user": user._id }] },
      ],
    }).select("_id").lean();

    const allCompletedTripIds = [
      ...completedGroups.map((g) => g._id),
      ...completedJourneys.map((j) => j._id),
    ];

    user.hasSharedCompletedJourney = allCompletedTripIds.length > 0;

    if (allCompletedTripIds.length > 0) {
      const existingReviewsCount = await Review.countDocuments({
        reviewer: currentUserId,
        reviewedUser: user._id,
        tripId: { $in: allCompletedTripIds },
      });
      user.canReview = existingReviewsCount < allCompletedTripIds.length;
    } else {
      user.canReview = false;
    }
  }

  res.status(200).json({ success: true, user });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select(
    "name username pic img avatar profilePic profilePicture role type isVerified rating",
  );
  res.status(200).json({ success: true, users });
});

const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search || req.query.q || "";
  const filterCity = req.query.city;
  const filterState = req.query.state;
  const currentUserId = req.user?._id || req.user?.id;

  let queryConditions = {
    ...(currentUserId && { _id: { $ne: currentUserId } }),
  };

  if (currentUserId) {
    const { objectIds: blockedIds } = await getBlockedUserIds(currentUserId);
    if (blockedIds.length > 0) {
      queryConditions._id = {
        $nin: [new mongoose.Types.ObjectId(currentUserId.toString()), ...blockedIds]
      };
    }
  }

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

  const users = await User.find(queryConditions).select(
    "-password -email -mobile -govId -blockedUsers",
  );

  res.status(200).json({ success: true, users });
});

const followUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res
      .status(400)
      .json({ success: false, message: "You cannot follow yourself" });
  }

  const isBlocked = await isBlockedPair(currentUserId, targetUserId);
  if (isBlocked) {
    return res
      .status(403)
      .json({ success: false, message: "Cannot follow a blocked user" });
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId),
  ]);

  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (
    currentUser.following.some(
      (id) => id.toString() === targetUserId.toString(),
    )
  ) {
    return res.status(200).json({
      success: true,
      status: "following",
      isFollowing: true,
      message: `You already follow ${targetUser.name || "this traveler"}`,
    });
  }

  if (targetUser.privacySettings?.connectionRequests === "mates_only") {
    const isTargetFollowingCurrent = targetUser.following?.some(
      (id) => id.toString() === currentUserId.toString(),
    );
    if (!isTargetFollowingCurrent) {
      return res.status(403).json({
        success: false,
        message:
          "This traveler only accepts connection requests from mutual mates.",
      });
    }
  }

  const hasPendingRequest = (targetUser.followRequests || []).some(
    (id) => id.toString() === currentUserId.toString(),
  );
  if (hasPendingRequest) {
    return res.status(200).json({
      success: true,
      status: "requested",
      isRequested: true,
      message: "Follow request already sent",
    });
  }

  const io = req.app.get("io");

  if (targetUser.privateAccount) {
    const updatedTarget = await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followRequests: currentUserId } },
      { new: true },
    );

    const notification = await Notification.create({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow_request",
      category: "Social",
      message: `${currentUser.username || currentUser.name} requested to follow you`,
    });

    if (io) {
      const populatedNotification = await Notification.findById(
        notification._id,
      )
        .populate("sender", "name username avatar profilePicture pic img")
        .lean();
      io.to(targetUserId.toString()).emit(
        SOCKET_EVENTS.NEW_NOTIFICATION,
        populatedNotification,
      );
      io.to(targetUserId.toString()).emit(
        SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED,
        {
          senderId: currentUserId.toString(),
          followRequests: updatedTarget.followRequests,
        },
      );
    }

    return res.status(200).json({
      success: true,
      status: "requested",
      message: "Follow request sent successfully",
    });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: targetUserId } },
      { new: true },
    ),
    User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true },
    ),
  ]);

  if (Follow) {
    await Follow.findOneAndUpdate(
      { follower: currentUserId, following: targetUserId },
      { follower: currentUserId, following: targetUserId },
      { upsert: true, new: true },
    );
  }

  const notification = await Notification.create({
    sender: currentUserId,
    receiver: targetUserId,
    type: "follow",
    category: "Social",
    message: `${currentUser.username || currentUser.name} started following you`,
  });

  if (io) {
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name username avatar profilePicture pic img")
      .lean();
    io.to(targetUserId.toString()).emit(
      SOCKET_EVENTS.NEW_NOTIFICATION,
      populatedNotification,
    );
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
    message: "Successfully followed user",
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
    (id) => id.toString() === currentUserId.toString(),
  );

  const io = req.app.get("io");

  if (hasPendingRequest) {
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followRequests: currentUserId },
    });
    await Notification.findOneAndDelete({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow_request",
    });

    if (io) {
      io.to(targetUserId.toString()).emit(
        SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED,
        { userId: currentUserId.toString() },
      );
    }

    return res.status(200).json({
      success: true,
      status: "none",
      message: "Follow request cancelled successfully",
    });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } },
      { new: true },
    ),
    User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true },
    ),
  ]);

  if (Follow) {
    await Follow.deleteOne({
      follower: currentUserId,
      following: targetUserId,
    });
  }

  await Notification.findOneAndDelete({
    sender: currentUserId,
    receiver: targetUserId,
    type: "follow",
  });

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
    message: "Successfully unfollowed user",
  });
});

const removeFollower = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const [updatedCurrent, updatedTarget] = await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      { $pull: { followers: targetUserId } },
      { new: true }
    ),
    User.findByIdAndUpdate(
      targetUserId,
      { $pull: { following: currentUserId } },
      { new: true }
    )
  ]);

  if (Follow) {
    await Follow.deleteOne({
      follower: targetUserId,
      following: currentUserId,
    });
  }

  const io = req.app.get("io");
  if (io) {
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.FOLLOWERS_UPDATED, {
      targetId: currentUserId.toString(),
      followersCount: updatedCurrent.followers.length,
    });
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.FOLLOWING_UPDATED, {
      targetId: targetUserId.toString(),
      followingCount: updatedTarget.following.length,
    });
  }

  res.status(200).json({
    success: true,
    message: "Follower removed successfully",
  });
});

const rateUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const { rating, review, journeyId } = req.body;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res
      .status(400)
      .json({ success: false, code: "INVALID_SELF_ACTION", message: "You cannot rate or review yourself" });
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
    return res
      .status(400)
      .json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const TravelGroup = require("../models/TravelGroup");
  const Journey = require("../models/Journey");
  const Review = require("../models/Review");

  let candidateTrips = [];

  if (journeyId) {
    const group = await TravelGroup.findOne({
      _id: journeyId,
      status: "completed",
      isCancelled: { $ne: true },
      $and: [
        { $or: [{ host: currentUserId }, { "members.user": currentUserId }] },
        { $or: [{ host: targetUserId }, { "members.user": targetUserId }] },
      ],
    }).lean();

    if (group) {
      candidateTrips.push({ _id: group._id, tripType: "TravelGroup" });
    } else {
      const journey = await Journey.findOne({
        _id: journeyId,
        status: { $in: ["Completed", "completed"] },
        isCancelled: { $ne: true },
        $and: [
          { $or: [{ creator: currentUserId }, { "members.user": currentUserId }] },
          { $or: [{ creator: targetUserId }, { "members.user": targetUserId }] },
        ],
      }).lean();

      if (journey) {
        candidateTrips.push({ _id: journey._id, tripType: "Journey" });
      }
    }
  } else {
    const groups = await TravelGroup.find({
      status: "completed",
      isCancelled: { $ne: true },
      $and: [
        { $or: [{ host: currentUserId }, { "members.user": currentUserId }] },
        { $or: [{ host: targetUserId }, { "members.user": targetUserId }] },
      ],
    }).select("_id").lean();

    const journeys = await Journey.find({
      status: { $in: ["Completed", "completed"] },
      isCancelled: { $ne: true },
      $and: [
        { $or: [{ creator: currentUserId }, { "members.user": currentUserId }] },
        { $or: [{ creator: targetUserId }, { "members.user": targetUserId }] },
      ],
    }).select("_id").lean();

    candidateTrips = [
      ...groups.map((g) => ({ _id: g._id, tripType: "TravelGroup" })),
      ...journeys.map((j) => ({ _id: j._id, tripType: "Journey" })),
    ];
  }

  if (candidateTrips.length === 0) {
    return res.status(403).json({
      success: false,
      code: "REVIEW_NOT_ELIGIBLE",
      message: "You can only rate travelers with whom you have completed a journey",
    });
  }

  // Check which candidate trips have already been reviewed by currentUserId
  const candidateTripIds = candidateTrips.map((t) => t._id);
  const existingReviews = await Review.find({
    reviewer: currentUserId,
    reviewedUser: targetUserId,
    tripId: { $in: candidateTripIds },
  }).lean();

  const reviewedTripIdSet = new Set(existingReviews.map((r) => r.tripId.toString()));
  const unreviewedTrip = candidateTrips.find((t) => !reviewedTripIdSet.has(t._id.toString()));

  if (!unreviewedTrip) {
    return res.status(409).json({
      success: false,
      code: "DUPLICATE_REVIEW",
      message: "You have already rated this traveler for all shared completed journeys.",
    });
  }

  // Create review record
  try {
    await Review.create({
      reviewer: currentUserId,
      reviewedUser: targetUserId,
      rating: numRating,
      review: typeof review === "string" ? review.trim() : "",
      tripId: unreviewedTrip._id,
      tripType: unreviewedTrip.tripType,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_REVIEW",
        message: "You have already rated this traveler for this completed journey.",
      });
    }
    throw err;
  }

  // Recalculate targetUser rating & reviewsCount directly from all Review records
  const allUserReviews = await Review.find({ reviewedUser: targetUserId });
  const totalReviews = allUserReviews.length;
  const ratingSum = allUserReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

  targetUser.rating = averageRating;
  targetUser.reviewsCount = totalReviews;
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "Rating submitted successfully",
    rating: targetUser.rating,
    reviewsCount: targetUser.reviewsCount,
  });
});

const blockUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId.toString()) {
    return res
      .status(400)
      .json({ success: false, message: "You cannot block yourself" });
  }

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await blockUserAction(currentUserId, targetUserId);

  const io = req.app.get("io");
  if (io) {
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.USER_BLOCKED, {
      blockerId: currentUserId.toString(),
      blockedId: targetUserId.toString(),
    });
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.USER_BLOCKED, {
      blockerId: currentUserId.toString(),
      blockedId: targetUserId.toString(),
    });
  }

  res.status(200).json({ success: true, message: "User blocked successfully" });
});

const unblockUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;

  await unblockUserAction(currentUserId, targetUserId);

  const io = req.app.get("io");
  if (io) {
    io.to(currentUserId.toString()).emit(SOCKET_EVENTS.USER_UNBLOCKED, {
      unblockerId: currentUserId.toString(),
      unblockedId: targetUserId.toString(),
    });
    io.to(targetUserId.toString()).emit(SOCKET_EVENTS.USER_UNBLOCKED, {
      unblockerId: currentUserId.toString(),
      unblockedId: targetUserId.toString(),
    });
  }

  res
    .status(200)
    .json({ success: true, message: "User unblocked successfully" });
});

const reportUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please provide a reason for reporting",
      });
  }

  const existingReport = await Report.findOne({
    reporter: currentUserId,
    targetId: targetUserId,
    targetType: "user",
  });
  if (existingReport) {
    return res.status(400).json({
      success: false,
      message: "You've already flagged this traveler for our safety team. We're on it!",
    });
  }

  const targetUser = await User.findByIdAndUpdate(
    targetUserId,
    { $push: { reportedBy: { reporterId: currentUserId, reason } } },
    { new: true },
  );

  if (!targetUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await Report.create({
    reporter: currentUserId,
    reportedUser: targetUserId,
    targetType: "user",
    targetId: targetUserId,
    reason,
  });

  res
    .status(200)
    .json({
      success: true,
      message: "Thanks for keeping Go YatriGo safe! Your report has been submitted.",
    });
});

const formatDateRange = (startDate, endDate) => {
  if (!startDate) return "";
  const s = new Date(startDate);
  if (isNaN(s.getTime())) return "";
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const sDay = s.getDate();

  if (!endDate) return `${sMonth} ${sDay}`;
  const e = new Date(endDate);
  if (isNaN(e.getTime())) return `${sMonth} ${sDay}`;
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const eDay = e.getDate();

  if (sMonth === eMonth) {
    if (sDay === eDay) {
      return `${sMonth} ${sDay}`;
    }
    return `${sMonth} ${sDay}–${eDay}`;
  }
  return `${sMonth} ${sDay}–${eMonth} ${eDay}`;
};

const getCountdownString = (startDate) => {
  if (!startDate) return null;
  const s = new Date(startDate);
  const now = new Date();
  const diffDays = Math.ceil((s - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return null;
  if (diffDays === 1) return "Leaving tomorrow";
  if (diffDays <= 7) return `Leaving in ${diffDays} days`;
  if (diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    return `Leaving in ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }
  const months = Math.round(diffDays / 30);
  return `Leaving in ${months} ${months === 1 ? "month" : "months"}`;
};

const getOverlapDays = (cStart, cEnd, userDates) => {
  if (!cStart || !userDates.length) return 0;
  const cs = new Date(cStart);
  const ce = cEnd ? new Date(cEnd) : cs;
  if (isNaN(cs.getTime())) return 0;

  for (const u of userDates) {
    const us = u.startDate;
    const ue = u.endDate || us;
    const overlapStart = Math.max(cs.getTime(), us.getTime());
    const overlapEnd = Math.min(ce.getTime(), ue.getTime());
    if (overlapEnd >= overlapStart) {
      const days =
        Math.round((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
      return days;
    }
  }
  return 0;
};

const getSharedDateRange = (cStart, cEnd, userTrips) => {
  if (!cStart || !userTrips || !userTrips.length) return null;
  const cs = new Date(cStart);
  const ce = cEnd ? new Date(cEnd) : cs;
  if (isNaN(cs.getTime())) return null;

  for (const u of userTrips) {
    if (!u.startDate) continue;
    const us = new Date(u.startDate);
    const ue = u.endDate ? new Date(u.endDate) : us;
    if (isNaN(us.getTime())) continue;

    const overlapStart = Math.max(cs.getTime(), us.getTime());
    const overlapEnd = Math.min(ce.getTime(), ue.getTime());
    if (overlapEnd >= overlapStart) {
      return formatDateRange(new Date(overlapStart), new Date(overlapEnd));
    }
  }
  return null;
};

const isSameDestination = (dest1, dest2) => {
  if (!dest1 || !dest2) return false;
  const d1 = dest1.trim().toLowerCase().split(",")[0].trim();
  const d2 = dest2.trim().toLowerCase().split(",")[0].trim();
  if (d1 === d2) return true;
  const s1 = dest1.trim().toLowerCase();
  const s2 = dest2.trim().toLowerCase();
  return s1.includes(d2) || s2.includes(d1);
};

const getTravelerSuggestions = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const currentUser = await User.findById(currentUserId)
    .select(
      "following followers blockedUsers city state interests preferredTravelStyle favoriteDestinations createdAt",
    )
    .lean();

  const followingList = (currentUser?.following || []).map((id) =>
    (id._id || id).toString(),
  );
  const userFollowingSet = new Set(followingList);

  const { idSet: blockedUsersSet } = await getBlockedUserIds(currentUserId);

  const queryDestination = req.query.destination?.trim().toLowerCase();
  const queryCity = (
    req.query.from ||
    req.query.city ||
    req.query.departureCity
  )
    ?.trim()
    .toLowerCase();
  const queryGroupId = req.query.groupId;

  const userBaseCity = (queryCity || currentUser?.city || "")
    .trim()
    .toLowerCase();
  const userBaseState = (currentUser?.state || "").trim().toLowerCase();
  const userInterests = new Set(
    (currentUser?.interests || []).map((i) => i.toLowerCase()),
  );
  if (currentUser?.preferredTravelStyle) {
    userInterests.add(currentUser.preferredTravelStyle.toLowerCase());
  }

  // 1. Fetch current user's journeys and travel groups
  const [currentUserJourneys, currentUserGroups] = await Promise.all([
    Journey.find({
      $or: [{ creator: currentUserId }, { "members.user": currentUserId }],
      isCancelled: { $ne: true },
      status: {
        $in: [
          "Ongoing",
          "ongoing",
          "Upcoming",
          "upcoming",
          "Planning",
          "planning",
          "open",
          "active",
        ],
      },
    })
      .select("destination from startDate endDate creator members")
      .lean(),

    TravelGroup.find({
      $or: [{ host: currentUserId }, { "members.user": currentUserId }],
      isCancelled: { $ne: true },
      status: {
        $in: [
          "Ongoing",
          "ongoing",
          "Upcoming",
          "upcoming",
          "Planning",
          "planning",
          "open",
          "active",
        ],
      },
    })
      .select("destination from startDate endDate host members")
      .lean(),
  ]);

  const currentUserDestinations = new Set();
  const currentUserTrips = [];

  if (queryDestination) {
    currentUserDestinations.add(queryDestination);
    if (req.query.startDate) {
      const s = new Date(req.query.startDate);
      const e = new Date(req.query.endDate || req.query.startDate);
      currentUserTrips.push({
        destination: queryDestination,
        startDate: s,
        endDate: e,
      });
    }
  }

  if (currentUser?.favoriteDestinations) {
    currentUser.favoriteDestinations.forEach((dest) => {
      if (dest) currentUserDestinations.add(dest.trim().toLowerCase());
    });
  }

  const currentUserDepartureCities = new Set();
  if (userBaseCity) currentUserDepartureCities.add(userBaseCity);

  const currentUserDates = [];
  const currentUserTripMateIds = new Set();
  const currentUserGroupIds = new Set();

  currentUserJourneys.forEach((j) => {
    if (j.destination) {
      currentUserDestinations.add(j.destination.trim().toLowerCase());
      if (j.startDate) {
        currentUserTrips.push({
          destination: j.destination,
          startDate: new Date(j.startDate),
          endDate: new Date(j.endDate || j.startDate),
        });
      }
    }
    if (j.from) currentUserDepartureCities.add(j.from.trim().toLowerCase());
    if (j.startDate) {
      currentUserDates.push({
        startDate: new Date(j.startDate),
        endDate: new Date(j.endDate || j.startDate),
      });
    }
    if (j.creator && j.creator.toString() !== currentUserId.toString()) {
      currentUserTripMateIds.add(j.creator.toString());
    }
    if (j.members) {
      j.members.forEach((m) => {
        if (m.user && m.user.toString() !== currentUserId.toString()) {
          currentUserTripMateIds.add(m.user.toString());
        }
      });
    }
  });

  currentUserGroups.forEach((g) => {
    currentUserGroupIds.add(g._id.toString());
    if (g.destination) {
      currentUserDestinations.add(g.destination.trim().toLowerCase());
      if (g.startDate) {
        currentUserTrips.push({
          destination: g.destination,
          startDate: new Date(g.startDate),
          endDate: new Date(g.endDate || g.startDate),
        });
      }
    }
    if (g.from) currentUserDepartureCities.add(g.from.trim().toLowerCase());
    if (g.startDate) {
      currentUserDates.push({
        startDate: new Date(g.startDate),
        endDate: new Date(g.endDate || g.startDate),
      });
    }
    if (g.host && g.host.toString() !== currentUserId.toString()) {
      currentUserTripMateIds.add(g.host.toString());
    }
    if (g.members) {
      g.members.forEach((m) => {
        if (m.user && m.user.toString() !== currentUserId.toString()) {
          currentUserTripMateIds.add(m.user.toString());
        }
      });
    }
  });

  // 2. Fetch all public non-cancelled journeys and travel groups for candidate matching
  const [allJourneys, allGroups] = await Promise.all([
    Journey.find({
      isCancelled: { $ne: true },
      isPrivate: { $ne: true },
      status: {
        $in: [
          "Ongoing",
          "ongoing",
          "Upcoming",
          "upcoming",
          "Completed",
          "completed",
          "Planning",
          "planning",
        ],
      },
    })
      .select(
        "creator members destination from title status startDate endDate createdAt",
      )
      .lean(),

    TravelGroup.find({
      isCancelled: { $ne: true },
      isPrivate: { $ne: true },
      status: {
        $in: [
          "Ongoing",
          "ongoing",
          "Upcoming",
          "upcoming",
          "Completed",
          "completed",
          "open",
          "active",
        ],
      },
    })
      .select(
        "host members destination from title status startDate endDate createdAt groupName",
      )
      .lean(),
  ]);

  // Exclude current user, blocked users, existing following, and existing trip mates from discovery
  const excludeUserIds = new Set();
  excludeUserIds.add(currentUserId.toString());
  followingList.forEach((id) => excludeUserIds.add(id));
  blockedUsersSet.forEach((id) => excludeUserIds.add(id));
  currentUserTripMateIds.forEach((id) => excludeUserIds.add(id));

  if (queryGroupId) {
    const targetGroup = allGroups.find(
      (g) => g._id.toString() === queryGroupId,
    );
    if (targetGroup) {
      if (targetGroup.host) excludeUserIds.add(targetGroup.host.toString());
      if (targetGroup.members) {
        targetGroup.members.forEach((m) => {
          if (m.user) excludeUserIds.add((m.user._id || m.user).toString());
        });
      }
    }
  }

  // Build candidate trips & group maps
  const candidateTripsMap = {};
  const candidateGroupMap = {};

  const addTripToMap = (userId, trip) => {
    if (!userId) return;
    const uid = (userId._id || userId).toString();
    if (!candidateTripsMap[uid]) {
      candidateTripsMap[uid] = [];
    }
    candidateTripsMap[uid].push(trip);
  };

  const addGroupToMap = (userId, groupId) => {
    if (!userId) return;
    const uid = (userId._id || userId).toString();
    if (!candidateGroupMap[uid]) {
      candidateGroupMap[uid] = new Set();
    }
    candidateGroupMap[uid].add(groupId.toString());
  };

  allJourneys.forEach((j) => {
    const tripInfo = {
      type: "journey",
      destination: j.destination,
      from: j.from,
      startDate: j.startDate,
      endDate: j.endDate,
      title: j.title,
      status: (j.status || "").toLowerCase(),
    };
    if (j.creator) addTripToMap(j.creator, tripInfo);
    if (j.members) {
      j.members.forEach((m) => {
        if (m.user) addTripToMap(m.user, tripInfo);
      });
    }
  });

  allGroups.forEach((g) => {
    const tripInfo = {
      type: "group",
      destination: g.destination,
      from: g.from,
      startDate: g.startDate,
      endDate: g.endDate,
      title: g.title || g.groupName,
      status: (g.status || "").toLowerCase(),
    };
    if (g.host) {
      addTripToMap(g.host, tripInfo);
      addGroupToMap(g.host, g._id);
    }
    if (g.members) {
      g.members.forEach((m) => {
        if (m.user) {
          addTripToMap(m.user, tripInfo);
          addGroupToMap(m.user, g._id);
        }
      });
    }
  });

  const candidateQuery = {
    isAdmin: { $ne: true },
    isDeleted: { $ne: true },
    isSuspended: { $ne: true },
    isDeactivated: { $ne: true },
    _id: {
      $nin: Array.from(excludeUserIds),
    },
    $or: [
      { role: { $in: ["Traveler", "traveler"] } },
      { type: { $in: ["Traveler", "traveler"] } },
    ],
  };

  const candidates = await User.find(candidateQuery)
    .select(
      "name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests preferredTravelStyle favoriteDestinations followers following followRequests privateAccount city state bio createdAt",
    )
    .lean();

  const filterUsers = (users) => {
    const bannedNames = /^(test|admin|owner|seed|demo)/i;
    return users.filter(
      (user) =>
        !excludeUserIds.has(user._id.toString()) &&
        !bannedNames.test(user.name || "") &&
        !bannedNames.test(user.username || ""),
    );
  };

  const filteredCandidates = filterUsers(candidates);

  const checkDateOverlap = (tripStart, tripEnd, userDateRanges) => {
    if (!tripStart || !userDateRanges.length) return false;
    const cStart = new Date(tripStart);
    const cEnd = tripEnd ? new Date(tripEnd) : cStart;
    if (isNaN(cStart.getTime())) return false;

    for (const range of userDateRanges) {
      const uStart = range.startDate;
      const uEnd = range.endDate || uStart;
      const overlap = cStart <= uEnd && cEnd >= uStart;
      const diffDays = Math.abs(cStart - uStart) / (1000 * 60 * 60 * 24);
      if (overlap || diffDays <= 4) {
        return true;
      }
    }
    return false;
  };

  const scoredCandidates = [];

  for (const c of filteredCandidates) {
    const cId = c._id.toString();
    const cCity = (c.city || "").trim().toLowerCase();
    const cState = (c.state || "").trim().toLowerCase();
    const cTrips = candidateTripsMap[cId] || [];

    // 1. Travel Match Signals
    let hasSameDestination = false;
    let matchedDestinationName = "";
    for (const t of cTrips) {
      if (
        t.destination &&
        currentUserDestinations.has(t.destination.trim().toLowerCase())
      ) {
        hasSameDestination = true;
        matchedDestinationName = t.destination.split(",")[0].trim();
        break;
      }
    }

    let hasOverlappingDates = false;
    for (const t of cTrips) {
      if (checkDateOverlap(t.startDate, t.endDate, currentUserDates)) {
        hasOverlappingDates = true;
        break;
      }
    }

    const ongoingTrip = cTrips.find((t) => t.status === "ongoing");
    const upcomingTrip = cTrips.find((t) =>
      ["upcoming", "open", "planning", "active"].includes(t.status),
    );
    const completedTrip = cTrips.find((t) => t.status === "completed");

    let hasSameDeparture = false;
    for (const t of cTrips) {
      if (
        t.from &&
        currentUserDepartureCities.has(t.from.trim().toLowerCase())
      ) {
        hasSameDeparture = true;
        break;
      }
    }

    // 2. Local Signals
    const isSameCity = Boolean(userBaseCity && cCity && cCity === userBaseCity);
    const isSameState = Boolean(
      userBaseState && cState && cState === userBaseState,
    );

    // 3. Social / Interests Signals
    let hasCommonGroup = false;
    const cGroupIds = candidateGroupMap[cId] || new Set();
    for (const gId of cGroupIds) {
      if (currentUserGroupIds.has(gId)) {
        hasCommonGroup = true;
        break;
      }
    }

    let mutualCount = 0;
    const cFollowers = (c.followers || []).map((id) =>
      (id._id || id).toString(),
    );
    cFollowers.forEach((fId) => {
      if (userFollowingSet.has(fId)) {
        mutualCount++;
      }
    });

    let sharedInterestsCount = 0;
    const cInterests = (c.interests || []).map((i) => i.toLowerCase());
    if (c.preferredTravelStyle)
      cInterests.push(c.preferredTravelStyle.toLowerCase());
    cInterests.forEach((ci) => {
      if (userInterests.has(ci)) sharedInterestsCount++;
    });

    // 4. New User Status
    const isNewUser =
      (!c.completedTrips || c.completedTrips === 0) &&
      (!c.createdAt ||
        new Date() - new Date(c.createdAt) < 60 * 24 * 60 * 60 * 1000);

    // Priority Scoring:
    // 1. Same city + compatible upcoming trip (6000)
    // 2. Same city + overlapping travel dates (5500)
    // 3. Same state + compatible destination/trip (4000)
    // 4. Same destination + overlapping dates (3500)
    // 5. Nearby/other location + strong trip compatibility (3000)
    // 6. Same city/state + shared travel interests (2000)
    // 7. New users from same city/state (1500)
    // 8. Otherwise weak/random recommendation -> score = 0 (EXCLUDED)
    let score = 0;

    if (isSameCity && upcomingTrip) {
      score = 6000;
    } else if (isSameCity && hasOverlappingDates) {
      score = 5500;
    } else if (
      isSameState &&
      (hasSameDestination || upcomingTrip || ongoingTrip)
    ) {
      score = 4000;
    } else if (hasSameDestination && hasOverlappingDates) {
      score = 3500;
    } else if (
      hasSameDestination ||
      hasOverlappingDates ||
      ongoingTrip ||
      (hasSameDeparture && upcomingTrip)
    ) {
      score = 3000;
    } else if ((isSameCity || isSameState) && sharedInterestsCount > 0) {
      score = 2000 + sharedInterestsCount * 50;
    } else if (isSameCity && c.completedTrips > 0) {
      score = 1800;
    } else if ((isSameCity || isSameState) && isNewUser) {
      score = 1500;
    } else if (isSameState && c.completedTrips > 0) {
      score = 1000;
    } else if (!userBaseCity && !userBaseState) {
      // User with no location set: score by trip activity
      if (ongoingTrip) score = 1200;
      else if (upcomingTrip) score = 1000;
      else if (c.completedTrips > 0) score = 800;
      else if (isNewUser) score = 600;
    } else {
      score = 0; // Exclude weak/random candidates
    }

    if (score > 0) {
      // Format dynamic details
      const bestTrip = ongoingTrip || upcomingTrip || completedTrip;
      const cleanDest = (
        bestTrip?.destination ||
        bestTrip?.title ||
        ""
      )
        .split(",")[0]
        .trim();

      const dateRangeStr = bestTrip?.startDate
        ? formatDateRange(bestTrip.startDate, bestTrip.endDate)
        : "";
      const countdownStr = bestTrip?.startDate
        ? getCountdownString(bestTrip.startDate)
        : null;

      // Extract up to 2 travel interests
      const rawInterests = (c.interests || []).filter(Boolean);
      if (rawInterests.length < 2 && c.preferredTravelStyle) {
        rawInterests.push(c.preferredTravelStyle);
      }
      const interestsStr = rawInterests.slice(0, 2).join(" • ");

      // Check if candidate and current user share destination
      const matchingUserTrips = currentUserTrips.filter(
        (ut) =>
          isSameDestination(ut.destination, bestTrip?.destination) ||
          (cleanDest && isSameDestination(ut.destination, cleanDest)),
      );

      const hasSharedDest =
        matchingUserTrips.length > 0 ||
        (cleanDest && currentUserDestinations.has(cleanDest.toLowerCase())) ||
        (bestTrip?.destination &&
          currentUserDestinations.has(bestTrip.destination.trim().toLowerCase()));

      const sharedDatesStr = bestTrip?.startDate
        ? getSharedDateRange(
            bestTrip.startDate,
            bestTrip.endDate,
            matchingUserTrips.length > 0 ? matchingUserTrips : currentUserDates,
          )
        : null;

      let primaryDetail = "";
      let secondaryDetail = "";

      if (ongoingTrip) {
        // Rule 4: If the traveler is currently on a trip
        primaryDetail = cleanDest
          ? `Currently in ${cleanDest}`
          : "Currently traveling";

        if (hasSharedDest && sharedDatesStr) {
          // Rule 2: Shared destination with intersecting dates
          secondaryDetail = `Also traveling ${sharedDatesStr}`;
        } else if (hasSharedDest && cleanDest) {
          // Rule 3: Shared destination with different dates
          secondaryDetail = `Also visiting ${cleanDest}`;
        } else if (interestsStr) {
          // Rule 6: Travel interests
          secondaryDetail = interestsStr;
        } else if (c.city) {
          secondaryDetail = `From ${c.city}`;
        }
      } else if (upcomingTrip) {
        // Rule 1: Upcoming trip with destination and dates
        if (cleanDest && dateRangeStr) {
          primaryDetail = `Going to ${cleanDest} · ${dateRangeStr}`;
        } else if (cleanDest) {
          primaryDetail = `Going to ${cleanDest}`;
        } else {
          primaryDetail = "Upcoming trip";
        }

        if (hasSharedDest && sharedDatesStr) {
          // Rule 2: Shared destination with intersecting dates
          secondaryDetail = `Also traveling ${sharedDatesStr}`;
        } else if (hasSharedDest && cleanDest) {
          // Rule 3: Shared destination with different dates
          secondaryDetail = `Also visiting ${cleanDest}`;
        } else if (interestsStr) {
          // Rule 6: Travel interests
          secondaryDetail = interestsStr;
        } else if (countdownStr) {
          secondaryDetail = countdownStr;
        } else if (c.completedTrips > 0) {
          secondaryDetail = `${c.completedTrips} ${c.completedTrips === 1 ? "trip" : "trips"} completed`;
        } else if (c.city) {
          secondaryDetail = `Based in ${c.city}`;
        }
      } else if (completedTrip) {
        // Rule 5: If the traveler has completed a trip
        primaryDetail = cleanDest
          ? `Recently visited ${cleanDest}`
          : c.completedTrips > 0
          ? `${c.completedTrips} ${c.completedTrips === 1 ? "trip" : "trips"} completed`
          : "Recently traveled";

        if (hasSharedDest && cleanDest) {
          // Rule 3: Shared destination
          secondaryDetail = `Also visiting ${cleanDest}`;
        } else if (interestsStr) {
          // Rule 6: Travel interests
          secondaryDetail = interestsStr;
        } else if (c.completedTrips > 1) {
          secondaryDetail = `${c.completedTrips} trips completed`;
        } else if (c.city) {
          secondaryDetail = `Based in ${c.city}`;
        }
      } else if (c.completedTrips > 0) {
        primaryDetail = `${c.completedTrips} ${c.completedTrips === 1 ? "trip" : "trips"} completed`;
        if (interestsStr) {
          secondaryDetail = interestsStr;
        } else if (c.city) {
          secondaryDetail = `Based in ${c.city}`;
        }
      } else if (isNewUser) {
        // Rule 6: No useful trip information
        if (interestsStr) {
          primaryDetail = interestsStr;
          secondaryDetail = "New to YatriGo";
        } else {
          primaryDetail = "New to YatriGo";
          secondaryDetail = c.city ? `From ${c.city}` : "";
        }
      } else {
        // Rule 6: No useful trip information
        if (interestsStr) {
          primaryDetail = interestsStr;
          secondaryDetail = c.city ? `Based in ${c.city}` : "";
        } else if (c.city) {
          primaryDetail = `From ${c.city}`;
        }
      }

      let matchPercentage = 78;
      if (isSameCity && upcomingTrip) matchPercentage = 98;
      else if (isSameCity && hasOverlappingDates) matchPercentage = 96;
      else if (isSameCity && sharedInterestsCount > 0) matchPercentage = Math.min(96, 91 + sharedInterestsCount * 2);
      else if (isSameCity) matchPercentage = 90;
      else if (isSameState && (upcomingTrip || hasSameDestination)) matchPercentage = 88;
      else if (isSameState && sharedInterestsCount > 0) matchPercentage = 85;
      else if (isSameState) matchPercentage = 82;
      else if (hasSameDestination) matchPercentage = 84;
      else if (sharedInterestsCount > 0) matchPercentage = Math.min(85, 78 + sharedInterestsCount * 3);

      const locationBadge = isSameCity
        ? `📍 In Your City`
        : isSameState
        ? `📍 Same State`
        : c.city
        ? `📍 ${c.city}`
        : "🧭 Explorer";

      scoredCandidates.push({
        ...c,
        score,
        matchPercentage,
        locationBadge,
        interestMatchesCount: sharedInterestsCount,
        isSameCity,
        isSameState,
        primaryDetail,
        secondaryDetail,
        suggestionReasonText: primaryDetail,
        travelStyle: c.preferredTravelStyle || (c.interests && c.interests[0]) || "Explorer",
      });
    }
  }

  // Deduplicate and return top candidates
  scoredCandidates.sort((a, b) => b.score - a.score);

  const seenIds = new Set();
  const topSuggestions = [];
  for (const s of scoredCandidates) {
    const sId = s._id.toString();
    if (!seenIds.has(sId)) {
      seenIds.add(sId);
      topSuggestions.push(s);
      if (topSuggestions.length >= 30) break;
    }
  }

  res.status(200).json({ success: true, suggestions: topSuggestions });
});

const reportItem = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const { targetId, targetType, reportedUserId, reason } = req.body;

  if (!targetId || !targetType || !reportedUserId || !reason?.trim()) {
    return res.status(400).json({
      success: false,
      message: "targetId, targetType, reportedUserId and reason are required",
    });
  }

  const existingReport = await Report.findOne({
    reporter: currentUserId,
    targetId,
    targetType,
  });
  if (existingReport) {
    return res
      .status(400)
      .json({
        success: false,
        message: "You've already flagged this for our community safety team. We're on it!",
      });
  }

  await Report.create({
    reporter: currentUserId,
    reportedUser: reportedUserId,
    targetId,
    targetType,
    reason,
  });

  res
    .status(200)
    .json({
      success: true,
      message: "Thanks for keeping Go YatriGo safe! Your report has been submitted.",
    });
});

const acceptFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Idempotency: if already following/accepted
  if (currentUser.followers.some((id) => String(id) === String(requesterId))) {
    return res.status(200).json({
      success: true,
      message: "Follow request already accepted",
      followersCount: currentUser.followers.length,
      followingCount: currentUser.following.length,
    });
  }

  const isBlocked = await isBlockedPair(currentUserId, requesterId);
  if (isBlocked) {
    return res
      .status(403)
      .json({ success: false, message: "Cannot accept follow request from a blocked user" });
  }

  if (
    !currentUser.followRequests.some(
      (id) => String(id) === String(requesterId),
    )
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No active follow request found",
      });
  }

  const [updatedCurrent, updatedRequester] = await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: { followRequests: requesterId },
        $addToSet: { followers: requesterId },
      },
      { new: true },
    ),
    User.findByIdAndUpdate(
      requesterId,
      { $addToSet: { following: currentUserId } },
      { new: true },
    ),
  ]);

  if (Follow) {
    await Follow.findOneAndUpdate(
      { follower: requesterId, following: currentUserId },
      { follower: requesterId, following: currentUserId },
      { upsert: true, new: true },
    );
  }

  const notification = await Notification.create({
    sender: currentUserId,
    receiver: requesterId,
    type: "follow_accept",
    message: `${updatedCurrent.username || updatedCurrent.name} accepted your follow request`,
  });

  await Notification.findOneAndDelete({
    sender: requesterId,
    receiver: currentUserId,
    type: "follow_request",
  });

  const io = req.app.get("io");
  if (io) {
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name username avatar profilePicture pic img")
      .lean();

    io.to(requesterId.toString()).emit(
      SOCKET_EVENTS.NEW_NOTIFICATION,
      populatedNotification,
    );
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, {
      userId: currentUserId.toString(),
    });
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
    requesterFollowingCount: updatedRequester ? updatedRequester.following.length : 0,
  });
});

const rejectFollowRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const requesterId = req.params.id;

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { followRequests: requesterId },
  });
  await Notification.findOneAndDelete({
    sender: requesterId,
    receiver: currentUserId,
    type: "follow_request",
  });

  const io = req.app.get("io");
  if (io) {
    io.to(requesterId.toString()).emit(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, {
      userId: currentUserId.toString(),
    });
  }

  res
    .status(200)
    .json({ success: true, message: "Follow request rejected" });
});

const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "followers",
    "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount",
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentUserId = req.user?._id || req.user?.id;
  if (currentUserId && user._id.toString() !== currentUserId.toString()) {
    const isBlocked = await isBlockedPair(currentUserId, user._id);
    if (isBlocked) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  }

  if (user.privateAccount) {
    const isOwner = currentUserId && user._id.toString() === currentUserId.toString();
    const isFollower = currentUserId && user.followers.some((f) => (f._id || f).toString() === currentUserId.toString());
    const isAdmin = req.user?.isAdmin === true;
    if (!isOwner && !isFollower && !isAdmin) {
      return res.status(403).json({ success: false, message: "Account is private" });
    }
  }

  let followersList = user.followers || [];
  if (currentUserId) {
    const { idSet: blockedIdSet } = await getBlockedUserIds(currentUserId);
    followersList = followersList.filter((f) => !blockedIdSet.has((f._id || f).toString()));
  }

  res.status(200).json({ success: true, followers: followersList });
});

const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    "following",
    "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount",
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentUserId = req.user?._id || req.user?.id;
  if (currentUserId && user._id.toString() !== currentUserId.toString()) {
    const isBlocked = await isBlockedPair(currentUserId, user._id);
    if (isBlocked) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  }

  if (user.privateAccount) {
    const isOwner = currentUserId && user._id.toString() === currentUserId.toString();
    const isFollower = currentUserId && user.followers.some((f) => (f._id || f).toString() === currentUserId.toString());
    const isAdmin = req.user?.isAdmin === true;
    if (!isOwner && !isFollower && !isAdmin) {
      return res.status(403).json({ success: false, message: "Account is private" });
    }
  }

  let followingList = user.following || [];
  if (currentUserId) {
    const { idSet: blockedIdSet } = await getBlockedUserIds(currentUserId);
    followingList = followingList.filter((f) => !blockedIdSet.has((f._id || f).toString()));
  }

  res.status(200).json({ success: true, following: followingList });
});

const getBlockedUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id || req.user.id;
  const user = await User.findById(currentUserId).select("blockedUsers").lean();

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const blockDocs = await Block.find({ blocker: currentUserId }).select("blocked").lean();
  const blockedIdSet = new Set();

  if (Array.isArray(user.blockedUsers)) {
    user.blockedUsers.forEach((id) => {
      const idStr = (id._id || id)?.toString();
      if (idStr) blockedIdSet.add(idStr);
    });
  }

  if (Array.isArray(blockDocs)) {
    blockDocs.forEach((b) => {
      const idStr = b.blocked?.toString();
      if (idStr) blockedIdSet.add(idStr);
    });
  }

  const blockedObjectIds = Array.from(blockedIdSet)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const blockedUsers = await User.find({ _id: { $in: blockedObjectIds } }).select(
    "name username pic img avatar profilePic profilePicture userPic isVerified"
  ).lean();

  res.status(200).json({ success: true, blockedUsers });
});

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

const getPrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const settings = user.privacySettings || {};

  res.status(200).json({
    success: true,
    privacySettings: {
      privateAccount: user.privateAccount,
      allowStoryReplies: settings.allowStoryReplies !== undefined ? settings.allowStoryReplies : true,
      allowTravelGroupInvites: settings.allowTravelGroupInvites !== undefined ? settings.allowTravelGroupInvites : true,
      showOnlineStatus: settings.showOnlineStatus !== undefined ? settings.showOnlineStatus : true,
      connectionRequests: settings.connectionRequests || "everyone",
      journeyInvites: settings.journeyInvites || "everyone",
      whoCanMessage: settings.whoCanMessage || "everyone",
      profileLocationVisibility: settings.profileLocationVisibility || "mates_only"
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
      profileLocationVisibility: "mates_only",
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
    profileLocationVisibility,
  } = req.body;

  if (privateAccount !== undefined) {
    user.privateAccount = privateAccount;
    user.privacySettings.privateAccount = privateAccount;
  }
  if (allowStoryReplies !== undefined)
    user.privacySettings.allowStoryReplies = allowStoryReplies;
  if (allowTravelGroupInvites !== undefined)
    user.privacySettings.allowTravelGroupInvites = allowTravelGroupInvites;
  if (showOnlineStatus !== undefined)
    user.privacySettings.showOnlineStatus = showOnlineStatus;

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
    if (
      ["everyone", "mates_only", "none"].includes(profileLocationVisibility)
    ) {
      user.privacySettings.profileLocationVisibility =
        profileLocationVisibility;
    }
  }

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
  cancelFollowRequest: unfollowUser,
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
  removeFollower,
  getPrivacySettings,
  updatePrivacySettings,
};
