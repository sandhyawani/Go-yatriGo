const User = require("../models/User");
const Notification = require("../models/Notification");
const TravelGroup = require("../models/TravelGroup");
const Follow = require("../models/Follow");
const Block = require("../models/Block");
const Report = require("../models/Report");

// Update user profile
const updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const newPic = updateData.img || updateData.pic || updateData.avatar || updateData.profilePic;
    if (newPic && typeof newPic === "string" && !newPic.includes("no-image-icon")) {
      updateData.img = newPic;
      updateData.pic = newPic;
      updateData.avatar = newPic;
    }

    // Reset verification when a new government ID is uploaded
    if (updateData.govId) {
      updateData.verificationStatus = "pending";
      updateData.verificationNote = "";
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      ...userObj,
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate(
        "followers",
        "name username pic img avatar profilePic profilePicture userPic type isVerified rating"
      )
      .populate(
        "following",
        "name username pic img avatar profilePic profilePicture userPic type isVerified rating"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserId = req.user?._id || req.user?.id;
    const isOwner = currentUserId && currentUserId.toString() === user._id.toString();

    // Hide private information from other users or unauthenticated visitors
    if (!isOwner && !req.user?.isAdmin) {
      delete user.email;
      delete user.mobile;
    }

    // Check whether the current user can view private content
    let canViewContent = !user.privateAccount;

    const isFollower =
      currentUserId &&
      (user.followers?.some(
        (follower) =>
          (follower._id || follower).toString() === currentUserId.toString()
      ) || false);

    if (isOwner || isFollower || req.user?.isAdmin) {
      canViewContent = true;
    }

    user.canViewContent = canViewContent;

    res.status(200).json({
      success: true,
      ...user,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search users
const allUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { username: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    }).select("-password -email -mobile");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Follow a user or send a follow request
const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (isFollowing) {
      return res.status(400).json({
        success: false,
        message: "You already follow this traveler",
      });
    }

    const requestSent =
      targetUser.followRequests?.some(
        (id) => id.toString() === currentUserId.toString()
      ) || false;

    if (requestSent) {
      return res.status(400).json({
        success: false,
        message: "Follow request already sent",
      });
    }

    // Send follow request for private accounts
    if (targetUser.privateAccount) {
      targetUser.followRequests ??= [];
      targetUser.followRequests.push(currentUserId);
      await targetUser.save();

      await Notification.create({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow_request",
        message: `${
          currentUser.username || currentUser.name
        } requested to follow you`,
      });

      return res.status(200).json({
        success: true,
        status: "requested",
        message: "Follow request sent successfully",
      });
    }

    // Follow public account
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
    ]);

    if (Follow) {
      await Follow.findOneAndUpdate(
        {
          follower: currentUserId,
          following: targetUserId,
        },
        {
          follower: currentUserId,
          following: targetUserId,
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    await Notification.create({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow",
      message: `${
        currentUser.username || currentUser.name
      } started following you`,
    });

    res.status(200).json({
      success: true,
      status: "following",
      message: "Successfully followed traveler",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Unfollow a user or cancel a follow request
const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cancel pending follow request
    const hasPendingRequest =
      targetUser.followRequests?.some(
        (id) => id.toString() === currentUserId.toString()
      ) || false;

    if (hasPendingRequest) {
      targetUser.followRequests = targetUser.followRequests.filter(
        (id) => id.toString() !== currentUserId.toString()
      );

      await targetUser.save();

      await Notification.findOneAndDelete({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow_request",
      });

      return res.status(200).json({
        success: true,
        status: "none",
        message: "Follow request cancelled successfully",
      });
    }

    // Remove user from followers and following lists
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
    ]);

    // Remove follow record
    if (Follow) {
      await Follow.deleteOne({
        follower: currentUserId,
        following: targetUserId,
      });
    }

    // Remove follow notification
    await Notification.findOneAndDelete({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow",
    });

    res.status(200).json({
      success: true,
      status: "none",
      message: "Successfully unfollowed traveler",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Rate a traveler after completing a trip
const rateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { rating } = req.body;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentRating = targetUser.rating || 0;
    const currentReviews = targetUser.reviewsCount || 0;

    // Calculate new average rating
    const totalReviews = currentReviews + 1;
    const averageRating =
      (currentRating * currentReviews + Number(rating)) / totalReviews;

    targetUser.rating = Number(averageRating.toFixed(1));
    targetUser.reviewsCount = totalReviews;

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      rating: targetUser.rating,
      reviewsCount: targetUser.reviewsCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Block a user
const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isBlocked = currentUser.blockedUsers.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (isBlocked) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    currentUser.blockedUsers.push(targetUserId);
    await currentUser.save();

    // Save block record
    await Block.findOneAndUpdate(
      {
        blocker: currentUserId,
        blocked: targetUserId,
      },
      {
        blocker: currentUserId,
        blocked: targetUserId,
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    await currentUser.save();

    // Remove block record
    await Block.deleteOne({
      blocker: currentUserId,
      blocked: targetUserId,
    });

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Report a user
const reportUser = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const targetUserId = req.params.id;
    const { reason } = req.body;

    // Validate report reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for reporting",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    targetUser.reportedBy.push({
      reporterId: currentUserId,
      reason,
    });

    await targetUser.save();

    // Save report for admin review
    await Report.create({
      reporter: currentUserId,
      reportedUser: targetUserId,
      targetType: "user",
      reason,
    });

    res.status(200).json({
      success: true,
      message: "User reported successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get traveler suggestions
const getTravelerSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const currentUser = await User.findById(currentUserId).select("following");

    const followingList = currentUser?.following || [];

    // Base query for traveler suggestions
    const suggestionQuery = {
      isAdmin: { $ne: true },
      $or: [
        { role: { $in: ["Traveler", "traveler"] } },
        { type: { $in: ["Traveler", "traveler"] } },
      ],
    };

    // Remove demo and test accounts
    const filterUsers = (users) => {
      const bannedNames = /^(test|admin|owner|seed|demo)/i;

      return users.filter(
        (user) =>
          !bannedNames.test(user.name || "") &&
          !bannedNames.test(user.username || "")
      );
    };

    let suggestions = await User.find({
      ...suggestionQuery,
      _id: {
        $ne: currentUserId,
        $nin: followingList,
      },
    })
      .select(
        "name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio"
      )
      .limit(30)
      .lean();

    suggestions = filterUsers(suggestions).slice(0, 12);

    // Fallback if all travelers are already followed
    if (suggestions.length === 0) {
      suggestions = await User.find({
        ...suggestionQuery,
        _id: { $ne: currentUserId },
      })
        .select(
          "name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio"
        )
        .limit(30)
        .lean();

      suggestions = filterUsers(suggestions).slice(0, 12);
    }

    // Final fallback to avoid an empty UI
    if (suggestions.length === 0) {
      suggestions = await User.find({
        _id: { $ne: currentUserId },
      })
        .select(
          "name username pic img avatar profilePic profilePicture userPic role type isVerified rating completedTrips interests followers following followRequests privateAccount city bio"
        )
        .limit(5)
        .lean();
    }

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Report a user, post, story, or travel group
const reportItem = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const {
      targetId,
      targetType,
      reportedUserId,
      reason,
    } = req.body;

    // Validate required fields
    if (!targetId || !targetType || !reportedUserId || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "targetId, targetType, reportedUserId and reason are required",
      });
    }

    // Prevent duplicate reports
    const existingReport = await Report.findOne({
      reporter: currentUserId,
      targetId,
      targetType,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this item",
      });
    }

    await Report.create({
      reporter: currentUserId,
      reportedUser: reportedUserId,
      targetId,
      targetType,
      reason,
    });

    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Accept a follow request
const acceptFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const requesterId = req.params.id;

    const [currentUser, requesterUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(requesterId),
    ]);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hasRequest = currentUser.followRequests.some(
      (id) => id.toString() === requesterId.toString()
    );

    if (!hasRequest) {
      return res.status(400).json({
        success: false,
        message: "No follow request found",
      });
    }

    // Remove follow request
    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => id.toString() !== requesterId.toString()
    );

    // Add follower relationship
    currentUser.followers.push(requesterId);
    requesterUser.following.push(currentUserId);

    await Promise.all([
      currentUser.save(),
      requesterUser.save(),
    ]);

    // Save follow relationship
    if (Follow) {
      await Follow.findOneAndUpdate(
        {
          follower: requesterId,
          following: currentUserId,
        },
        {
          follower: requesterId,
          following: currentUserId,
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    // Notify requester
    await Notification.create({
      sender: currentUserId,
      receiver: requesterId,
      type: "follow_accept",
      message: `${
        currentUser.username || currentUser.name
      } accepted your follow request`,
    });

    // Remove pending notification
    await Notification.findOneAndDelete({
      sender: requesterId,
      receiver: currentUserId,
      type: "follow_request",
    });

    res.status(200).json({
      success: true,
      message: "Follow request accepted successfully",
      followersCount: currentUser.followers.length,
      followingCount: currentUser.following.length,
      requesterFollowingCount: requesterUser.following.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject a follow request
const rejectFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const requesterId = req.params.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => id.toString() !== requesterId.toString()
    );

    await currentUser.save();

    // Remove pending notification
    await Notification.findOneAndDelete({
      sender: requesterId,
      receiver: currentUserId,
      type: "follow_request",
    });

    res.status(200).json({
      success: true,
      message: "Follow request rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      followers: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get following list
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "name username pic img avatar profilePic profilePicture userPic type isVerified rating privateAccount"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get blocked users
const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).populate(
      "blockedUsers",
      "name username pic img avatar profilePic profilePicture userPic isVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search || req.query.q || "";

    const users = await User.find({
      _id: { $ne: req.user._id || req.user.id },
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { username: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password -email -mobile");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get profile statistics
const getProfileStats = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id || req.user.id;

    const [posts, trips, followers, following] = await Promise.all([
      require("../models/Post").countDocuments({ userId }),
      TravelGroup.countDocuments({ host: userId }),
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        posts,
        trips,
        followers,
        following,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get privacy settings
const getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      privacySettings:
        user.privacySettings || {
          privateAccount: user.privateAccount,
          allowStoryReplies: true,
          allowTravelGroupInvites: true,
          showOnlineStatus: true,
        },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.privacySettings) {
      user.privacySettings = {
        privateAccount: user.privateAccount,
        allowStoryReplies: true,
        allowTravelGroupInvites: true,
        showOnlineStatus: true,
      };
    }

    const {
      privateAccount,
      allowStoryReplies,
      allowTravelGroupInvites,
      showOnlineStatus,
    } = req.body;

    if (privateAccount !== undefined) {
      user.privateAccount = privateAccount;
      user.privacySettings.privateAccount = privateAccount;
    }

    if (allowStoryReplies !== undefined) {
      user.privacySettings.allowStoryReplies = allowStoryReplies;
    }

    if (allowTravelGroupInvites !== undefined) {
      user.privacySettings.allowTravelGroupInvites =
        allowTravelGroupInvites;
    }

    if (showOnlineStatus !== undefined) {
      user.privacySettings.showOnlineStatus = showOnlineStatus;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
  updatePrivacySettings,
};