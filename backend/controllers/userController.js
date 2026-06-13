const User = require("../models/User");
const Notification = require("../models/Notification");
const TravelGroup = require("../models/TravelGroup");
const Follow = require("../models/Follow");
const Block = require("../models/Block");
const Report = require("../models/Report");

// @desc    Update a User
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Delete a User
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted");
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Get a User
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name username pic img type isVerified rating")
      .populate("following", "name username pic img type isVerified rating")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Hide email and mobile if current user is not the requested user or admin
    if (req.user && req.user.id !== user._id.toString() && !req.user.isAdmin) {
      delete user.email;
      delete user.mobile;
    }

    const reqUserId = req.user ? (req.user._id || req.user.id) : null;
    let canViewContent = !user.privateAccount;
    if (reqUserId) {
      const isOwner = reqUserId.toString() === user._id.toString();
      const isFollower = user.followers && user.followers.some(f => f._id.toString() === reqUserId.toString());
      const isAdmin = req.user.isAdmin;
      if (isOwner || isFollower || isAdmin) {
        canViewContent = true;
      }
    }
    user.canViewContent = canViewContent;

    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Get all Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Get all Users for search
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { username: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("-password -email -mobile");
  res.send(users);
};

// @desc    Follow a User or Send Follow Request
const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAlreadyFollowing = currentUser.following.some(
      id => id.toString() === targetUserId.toString()
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({ message: "You already follow this traveler" });
    }

    const isAlreadyRequested = targetUser.followRequests && targetUser.followRequests.some(
      id => id.toString() === currentUserId.toString()
    );

    if (isAlreadyRequested) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    if (targetUser.privateAccount) {
      // Add to follow requests
      if (!targetUser.followRequests) targetUser.followRequests = [];
      targetUser.followRequests.push(currentUserId);
      await targetUser.save();

      // Notification for follow request
      await Notification.create({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow_request",
        message: `${currentUser.username || currentUser.name} requested to follow you`
      });

      return res.status(200).json({ success: true, message: "Follow request sent", status: "requested" });
    } else {
      // Instant follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      if (Follow) {
        await Follow.findOneAndUpdate(
          { follower: currentUserId, following: targetUserId },
          { follower: currentUserId, following: targetUserId },
          { upsert: true, new: true }
        );
      }

      await Notification.create({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow",
        message: `${currentUser.username || currentUser.name} started following you`
      });

      return res.status(200).json({ success: true, message: "Successfully followed traveler", status: "following" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow a User or Cancel Follow Request
const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cancel follow request if exists
    if (targetUser.followRequests && targetUser.followRequests.includes(currentUserId)) {
      targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== currentUserId.toString());
      await targetUser.save();
      
      // Remove follow request notification
      await Notification.findOneAndDelete({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow_request"
      });
      
      return res.status(200).json({ success: true, message: "Follow request canceled", status: "none" });
    }

    // Unfollow
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId.toString());
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());

    await currentUser.save();
    await targetUser.save();

    // Delete from Follow collection
    if (Follow) {
      await Follow.deleteOne({ follower: currentUserId, following: targetUserId });
    }
      
    // Remove follow notification
    await Notification.findOneAndDelete({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow"
    });

    res.status(200).json({ success: true, message: "Successfully unfollowed traveler", status: "none" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate a User after trip
const rateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please provide a rating between 1 and 5" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentRating = targetUser.rating || 0;
    const currentReviewsCount = targetUser.reviewsCount || 0;

    const newReviewsCount = currentReviewsCount + 1;
    const newRating = ((currentRating * currentReviewsCount) + Number(rating)) / newReviewsCount;

    targetUser.rating = parseFloat(newRating.toFixed(1));
    targetUser.reviewsCount = newReviewsCount;

    await targetUser.save();
    res.status(200).json({ success: true, rating: targetUser.rating, reviewsCount: targetUser.reviewsCount, message: "Rating submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block a User
const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    currentUser.blockedUsers.push(targetUserId);
    await currentUser.save();

    // Store in Block collection
    await Block.findOneAndUpdate(
      { blocker: currentUserId, blocked: targetUserId },
      { blocker: currentUserId, blocked: targetUserId },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock a User
const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
    await currentUser.save();

    // Delete from Block collection
    await Block.deleteOne({ blocker: currentUserId, blocked: targetUserId });

    res.status(200).json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report a User
const reportUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Please specify a reason for reporting" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    targetUser.reportedBy.push({
      reporterId: currentUserId,
      reason: reason
    });

    await targetUser.save();

    // Store in Report collection
    await Report.create({
      reporter: currentUserId,
      reportedUser: targetUserId,
      targetType: "user",
      reason: reason
    });

    res.status(200).json({ success: true, message: "User reported successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get traveler suggestions for connections
const getTravelerSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const currentUser = await User.findById(currentUserId);
    const followingList = currentUser ? currentUser.following : [];

    // Suggestions: only Traveler-type users, excluding admins and obvious test data.
    const baseSuggestionQuery = {
      isAdmin: { $ne: true },
      $or: [
        { role: { $in: ["Traveler", "traveler"] } },
        { type: { $in: ["Traveler", "traveler"] } }
      ]
    };

    const filterBannedNames = (users) => {
      const banned = /^(test|admin|owner|seed|demo)/i;
      return users.filter(u => !banned.test(u.name || "") && !banned.test(u.username || ""));
    };

    let rawSuggestions = await User.find({
      ...baseSuggestionQuery,
      _id: { $ne: currentUserId, $nin: followingList },
    })
      .select("name username pic img avatar role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio")
      .limit(30)
      .lean();

    let suggestions = filterBannedNames(rawSuggestions).slice(0, 12);

    // If the user already follows everyone in the strict result set, still show
    // active travelers so the home suggestions section has useful content.
    if (suggestions.length === 0) {
      rawSuggestions = await User.find({
        ...baseSuggestionQuery,
        _id: { $ne: currentUserId },
      })
        .select("name username pic img avatar role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio")
        .limit(30)
        .lean();
      
      suggestions = filterBannedNames(rawSuggestions).slice(0, 12);
    }

    // FINAL FALLBACK: If still 0, return ANY user except current user to ensure UI is not empty
    if (suggestions.length === 0) {
      suggestions = await User.find({
        _id: { $ne: currentUserId }
      })
        .select("name username pic img avatar role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio")
        .limit(5)
        .lean();
    }

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report an Item (User, Post, Story, Group)
const reportItem = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { targetId, targetType, reason, reportedUserId } = req.body;

    if (!targetId || !targetType || !reason || !reportedUserId) {
      return res.status(400).json({ message: "targetId, targetType, reportedUserId, and reason are required" });
    }

    // Check for duplicate
    const existingReport = await Report.findOne({
      reporter: currentUserId,
      targetId: targetId,
      targetType: targetType
    });

    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this item" });
    }

    await Report.create({
      reporter: currentUserId,
      reportedUser: reportedUserId,
      targetId: targetId,
      targetType: targetType,
      reason: reason
    });

    res.status(200).json({ success: true, message: "Report submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a Follow Request
const acceptFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id; // user who received request
    const requesterId = req.params.id; // user who sent request

    const currentUser = await User.findById(currentUserId);
    const requesterUser = await User.findById(requesterId);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({ message: "No follow request found from this user" });
    }

    // Remove from followRequests
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId.toString());

    // Add to followers/following
    currentUser.followers.push(requesterId);
    requesterUser.following.push(currentUserId);

    await currentUser.save();
    await requesterUser.save();

    if (Follow) {
      await Follow.findOneAndUpdate(
        { follower: requesterId, following: currentUserId },
        { follower: requesterId, following: currentUserId },
        { upsert: true, new: true }
      );
    }

    // Notification for acceptance
    await Notification.create({
      sender: currentUserId,
      receiver: requesterId,
      type: "follow_accept",
      message: `${currentUser.username || currentUser.name} accepted your follow request`
    });

    // Remove the original follow_request notification
    await Notification.findOneAndDelete({
      sender: requesterId,
      receiver: currentUserId,
      type: "follow_request"
    });

    res.status(200).json({ success: true, message: "Follow request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a Follow Request
const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const requesterId = req.params.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId.toString());
    await currentUser.save();
      
    // Remove the original follow_request notification
    await Notification.findOneAndDelete({
      sender: requesterId,
      receiver: currentUserId,
      type: "follow_request"
    });

    res.status(200).json({ success: true, message: "Follow request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "name username pic img avatar type isVerified rating privateAccount");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Following
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "name username pic img avatar type isVerified rating privateAccount");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, following: user.following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlockedUsers = async (req, res) => { res.status(200).json([]); };
const searchUsers = async (req, res) => { res.status(200).json([]); };
const getProfileStats = async (req, res) => { res.status(200).json({}); };
const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ 
      success: true, 
      privacySettings: user.privacySettings || {
        privateAccount: user.privateAccount,
        allowStoryReplies: true,
        allowTravelGroupInvites: true,
        showOnlineStatus: true
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.privacySettings) {
      user.privacySettings = {
        privateAccount: user.privateAccount,
        allowStoryReplies: true,
        allowTravelGroupInvites: true,
        showOnlineStatus: true
      };
    }

    const updates = req.body;
    
    if (updates.privateAccount !== undefined) {
      user.privateAccount = updates.privateAccount;
      user.privacySettings.privateAccount = updates.privateAccount;
    }

    if (updates.allowStoryReplies !== undefined) user.privacySettings.allowStoryReplies = updates.allowStoryReplies;
    if (updates.allowTravelGroupInvites !== undefined) user.privacySettings.allowTravelGroupInvites = updates.allowTravelGroupInvites;
    if (updates.showOnlineStatus !== undefined) user.privacySettings.showOnlineStatus = updates.showOnlineStatus;

    await user.save();

    res.status(200).json({ success: true, message: "Privacy settings updated", privacySettings: user.privacySettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  allUsers,
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
