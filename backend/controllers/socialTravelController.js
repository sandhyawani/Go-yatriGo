const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");
const Story = require("../models/Story");
const TravelGroup = require("../models/TravelGroup");
const JoinRequest = require("../models/JoinRequest");
const Notification = require("../models/Notification");
const Report = require("../models/Report");
const Block = require("../models/Block");
const ChatRoom = require("../models/ChatRoom");
const Journey = require("../models/Journey");
const JourneyGallery = require("../models/JourneyGallery");
const JourneyTimeline = require("../models/JourneyTimeline");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Create a new travel group
exports.createTravelBuddyTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      startDate,
      endDate,
      maxMembers,
      maxCompanions,
      description,
      coverImage,
      category,
      from,
      isPrivate,
      tags,
      budget,
    } = req.body;

    const userId = req.user._id || req.user.id;

    // Support both maxMembers and maxCompanions from frontend
    const totalMembers = maxMembers || maxCompanions;

    const missingFields = [];

    if (!title?.trim()) missingFields.push("title");
    if (!destination?.trim()) missingFields.push("destination");
    if (!startDate) missingFields.push("startDate");
    if (!endDate) missingFields.push("endDate");
    if (!description?.trim()) missingFields.push("description");
    if (!totalMembers) missingFields.push("maxMembers");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const group = new TravelGroup({
      host: userId,
      title,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxMembers: Number(totalMembers),
      description,
      coverImage: coverImage || "",
      category: category || "Adventure",
      from: from || "",
      isPrivate: isPrivate || false,
      tags: tags || [],
      budget: Number(budget) || 0,
      members: [
        {
          user: userId,
          role: "host",
        },
      ],
    });

    await group.save();

    // Create a group chat automatically for trip members
    const chatRoom = new ChatRoom({
      name: `${title} - Group Chat`,
      type: "group",
      members: [userId],
      travelGroupId: group._id,
    });

    await chatRoom.save();

    res.status(201).json({
      success: true,
      message: "Travel group created successfully",
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get explore page statistics and category information
exports.getExploreMetadata = async (req, res) => {
  try {
    const now = new Date();
    const archiveDate = new Date(Date.now() - THIRTY_DAYS_MS);

    const categoriesData = await TravelGroup.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          endDate: { $gte: archiveDate },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const categories = categoriesData.map((item) => ({
      name: item._id || "Other",
      count: item.count,
    }));

    const totalGroups = await TravelGroup.countDocuments({
      endDate: { $gte: archiveDate },
    });

    const upcomingGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      startDate: { $gt: now },
    });

    const activeGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const completedGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      endDate: { $lt: now, $gte: archiveDate },
    });

    const cancelledGroups = await TravelGroup.countDocuments({
      status: "cancelled",
      endDate: { $gte: archiveDate },
    });

    // Count travelers active in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeTravelers = await User.countDocuments({
      updatedAt: { $gte: thirtyMinutesAgo },
    });

    res.status(200).json({
      success: true,
      categories,
      counts: {
        total: totalGroups,
        upcoming: upcomingGroups,
        active: activeGroups,
        completed: completedGroups,
        cancelled: cancelledGroups,
      },
      onlineTravelers: activeTravelers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all travel groups
exports.getAllTravelBuddyTrips = async (req, res) => {
  try {
    const {
      destination,
      category,
      lifecycleStatus,
      sortBy,
      userId,
    } = req.query;

    let query = {};

    const currentUserId = req.user._id || req.user.id;
    const currentUser = await User.findById(currentUserId);
    const followingList = currentUser ? currentUser.following : [];

    let privateUsersNotFollowed = [];

    // Hide private accounts unless the current user follows them
    if (!req.user || !req.user.isAdmin) {
      const privateUsers = await User.find({
        privateAccount: true,
      }).distinct("_id");

      privateUsersNotFollowed = privateUsers.filter(
        (id) =>
          id.toString() !== currentUserId.toString() &&
          !followingList.some(
            (f) => f.toString() === id.toString()
          )
      );
    }

    const baseCondition = {
      $or: [
        { host: { $nin: privateUsersNotFollowed } },
        { "members.user": currentUserId },
      ],
    };

    if (userId) {
      const targetUser = await User.findById(userId)
        .lean()
        .select("privateAccount followers");

      if (
        targetUser &&
        targetUser.privateAccount &&
        currentUserId.toString() !== userId.toString()
      ) {
        const isFollower =
          targetUser.followers &&
          targetUser.followers.some(
            (f) => f.toString() === currentUserId.toString()
          );

        if (!isFollower && (!req.user || !req.user.isAdmin)) {
          return res.status(200).json({
            success: true,
            trips: [],
            pagination: {
              total: 0,
              page: 1,
              limit: parseInt(req.query.limit) || 10,
              hasMore: false,
            },
          });
        }
      }

      query.$and = [
        baseCondition,
        {
          $or: [
            { host: userId },
            { "members.user": userId },
          ],
        },
      ];
    } else {
      const archiveDate = new Date(Date.now() - THIRTY_DAYS_MS);
      query.$and = [
        baseCondition,
        { endDate: { $gte: archiveDate } }
      ];
    }

    if (destination) {
      query.destination = new RegExp(destination, "i");
    }

    if (category && category !== "All") {
      query.category = new RegExp(category, "i");
    }

    // Filter trips based on lifecycle status
    const now = new Date();

    if (lifecycleStatus && lifecycleStatus !== "All") {
      if ((lifecycleStatus || "").toLowerCase() === "cancelled") {
        query.status = "cancelled";
      } else {
        query.status = { $ne: "cancelled" };

        if ((lifecycleStatus || "").toLowerCase() === "upcoming") {
          query.startDate = { $gt: now };
        } else if (
          (lifecycleStatus || "").toLowerCase() === "active now" ||
          (lifecycleStatus || "").toLowerCase() === "active"
        ) {
          query.startDate = { $lte: now };
          query.endDate = { $gte: now };
        } else if (
          (lifecycleStatus || "").toLowerCase() === "completed"
        ) {
          query.endDate = { $lt: now };
        }
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allMatchingGroups = await TravelGroup.find(query)
      .populate(
        "host",
        "name username pic img isVerified rating completedTrips"
      )
      .populate("members.user", "name username pic img");

    const nowSort = new Date();
    const nowTime = nowSort.getTime();

    allMatchingGroups.sort((a, b) => {
      const startA = new Date(a.startDate).getTime();
      const startB = new Date(b.startDate).getTime();
      const endA = new Date(a.endDate).getTime();
      const endB = new Date(b.endDate).getTime();

      const getLifecycleTier = (group, start, end) => {
        if (group.status === "cancelled") return 4;
        if (start <= nowTime && end >= nowTime) return 1; // Active
        if (start > nowTime) return 2; // Upcoming
        return 3; // Completed
      };

      if (!sortBy || sortBy === "Starting Soon") {
        const tierA = getLifecycleTier(a, startA, endA);
        const tierB = getLifecycleTier(b, startB, endB);
        if (tierA !== tierB) return tierA - tierB;
        if (tierA === 3) return endB - endA; // Completed: most recent first
        return startA - startB; // Active or Upcoming: nearest start date first
      }

      if (sortBy === "Trending") {
        const getTrendingScore = (g) => {
          const memberCount = (g.members?.length || 0) * 4;
          const likesCount = (g.likes?.length || 0) * 3;
          const activityCount = (g.activityLogs?.length || 0) * 2;
          const lastActivity = g.lastActivityAt ? new Date(g.lastActivityAt).getTime() : new Date(g.updatedAt || g.createdAt).getTime();
          const hoursSinceActivity = Math.max(1, (nowTime - lastActivity) / (1000 * 60 * 60));
          const bonus = Math.max(0, 100 - hoursSinceActivity);
          return memberCount + likesCount + activityCount + bonus;
        };
        const diff = getTrendingScore(b) - getTrendingScore(a);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "Popular" || sortBy === "Most Popular" || sortBy === "Most Travelers") {
        const diff = (b.members?.length || 0) - (a.members?.length || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "Highest Rated") {
        const rateA = a.host?.rating || 0;
        const rateB = b.host?.rating || 0;
        if (rateB !== rateA) return rateB - rateA;
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }

      // Default fallback / Newest / Newly Created / Recently Active
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = allMatchingGroups.length;
    const groups = allMatchingGroups.slice(skip, skip + limit);

    const groupIds = groups.map((group) => group._id);

    const allRequests = await JoinRequest.find({
      groupId: { $in: groupIds },
    });

    // Format data for frontend compatibility
    const trips = groups.map((group) => {
      const trip = group.toObject();

      trip.userId = trip.host;

      const members = trip.members || [];

      trip.companions = members.map(
        (member) => member.user || member
      );

      trip.maxCompanions = trip.maxMembers;

      trip.joinRequests = allRequests.filter(
        (request) =>
          request?.groupId?.toString() === trip?._id?.toString()
      );

      return trip;
    });

    res.status(200).json({
      success: true,
      trips,
      pagination: {
        total,
        page,
        limit,
        hasMore: total > skip + groups.length,
      },
    });
  } catch (error) {
    console.error("GET ALL TRIPS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get liked travel groups
exports.getLikedBuddyTrips = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const groups = await TravelGroup.find({
      likes: currentUserId,
    })
      .populate(
        "host",
        "name username pic img isVerified rating completedTrips"
      )
      .populate("members.user", "name username pic img")
      .sort({ createdAt: -1 });

    const groupIds = groups.map((group) => group._id);

    const allRequests = await JoinRequest.find({
      groupId: { $in: groupIds },
    });

    // Format data for frontend compatibility
    const trips = groups.map((group) => {
      const trip = group.toObject();

      trip.userId = trip.host;

      const members = trip.members || [];

      trip.companions = members.map(
        (member) => member.user || member
      );

      trip.maxCompanions = trip.maxMembers;

      trip.joinRequests = allRequests.filter(
        (request) =>
          request?.groupId?.toString() === trip?._id?.toString()
      );

      return trip;
    });

    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("GET LIKED TRIPS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's felt vibes collection
exports.getFeltVibesCollection = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    // Format liked memory posts
    const posts = await Post.find({
      likes: currentUserId,
    })
      .populate("userId", "name username pic img isVerified")
      .lean();

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      type: "memory",
      postType: post.postType || "travel_memory",
      mediaUrl: post.mediaUrl || post.image,
      mediaType: post.mediaType || "image",
      author: post.userId,
      location: post.location || "",
      caption: post.caption || "",
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      createdAt: post.createdAt,
    }));

    // Format reacted stories
    const stories = await Story.find({
      "storyReactions.userId": currentUserId,
    })
      .populate("userId", "name username pic img isVerified")
      .lean();

    const formattedStories = stories.map((story) => {
      const userReaction = story.storyReactions?.find(
        (reaction) =>
          reaction.userId?.toString() === currentUserId.toString()
      );

      return {
        _id: story._id,
        type: "story",
        postType: "story",
        mediaUrl: story.media,
        mediaType: story.mediaType || "image",
        author:
          story.userId || {
            name: story.userName,
            pic: story.userPic,
          },
        location: "",
        caption: story.caption || "",
        likesCount: story.storyReactions
          ? story.storyReactions.length
          : 0,
        commentsCount: story.comments
          ? story.comments.length
          : 0,
        createdAt: userReaction
          ? userReaction.reactedAt
          : story.createdAt,
      };
    });

    // Format liked travel groups
    const groups = await TravelGroup.find({
      likes: currentUserId,
    })
      .populate(
        "host",
        "name username pic img isVerified rating"
      )
      .lean();

    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      type: "group",
      postType: "group",
      mediaUrl: group.coverImage,
      mediaType: "image",
      author: group.host,
      location: `${group.from ? group.from + " → " : ""}${
        group.destination
      }`,
      caption: group.title || "",
      likesCount: group.likes ? group.likes.length : 0,
      commentsCount: 0,
      createdAt: group.createdAt,
      extra: {
        startDate: group.startDate,
        endDate: group.endDate,
        status: group.lifecycleStatus,
        slotsOpen: Math.max(
          0,
          group.maxMembers -
            (group.members ? group.members.length : 0)
        ),
      },
    }));

    let allFeltVibes = [
      ...formattedPosts,
      ...formattedStories,
      ...formattedGroups,
    ];

    // Sort content by type and date
    const sortPriority = {
      travel_memory: 1,
      travel_photo: 1,
      travel_video: 1,
      memory: 1,
      story: 2,
      group: 3,
      document: 4,
      profile_update: 5,
      general: 6,
    };

    allFeltVibes.sort((a, b) => {
      const priorityA = sortPriority[a.postType] || 6;
      const priorityB = sortPriority[b.postType] || 6;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({
      success: true,
      feltVibes: allFeltVibes,
    });
  } catch (error) {
    console.error("GET FELT VIBES ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Like or unlike a travel group
exports.toggleLikeBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Travel group not found",
      });
    }

    const likeIndex = group.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let isLiked = false;

    if (likeIndex === -1) {
      group.likes.push(userId);
      isLiked = true;
    } else {
      group.likes.splice(likeIndex, 1);
    }

    await group.save();

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: group.likes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get complete details of a travel group
exports.getTravelBuddyTripById = async (req, res) => {
  try {
    const group = await TravelGroup.findById(req.params.id)
      .populate(
        "host",
        "name username pic img isVerified rating completedTrips interests bio"
      )
      .populate(
        "members.user",
        "name username pic img interests completedTrips rating"
      );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Travel group not found",
      });
    }

    const requests = await JoinRequest.find({
      groupId: group._id,
    }).populate(
      "userId",
      "name username pic img rating completedTrips"
    );

    const groupObj = group.toObject();

    // Support old member data format
    let processedMembers = groupObj.members || [];

    if (
      processedMembers.length > 0 &&
      !processedMembers[0].user &&
      processedMembers[0]._id === undefined
    ) {
      const users = await User.find({
        _id: { $in: processedMembers },
      })
        .select(
          "name username pic img avatar profilePic profilePicture userPic interests completedTrips rating"
        )
        .lean();

      processedMembers = users.map((user) => ({
        user,
        role:
          group.host &&
          group.host._id &&
          user._id.toString() === group.host._id.toString()
            ? "host"
            : "member",
        joinedAt: group.createdAt,
      }));
    }

    // Ensure host is present in members list
    if (group.host) {
      const hostExists = processedMembers.some(
        (member) =>
          member.user &&
          member.user._id &&
          member.user._id.toString() === group.host._id.toString()
      );

      if (!hostExists) {
        processedMembers.unshift({
          user: group.host,
          role: "host",
          joinedAt: group.createdAt,
        });
      }
    }

    groupObj.members = processedMembers;

    const hostId =
      group.host && group.host._id
        ? group.host._id.toString()
        : null;

    groupObj.companions = processedMembers
      .map((member) => member.user)
      .filter(
        (user) =>
          user &&
          user._id &&
          user._id.toString() !== hostId
      );

    groupObj.joinRequests = requests.map((request) => ({
      _id: request._id,
      userId: request.userId,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
    }));

    groupObj.userId = group.host;

    res.status(200).json({
      success: true,
      trip: groupObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Send a request to join a travel group
exports.requestToJoinTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { message } = req.body;

    const group = await TravelGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Travel group not found",
      });
    }

    // Support old member data format
    if (
      group.members &&
      group.members.length > 0 &&
      !group.members[0].user &&
      group.members[0]._id === undefined
    ) {
      group.members = group.members.map((memberId) => ({
        user: memberId,
        role:
          memberId.toString() === group.host.toString()
            ? "host"
            : "member",
        joinedAt: group.createdAt || new Date(),
      }));
    }

    if (group.host.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are the host of this group",
      });
    }

    if (
      group.members.some(
        (member) =>
          member.user &&
          member.user.toString() === userId.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Directly join public groups
    if (!group.isPrivate) {
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: "This travel group is already full",
        });
      }

      group.members.push({
        user: userId,
        role: "member",
      });

      if (group.members.length >= group.maxMembers) {
        group.status = "full";
      }

      await group.save();

      await ChatRoom.findOneAndUpdate(
        { travelGroupId: group._id },
        { 
          $addToSet: { members: userId },
          $pull: { hiddenFor: userId }
        }
      );

      const senderUser = await User.findById(userId);

      await Notification.create({
        sender: userId,
        receiver: group.host,
        type: "group_joined",
        group: group._id,
        message: `${senderUser.name} joined your travel group "${group.title}".`,
      });

      return res.status(200).json({
        success: true,
        message: "Successfully joined the travel group",
        group,
      });
    }

    let requestObj = await JoinRequest.findOne({
      groupId,
      userId,
    });

    if (requestObj) {
      if (requestObj.status === "Pending") {
        return res.status(400).json({
          success: false,
          message: "You already have a pending join request",
        });
      }

      requestObj.status = "Pending";
      requestObj.message = message || "";

      await requestObj.save();
    } else {
      requestObj = new JoinRequest({
        groupId,
        userId,
        message: message || "",
        status: "Pending",
      });

      await requestObj.save();
    }

    const senderUser = await User.findById(userId);

    await Notification.create({
      sender: userId,
      receiver: group.host,
      type: "join_request",
      group: group._id,
      joinRequest: requestObj._id,
      message: `${senderUser.name} requested to join your travel group "${group.title}".`,
    });

    res.status(200).json({
      success: true,
      message: "Join request submitted successfully",
      request: requestObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Approve or reject a travel group join request
exports.manageJoinRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const hostId = req.user._id || req.user.id;

    if (!requestId || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid request ID and status required",
      });
    }

    const requestObj = await JoinRequest.findById(requestId);

    if (!requestObj) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const group = await TravelGroup.findById(requestObj.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Support old member data format
    if (
      group.members &&
      group.members.length > 0 &&
      !group.members[0].user &&
      group.members[0]._id === undefined
    ) {
      group.members = group.members.map((memberId) => ({
        user: memberId,
        role:
          memberId.toString() === group.host.toString()
            ? "host"
            : "member",
        joinedAt: group.createdAt || new Date(),
      }));
    }

    if (group.host.toString() !== hostId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can manage join requests",
      });
    }

    requestObj.status = status;
    await requestObj.save();

    if (status === "Approved") {
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: "This travel group is already full",
        });
      }

      if (
        !group.members.some(
          (member) =>
            member.user &&
            member.user.toString() === requestObj.userId.toString()
        )
      ) {
        group.members.push({
          user: requestObj.userId,
          role: "member",
        });

        if (group.members.length >= group.maxMembers) {
          group.status = "full";
        }

        await group.save();

        // Add approved member to group chat
        await ChatRoom.findOneAndUpdate(
          { travelGroupId: group._id },
          { 
            $addToSet: { members: requestObj.userId },
            $pull: { hiddenFor: requestObj.userId }
          }
        );
      }
    }

    await Notification.create({
      sender: hostId,
      receiver: requestObj.userId,
      type:
        status === "Approved"
          ? "request_approved"
          : "request_rejected",
      group: group._id,
      message: `Your request to join "${group.title}" was ${status.toLowerCase()}.`,
    });

    await Notification.findOneAndDelete({
      receiver: hostId,
      type: "join_request",
      joinRequest: requestObj._id,
    });

    res.status(200).json({
      success: true,
      message: `Request successfully ${status.toLowerCase()}`,
      request: requestObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Leave a travel group
exports.leaveTravelBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Travel group not found",
      });
    }

    // Support old member data format
    if (
      group.members &&
      group.members.length > 0 &&
      !group.members[0].user &&
      group.members[0]._id === undefined
    ) {
      group.members = group.members.map((memberId) => ({
        user: memberId,
        role:
          memberId.toString() === group.host.toString()
            ? "host"
            : "member",
        joinedAt: group.createdAt || new Date(),
      }));
    }

    if (group.host.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "Hosts cannot leave their own group. Please complete or cancel the trip.",
      });
    }

    group.members = group.members.filter(
      (member) =>
        member.user &&
        member.user.toString() !== userId.toString()
    );

    if (
      group.status === "full" &&
      group.members.length < group.maxMembers
    ) {
      group.status = "open";
    }

    if (!group.activityLogs) {
      group.activityLogs = [];
    }

    group.activityLogs.push({
      action: "Left the group",
      user: userId,
      performedBy: userId,
    });

    await group.save();

    // Remove member from group chat
    await ChatRoom.findOneAndUpdate(
      { travelGroupId: group._id },
      { $pull: { members: userId } }
    );

    await JoinRequest.deleteOne({
      groupId,
      userId,
    });

    const leavingUser = await User.findById(userId);

    if (Notification && leavingUser) {
      await Notification.create({
        sender: userId,
        receiver: group.host,
        type: "group_left",
        group: group._id,
        message: `${leavingUser.name} left your travel group "${group.title}".`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Left travel group successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a travel group
exports.deleteTravelBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const reqUserId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Travel group not found",
      });
    }

    // Support old member data format
    if (
      group.members &&
      group.members.length > 0 &&
      !group.members[0].user &&
      group.members[0]._id === undefined
    ) {
      group.members = group.members.map((memberId) => ({
        user: memberId,
        role:
          memberId.toString() === group.host.toString()
            ? "host"
            : "member",
        joinedAt: group.createdAt || new Date(),
      }));
    }

    if (
      group.host.toString() !== reqUserId.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the host can delete this group",
      });
    }

    await TravelGroup.findByIdAndDelete(groupId);

    // Remove related chat room and join requests
    await ChatRoom.findOneAndDelete({
      travelGroupId: groupId,
    });

    await JoinRequest.deleteMany({
      groupId,
    });

    res.status(200).json({
      success: true,
      message: "Travel group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Create a travel memory post
exports.createMemory = async (req, res) => {
  try {
    const {
      caption,
      location,
      image,
      mediaUrl,
      mediaUrls,
      mediaType,
      tags,
      title,
      music,
      taggedUsers,
      disableComments,
      hideLikes,
      journeyId,
    } = req.body;

    const userId = req.user._id || req.user.id;

    if (
      !caption ||
      (!image &&
        !mediaUrl &&
        (!mediaUrls || mediaUrls.length === 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Caption and Media are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const finalMediaUrl = mediaUrl || image;
    const finalMediaType = mediaType || "image";

    const post = new Post({
      userId,
      userName: user.name,
      userPic: user.pic,
      title: title || "",
      caption,
      location: location || "",
      tags: tags || [],
      image: finalMediaUrl,
      mediaUrl: finalMediaUrl,
      mediaUrls: mediaUrls || [],
      mediaType: finalMediaType,
      music: music || undefined,
      taggedUsers: taggedUsers || [],
      journeyId: journeyId || null,
      disableComments: disableComments || false,
      hideLikes: hideLikes || false,
      likes: [],
      comments: [],
    });

    await post.save();

    if (journeyId && finalMediaUrl) {
      try {
        await JourneyGallery.create({
          journeyId,
          uploaderId: userId,
          uploaderName: user.name,
          uploaderPic: user.pic,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType === "video" ? "video" : "image",
          itemType: "post",
          referenceId: post._id,
          caption,
        });

        await JourneyTimeline.create({
          journeyId,
          userId,
          userName: user.name,
          userPic: user.pic,
          eventType: "post_shared",
          title: "Memory Shared",
          description: caption.substring(0, 100),
          mediaUrl: finalMediaUrl,
          referenceId: post._id,
        });

        await Journey.findByIdAndUpdate(journeyId, { $inc: { "stats.postsCount": 1 } });
      } catch (err) {
        console.error("Error linking post to journey:", err);
      }
    }

    res.status(201).json({
      success: true,
      message: "Travel post created successfully",
      post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Get travel memories feed
exports.getAllMemories = async (req, res) => {
  try {
    const authUserId = req.user._id || req.user.id;
    const { userId: filterUserId, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * parseInt(limit);

    const user = await User.findById(authUserId)
      .lean()
      .select("following blockedUsers");

    let query = {};

    // Show a specific user's posts if requested
    if (filterUserId) {
      const targetUser = await User.findById(filterUserId)
        .lean()
        .select("privateAccount followers");

      if (
        targetUser &&
        targetUser.privateAccount &&
        authUserId.toString() !== filterUserId.toString()
      ) {
        const isFollower =
          targetUser.followers &&
          targetUser.followers.some(
            (f) => f.toString() === authUserId.toString()
          );

        if (!isFollower && (!req.user || !req.user.isAdmin)) {
          return res.status(200).json({
            success: true,
            memories: [],
          });
        }
      }

      query.userId = filterUserId;
    } else {
      const followingList =
        user && user.following ? user.following : [];
      const blockedList =
        user && user.blockedUsers ? user.blockedUsers : [];

      const personalizedQuery = {
        userId: { $in: [...followingList, authUserId] },
      };

      // Check if the personalized (following-based) feed actually has any
      // posts. New users, or users who aren't following anyone yet, would
      // otherwise always see an empty "No posts yet" Home feed even though
      // plenty of public posts exist in the app.
      const personalizedCount = await Post.countDocuments(personalizedQuery);

      if (personalizedCount > 0) {
        query = personalizedQuery;
      } else {
        // Fallback: surface a public discovery feed (excluding blocked
        // users and private accounts you don't follow) so Home never shows
        // an empty state while public content exists.
        const privateUserIds = await User.find({ privateAccount: true })
          .distinct("_id");

        query = {
          $and: [
            { userId: { $nin: blockedList } },
            {
              $or: [
                { userId: { $in: [...followingList, authUserId] } },
                { userId: { $nin: privateUserIds } },
              ],
            },
          ],
        };
      }
    }

    const posts = await Post.find(query)
      .lean()
      .populate(
        "userId",
        "name username pic img type isVerified rating"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format posts for frontend
    const formattedPosts = posts.map((post) => ({
      ...post,
      commentsCount: post.comments
        ? post.comments.length
        : 0,
      comments: [],
    }));

    res.status(200).json({
      success: true,
      memories: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Like or unlike a travel memory
exports.toggleLikeMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const likeIdx = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let isLiked = false;
    let updatedPost;

    if (likeIdx === -1) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          $addToSet: { likes: userId },
        },
        { new: true }
      );

      isLiked = true;

      // Notify post owner when someone likes the post
      if (
        updatedPost &&
        updatedPost.userId &&
        updatedPost.userId.toString() !== userId.toString()
      ) {
        try {
          const senderUser = await User.findById(userId);

          if (senderUser) {
            await Notification.create({
              sender: userId,
              receiver: updatedPost.userId,
              type: "post_like",
              post: updatedPost._id,
              message: `${senderUser.name} liked your post.`,
            });
          }
        } catch (e) {
          console.error("Notification creation failed:", e);
        }
      }
    } else {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          $pull: { likes: userId },
        },
        { new: true }
      );

      isLiked = false;

      // Remove like notification when unlike happens
      if (
        updatedPost &&
        updatedPost.userId &&
        updatedPost.userId.toString() !== userId.toString()
      ) {
        try {
          await Notification.findOneAndDelete({
            sender: userId,
            receiver: updatedPost.userId,
            type: "post_like",
            post: updatedPost._id,
          });
        } catch (e) {
          console.error("Notification removal failed:", e);
        }
      }
    }

    res.status(200).json({
      success: true,
      likesCount: updatedPost.likes.length,
      isLiked,
      memory: updatedPost,
    });
  } catch (error) {
    console.error("Toggle memory like error:", error);

    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: error.message,
      stack: error.stack,
    });
  }
};
// Add a comment to a travel memory
exports.commentOnMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const comment = new Comment({
      postId,
      userId,
      userName: user.name,
      userPic: user.pic,
      text,
    });

    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    // Notify the post owner about the new comment
    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        sender: userId,
        receiver: post.userId,
        type: "post_comment",
        post: post._id,
        message: `${user.name} commented on your post: "${text.substring(0, 30)}..."`,
      });
    }

    const updatedPost = await Post.findById(postId)
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "name username pic",
        },
      });

    // Hide comments from blocked users
    const blockedUserIdsStr =
      user && user.blockedUsers
        ? user.blockedUsers.map((id) => id.toString())
        : [];

    const memory = updatedPost.toObject();

    if (memory.comments) {
      memory.comments = memory.comments.filter((comment) => {
        if (!comment.userId) return false;

        const authorId = comment.userId._id
          ? comment.userId._id.toString()
          : comment.userId.toString();

        return !blockedUserIdsStr.includes(authorId);
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      memory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a comment from a travel memory
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);
    const comment = await Comment.findById(commentId);

    if (!post || !comment) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (
      comment.userId.toString() !== userId.toString() &&
      post.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    post.comments = post.comments.filter(
      (id) => id.toString() !== commentId.toString()
    );

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "name username pic",
        },
      });

    // Hide comments from blocked users
    const user = await User.findById(userId);

    const blockedUserIds =
      user && user.blockedUsers
        ? user.blockedUsers.map((id) => id.toString())
        : [];

    const memory = updatedPost.toObject();

    if (memory.comments) {
      memory.comments = memory.comments.filter((comment) => {
        if (!comment.userId) return false;

        const authorId = comment.userId._id
          ? comment.userId._id.toString()
          : comment.userId.toString();

        return !blockedUserIds.includes(authorId);
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      memory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Save a travel memory
exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadySaved = await SavedPost.findOne({
      userId,
      postId,
    });

    if (alreadySaved) {
      return res.status(200).json({
        success: true,
        isSaved: true,
        message: "Post already saved",
      });
    }

    const savedPost = new SavedPost({
      userId,
      postId,
    });

    await savedPost.save();

    res.status(200).json({
      success: true,
      isSaved: true,
      message: "Post saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove a post from saved collection
exports.unsavePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const alreadySaved = await SavedPost.findOne({
      userId,
      postId,
    });

    if (alreadySaved) {
      await SavedPost.deleteOne({
        _id: alreadySaved._id,
      });
    }

    res.status(200).json({
      success: true,
      isSaved: false,
      message: "Post unsaved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all saved posts of the logged-in user
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { idsOnly } = req.query;

    let savedQuery = SavedPost.find({ userId }).sort({
      createdAt: -1,
    });

    // Return only post IDs if requested
    if (idsOnly === "true") {
      const saved = await savedQuery.select("postId").lean();

      const posts = saved.map((item) => ({
        _id: item.postId,
      }));

      return res.status(200).json({
        success: true,
        posts,
      });
    }

    const saved = await savedQuery.populate({
      path: "postId",
      populate: {
        path: "userId",
        select: "name username pic img type isVerified rating",
      },
    }).lean();

    const posts = saved
      .map((item) => item.postId)
      .filter(Boolean);

    const formattedPosts = posts.map((post) => ({
      ...post,
      commentsCount: post.comments ? post.comments.length : 0,
      comments: [],
    }));

    res.status(200).json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a travel memory
exports.deleteMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Allow only the post owner or admin to delete
    if (
      post.userId.toString() !== userId.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Remove related comments and saved records
    await Comment.deleteMany({ postId });
    await SavedPost.deleteMany({ postId });

    // Cascade deletion of journey references
    if (post.journeyId) {
      const JourneyTimeline = require("../models/JourneyTimeline");
      const JourneyGallery = require("../models/JourneyGallery");
      
      await JourneyTimeline.deleteMany({ journeyId: post.journeyId, referenceId: postId });
      await JourneyGallery.deleteMany({ journeyId: post.journeyId, referenceId: postId });

      let photoCount = 0;
      let videoCount = 0;
      if (post.mediaType === "video") {
        videoCount = 1;
      } else if (post.mediaType === "carousel") {
        photoCount = post.mediaUrls ? post.mediaUrls.length : 0;
      } else {
        photoCount = post.image || post.mediaUrl ? 1 : 0;
      }

      await Journey.findByIdAndUpdate(post.journeyId, {
        $inc: {
          "stats.postsCount": -1,
          "stats.photosCount": -photoCount,
          "stats.videosCount": -videoCount,
        }
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a travel memory
exports.updateMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { caption, location, tags } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Allow only the post owner to edit
    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
    }

    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    if (tags !== undefined) post.tags = tags;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all liked travel memories
exports.getLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const likedPosts = await Post.find({ likes: userId })
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "name pic avatar username",
        },
      })
      .sort({ createdAt: -1 });

    const user = await User.findById(userId);

    const blockedUserIds =
      user && user.blockedUsers
        ? user.blockedUsers.map((id) => id.toString())
        : [];

    // Remove comments from blocked users
    const formattedPosts = likedPosts.map((post) => {
      const memory = post.toObject();

      if (memory.comments) {
        memory.comments = memory.comments.filter((comment) => {
          if (!comment.userId) return false;

          const authorId = comment.userId._id
            ? comment.userId._id.toString()
            : comment.userId.toString();

          return !blockedUserIds.includes(authorId);
        });
      }

      return memory;
    });

    res.status(200).json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get comments of a travel memory
exports.getMemoryComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId)
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "name username pic avatar",
        },
      })
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const user = await User.findById(userId).lean();

    const blockedUserIds =
      user && user.blockedUsers
        ? user.blockedUsers.map((id) => id.toString())
        : [];

    // Hide comments from blocked users
    const filteredComments = post.comments.filter((comment) => {
      if (!comment.userId) return false;

      const authorId = comment.userId._id
        ? comment.userId._id.toString()
        : comment.userId.toString();

      return !blockedUserIds.includes(authorId);
    });

    res.status(200).json({
      success: true,
      comments: filteredComments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new travel story
exports.createStory = async (req, res) => {
  try {
    const {
      mediaType,
      caption,
      captionPosition,
      captionColor,
      visibility,
      journeyId,
    } = req.body;

    let { song, allowedUsers, hiddenFrom, stickers } = req.body;

    const userId = req.user._id || req.user.id;

    // Convert JSON strings to objects if needed
    if (song && typeof song === "string") {
      try {
        song = JSON.parse(song);
      } catch (error) {}
    }

    if (allowedUsers && typeof allowedUsers === "string") {
      try {
        allowedUsers = JSON.parse(allowedUsers);
      } catch (error) {}
    }

    if (hiddenFrom && typeof hiddenFrom === "string") {
      try {
        hiddenFrom = JSON.parse(hiddenFrom);
      } catch (error) {}
    }

    if (stickers && typeof stickers === "string") {
      try {
        stickers = JSON.parse(stickers);
      } catch (error) {
        console.error("Invalid stickers format");
      }
    }

    // Get uploaded media or media URL from request
    const media = req.file ? req.file.path : req.body.media;

    if (!media) {
      return res.status(400).json({
        success: false,
        message: "Media required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const story = new Story({
      userId,
      userName: user.name,
      userPic: user.pic,
      media,
      mediaType: mediaType || "image",
      caption: caption || "",
      captionPosition: captionPosition || "center",
      captionColor: captionColor || "white",
      visibility: visibility || "public",
      journeyId: journeyId || null,
      allowedUsers:
        visibility === "private" && Array.isArray(allowedUsers)
          ? allowedUsers
          : [],
      hiddenFrom: Array.isArray(hiddenFrom) ? hiddenFrom : [],
      song: song || null,
      stickers: Array.isArray(stickers) ? stickers : [],
    });

    await story.save();

    if (journeyId && media) {
      try {
        await JourneyGallery.create({
          journeyId,
          uploaderId: userId,
          uploaderName: user.name,
          uploaderPic: user.pic,
          mediaUrl: media,
          mediaType: mediaType === "video" ? "video" : "image",
          itemType: "story",
          referenceId: story._id,
          caption: caption || "",
        });

        await JourneyTimeline.create({
          journeyId,
          userId,
          userName: user.name,
          userPic: user.pic,
          eventType: "story_shared",
          title: "Story Shared",
          description: caption ? caption.substring(0, 100) : "Shared a travel story snippet",
          mediaUrl: media,
          referenceId: story._id,
        });

        await Journey.findByIdAndUpdate(journeyId, { $inc: { "stats.storiesCount": 1 } });
      } catch (err) {
        console.error("Error linking story to journey:", err);
      }
    }

    res.status(201).json({
      success: true,
      message: "Story published",
      story,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// React to a travel story
exports.reactToStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { emoji } = req.body;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const reactIdx = story.storyReactions.findIndex(
      (reaction) => reaction.userId?.toString() === userId.toString()
    );

    const currentUser = await User.findById(userId).select(
      "name username pic img"
    );

    const io = req.app.get("io");
    let chatMessageToReturn = null;

    // Add a new reaction if the user hasn't reacted yet
    if (reactIdx === -1) {
      story.storyReactions.push({
        userId,
        emoji,
        reactedAt: new Date(),
      });

      // Notify the story owner
      if (story.userId.toString() !== userId.toString()) {
        const notification = await Notification.create({
          sender: userId,
          receiver: story.userId,
          type: "story_like",
          story: story._id,
          message: `${currentUser.name} reacted ${emoji} to your story.`,
        });

        // Send real-time notification using Socket.IO
        if (io) {
          io.to(story.userId.toString()).emit("new_notification", notification);
        }
      }
    } else {
      // Update existing reaction
      story.storyReactions[reactIdx].emoji = emoji;
      story.storyReactions[reactIdx].reactedAt = new Date();
    }

    if (io && story.userId.toString() !== userId.toString()) {
      io.to(story.userId.toString()).emit("story_reaction_update", {
        storyId: story._id,
        reaction: {
          userId: currentUser,
          emoji,
          reactedAt: new Date(),
        },
      });
    }

    // Always create/update a chat message if reacting to someone else's story
    if (story.userId.toString() !== userId.toString()) {
      const ChatRoom = require("../models/ChatRoom");
      const Message = require("../models/Message");

      let room = await ChatRoom.findOne({
        type: "direct",
        members: {
          $all: [userId, story.userId],
        },
      });

      if (!room) {
        const ownerUser = await User.findById(story.userId);
        const isMutual = ownerUser && ownerUser.followers?.some(id => id.toString() === userId.toString()) && 
                         ownerUser.following?.some(id => id.toString() === userId.toString());
        room = new ChatRoom({
          name: ownerUser ? ownerUser.name : "Traveler",
          type: "direct",
          members: [userId, story.userId],
          requestStatus: isMutual ? "accepted" : "pending",
          requestedBy: userId,
        });
        await room.save();
      }

      // Upsert reaction as a chat message (update existing instead of creating duplicates)
      let message = await Message.findOne({
        roomId: room._id,
        sender: userId,
        storyId: story._id,
        text: { $regex: /^Reacted to your story:/ },
      });

      if (message) {
        // Update the existing reaction message
        message.text = `Reacted to your story: ${emoji}`;
        message.content = `Reacted to your story: ${emoji}`;
        message.updatedAt = new Date();
        await message.save();
      } else {
        // Create a new reaction message
        message = new Message({
          roomId: room._id,
          sender: userId,
          senderName: currentUser.name,
          senderPic: currentUser.pic || currentUser.img,
          text: `Reacted to your story: ${emoji}`,
          content: `Reacted to your story: ${emoji}`,
          storyId: story._id,
          unreadBy: [story.userId],
          deliveredTo: [userId],
          seenBy: [userId],
        });
        await message.save();
      }

      // Always populate story and sender before emitting
      await message.populate([
        { path: "sender", select: "-password" },
        { path: "storyId", select: "media mediaType caption" }
      ]);
      const msgObj = message.toObject();
      if (req.body.clientMsgId) {
        msgObj.clientMsgId = req.body.clientMsgId;
      }
      chatMessageToReturn = msgObj;

      room.updatedAt = new Date();
      room.hiddenFor = [];
      await room.save();

      if (io) {
        // Emit a dedicated event for reaction updates so the client can upsert
        console.log("[SERVER] EMIT receive_chat_message", msgObj);
        io.to(room._id.toString()).emit("story_reaction_message_updated", msgObj);
        io.to(room._id.toString()).emit("receive_chat_message", msgObj);

        io.to(userId.toString()).emit("story_reaction_message_updated", msgObj);
        io.to(userId.toString()).emit("receive_chat_message", msgObj);

        io.to(story.userId.toString()).emit("story_reaction_message_updated", msgObj);
        io.to(story.userId.toString()).emit("receive_chat_message", msgObj);

        // Emit message_sent acknowledgment to sender
        console.log("[SERVER] EMIT message_sent", { roomId: room._id.toString(), messageId: msgObj._id.toString(), clientMsgId: msgObj.clientMsgId });
        io.to(userId.toString()).emit("message_sent", {
          roomId: room._id.toString(),
          messageId: msgObj._id.toString(),
          clientMsgId: msgObj.clientMsgId,
          message: msgObj
        });
      }
    }

    await story.save();

    res.status(200).json({
      success: true,
      message: "Reaction updated",
      storyReactions: story.storyReactions,
      chatMessage: chatMessageToReturn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search travelers, travel groups, and posts
exports.globalSocialSearch = async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = req.user._id || req.user.id;

    if (!q.trim()) {
      return res.status(200).json({
        success: true,
        travelers: [],
        trips: [],
        memories: [],
      });
    }

    const regex = new RegExp(q, "i");

    // Search users, groups, and posts at the same time
    const [travelers, groups, posts] = await Promise.all([
      User.find({
        _id: { $ne: currentUserId },
        type: { $in: ["traveler", "Traveler"] },
        $or: [
          { name: regex },
          { username: regex },
          { country: regex },
          { interests: regex },
        ],
      })
        .select(
          "name username pic img avatar profilePic profilePicture userPic type isVerified rating completedTrips interests"
        )
        .limit(10),

      TravelGroup.find({
        $or: [
          { destination: regex },
          { title: regex },
          { category: regex },
        ],
      })
        .populate("host", "name username pic img avatar isVerified")
        .limit(10),

      Post.find({
        $or: [
          { caption: regex },
          { location: regex },
          { tags: regex },
        ],
      })
        .populate("userId", "name username pic img avatar isVerified")
        .limit(10),
    ]);

    // Format group data for frontend
    const trips = groups.map((group) => {
      const trip = group.toObject();
      trip.userId = group.host;
      return trip;
    });

    res.status(200).json({
      success: true,
      travelers,
      trips,
      memories: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reply to a travel story
exports.replyToStory = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const storyOwnerId = req.params.storyUserId;
    const { text, storyId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply text is required",
      });
    }

    if (senderId.toString() === storyOwnerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot reply to your own story",
      });
    }

    const senderUser = await User.findById(senderId);
    const ownerUser = await User.findById(storyOwnerId);

    if (!senderUser || !ownerUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find or create a direct chat room
    let room = await ChatRoom.findOne({
      type: "direct",
      members: {
        $all: [senderId, storyOwnerId],
      },
    });

    if (!room) {
      const isMutual = ownerUser && ownerUser.followers?.some(id => id.toString() === senderId.toString()) && 
                       ownerUser.following?.some(id => id.toString() === senderId.toString());
      room = new ChatRoom({
        name: ownerUser.name,
        type: "direct",
        members: [senderId, storyOwnerId],
        requestStatus: isMutual ? "accepted" : "pending",
        requestedBy: senderId
      });

      await room.save();
    }

    const Message = require("../models/Message");

    // Save the reply as a chat message
    const message = new Message({
      roomId: room._id,
      sender: senderId,
      senderName: senderUser.name,
      senderPic: senderUser.pic,
      text,
      content: text,
      storyId: storyId || null,
      unreadBy: [storyOwnerId],
      deliveredTo: [senderId],
      seenBy: [senderId]
    });

    await message.save();
    // Always populate story and sender fields before emitting so the chat UI has the preview
    await message.populate([
      { path: "sender", select: "-password" },
      { path: "storyId", select: "media mediaType caption" }
    ]);

    room.updatedAt = new Date();
    room.hiddenFor = [];
    await room.save();

    // Notify the story owner
    const notification = await Notification.create({
      sender: senderId,
      receiver: storyOwnerId,
      type: "story_reply",
      story: storyId || undefined,
      message: `${senderUser.name} replied to your story: "${text.substring(0, 40)}"`,
    });

    // Send updates in real time using Socket.IO
    const io = req.app.get("io");
    const messageObj = message.toObject();
    if (req.body.clientMsgId) {
      messageObj.clientMsgId = req.body.clientMsgId;
    }

    if (io) {
      console.log("BACKEND EMIT new_notification for story reply to storyOwnerId:", storyOwnerId.toString());
      io.to(storyOwnerId.toString()).emit(
        "new_notification",
        notification
      );

      // Emit the fully-populated message so the receiver gets the story preview
      console.log("[SERVER] EMIT receive_chat_message", messageObj);
      io.to(room._id.toString()).emit("receive_chat_message", messageObj);
      io.to(senderId.toString()).emit("receive_chat_message", messageObj);
      io.to(storyOwnerId.toString()).emit("receive_chat_message", messageObj);

      // Emit message_sent acknowledgment to sender
      console.log("[SERVER] EMIT message_sent", { roomId: room._id.toString(), messageId: messageObj._id.toString(), clientMsgId: messageObj.clientMsgId });
      io.to(senderId.toString()).emit("message_sent", {
        roomId: room._id.toString(),
        messageId: messageObj._id.toString(),
        clientMsgId: messageObj.clientMsgId,
        message: messageObj
      });
    }

    res.status(200).json({
      success: true,
      message: "Story reply sent!",
      roomId: room._id,
      chatMessage: messageObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// --- 6. SETTINGS & SEARCH ---

// Get all blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId).populate(
      "blockedUsers",
      "name username pic img"
    );

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

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.userId;

    const user = await User.findById(userId);

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    await user.save();

    // Remove block record if it exists
    if (mongoose.models.Block) {
      await mongoose
        .model("Block")
        .deleteOne({ blocker: userId, blocked: targetUserId });
    }

    res.status(200).json({
      success: true,
      message: "User unblocked",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get emergency contacts
exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search travelers, travel groups, and posts
exports.globalSocialSearch = async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = req.user._id || req.user.id;

    if (!q.trim()) {
      return res.status(200).json({
        success: true,
        travelers: [],
        trips: [],
        memories: [],
      });
    }

    const regex = new RegExp(q, "i");

    // Search users, groups, and posts together
    const [travelers, groups, posts] = await Promise.all([
      User.find({
        _id: { $ne: currentUserId },
        type: { $in: ["traveler", "Traveler"] },
        $or: [
          { name: regex },
          { username: regex },
          { country: regex },
          { interests: regex },
        ],
      })
        .select(
          "name username pic img avatar profilePic profilePicture userPic type isVerified rating completedTrips interests"
        )
        .limit(10),

      TravelGroup.find({
        $or: [
          { destination: regex },
          { title: regex },
          { category: regex },
        ],
      })
        .populate("host", "name username pic img avatar isVerified")
        .limit(10),

      Post.find({
        $or: [
          { caption: regex },
          { location: regex },
          { tags: regex },
        ],
      })
        .populate("userId", "name username pic img avatar isVerified")
        .limit(10),
    ]);

    // Format groups for frontend
    const trips = groups.map((group) => {
      const trip = group.toObject();
      trip.userId = group.host;
      return trip;
    });

    res.status(200).json({
      success: true,
      travelers,
      trips,
      memories: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// --- 6. SETTINGS & ACCOUNT ---

// Get all blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId).populate(
      "blockedUsers",
      "name username pic img"
    );

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

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.userId;

    const user = await User.findById(userId);

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    await user.save();

    // Remove block record if available
    if (mongoose.models.Block) {
      await mongoose
        .model("Block")
        .deleteOne({ blocker: userId, blocked: targetUserId });
    }

    res.status(200).json({
      success: true,
      message: "User unblocked",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get emergency contacts
exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a new emergency contact
exports.addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);

    // Keep only one primary contact
    if (req.body.isPrimary) {
      user.emergencyContacts.forEach((contact) => {
        contact.isPrimary = false;
      });
    }

    user.emergencyContacts.push(req.body);

    await user.save();

    res.status(201).json({
      success: true,
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update an emergency contact
exports.updateEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;

    const user = await User.findById(userId);

    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Keep only one primary contact
    if (req.body.isPrimary) {
      user.emergencyContacts.forEach((item) => {
        item.isPrimary = false;
      });
    }

    Object.assign(contact, req.body);

    await user.save();

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an emergency contact
exports.deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;

    const user = await User.findById(userId);

    user.emergencyContacts = user.emergencyContacts.filter(
      (contact) => contact._id.toString() !== contactId.toString()
    );

    await user.save();

    res.status(200).json({
      success: true,
      contacts: user.emergencyContacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel a travel group
exports.cancelTravelBuddyTrip = async (req, res) => {
  try {
    const trip = await TravelGroup.findById(req.params.id).populate(
      "members.user"
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Only the host or admin can cancel the trip
    if (
      trip.host.toString() !== (req.user._id || req.user.id).toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the host can cancel this trip.",
      });
    }

    if (trip.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Trip is already cancelled.",
      });
    }

    trip.status = "cancelled";
    trip.isCancelled = true;
    trip.cancelledAt = new Date();
    trip.cancelledBy = req.user._id || req.user.id;
    trip.cancellationReason = req.body.cancellationReason || "";

    await trip.save();

    // Notify all members about the cancellation
    if (trip.members?.length) {
      const notifications = trip.members
        .filter(
          (member) =>
            member._id.toString() !==
            (req.user._id || req.user.id).toString()
        )
        .map((member) => ({
          sender: req.user._id || req.user.id,
          receiver: member._id,
          type: "trip_cancelled",
          group: trip._id,
          message: `The host has cancelled the travel group "${trip.title}".`,
        }));

      if (notifications.length) {
        const Notification = require("../models/Notification");
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({
      success: true,
      message: "Trip has been cancelled.",
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Active Stories (Followed first, "My Story" prioritized)
exports.getActiveStories = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    const followingList = (user && user.following) ? user.following : [];
    const userIdsToFetch = [...followingList, userId];
    const allAllowedIds = [...userIdsToFetch];

    const usersInFeed = await User.find({ _id: { $in: allAllowedIds } }).select("blockedUsers following followers privateAccount");
    const userMap = {};
    usersInFeed.forEach(u => userMap[u._id.toString()] = u);

    const stories = await Story.find({ userId: { $in: allAllowedIds } })
      .populate("userId", "name username pic img avatar isVerified")
      .populate("viewers.userId", "name username pic img")
      .populate("storyReactions.userId", "name username pic img")
      .sort({ createdAt: 1 });

    const groupedStories = {};
    for (const story of stories) {
      if (!story.userId) continue;
      const sUserId = story.userId._id.toString();
      const myIdStr = userId.toString();
      
      if (sUserId !== myIdStr) {
        const author = userMap[sUserId];
        const myUser = userMap[myIdStr];
        
        if (!author || !myUser) continue;
        
        const IBlockedThem = myUser.blockedUsers?.some(b => b.toString() === sUserId);
        const TheyBlockedMe = author.blockedUsers?.some(b => b.toString() === myIdStr);
        if (IBlockedThem || TheyBlockedMe) continue;
        
        if (story.visibility === 'private') {
          if (!story.allowedUsers || !story.allowedUsers.some(u => u.toString() === myIdStr)) continue;
        } else if (story.visibility === 'friends') {
          const theyFollowMe = author.following?.some(f => f.toString() === myIdStr);
          if (!theyFollowMe) continue;
        }
        
        if (story.hiddenFrom && story.hiddenFrom.some(u => u.toString() === myIdStr)) {
          continue;
        }
      }
      
      if (!groupedStories[sUserId]) {
        groupedStories[sUserId] = {
          userId: sUserId,
          userName: story.userId.name || story.userName,
          userPic: story.userId.avatar || story.userId.pic || story.userId.img || story.userPic,
          stories: []
        };
      }
      groupedStories[sUserId].stories.push(story);
    }

    res.status(200).json({ success: true, stories: Object.values(groupedStories) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Story By ID
exports.getStoryById = async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findById(storyId).populate("userId", "name username pic img avatar");
    
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found or expired" });
    }
    
    res.status(200).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// View Story
exports.viewStory = async (req, res) => {
  try {
    const storyId = req.params.id || req.params.storyId;
    const userId = req.user._id || req.user.id;
    
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    // Ensure we don't count the owner's view or duplicate views
    if (story.userId.toString() !== userId.toString()) {
      const alreadyViewed = story.viewers.some(v => v.userId.toString() === userId.toString());
      if (!alreadyViewed) {
        const User = require("../models/User");
        const user = await User.findById(userId);
        const viewerData = { userId, viewedAt: new Date() };
        story.viewers.push(viewerData);
        if (!story.viewedBy) story.viewedBy = [];
        if (!story.viewedBy.includes(userId)) story.viewedBy.push(userId);
        await story.save();
        
        const io = req.app.get("io");
        if (io) {
          io.emit("story_viewer_update", { 
             storyId: story._id, 
             viewer: { 
               userId: { _id: user._id, name: user.name, pic: user.pic, img: user.img }, 
               viewedAt: viewerData.viewedAt 
             }
          });
        }
      }
    }
    
    res.status(200).json({ success: true, message: "Story viewed", story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Story
exports.updateStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { caption, captionPosition, captionColor, song } = req.body;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    if (story.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own stories" });
    }

    if (caption !== undefined) story.caption = caption;
    if (captionPosition !== undefined) story.captionPosition = captionPosition;
    if (captionColor !== undefined) story.captionColor = captionColor;
    if (song !== undefined) story.song = song;

    await story.save();
    res.status(200).json({ success: true, message: "Story updated successfully", story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Story
exports.deleteStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id || req.user.id;
    
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    
    if (story.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only delete your own stories" });
    }
    
    // Cascade deletion of journey references
    if (story.journeyId) {
      const JourneyTimeline = require("../models/JourneyTimeline");
      const JourneyGallery = require("../models/JourneyGallery");

      await JourneyTimeline.deleteMany({ journeyId: story.journeyId, referenceId: storyId });
      await JourneyGallery.deleteMany({ journeyId: story.journeyId, referenceId: storyId });

      let photoCount = 0;
      let videoCount = 0;
      if (story.mediaType === "video") {
        videoCount = 1;
      } else {
        photoCount = 1;
      }

      await Journey.findByIdAndUpdate(story.journeyId, {
        $inc: {
          "stats.storiesCount": -1,
          "stats.photosCount": -photoCount,
          "stats.videosCount": -videoCount,
        }
      });
    }

    await story.deleteOne();
    res.status(200).json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================
// HOST MEMBER MANAGEMENT
// ==========================

// Helper for checking group and roles
const checkGroupAndRoles = async (groupId, reqUserId, targetMemberId) => {
  const TravelGroup = require('../models/TravelGroup');
  const group = await TravelGroup.findById(groupId);
  if (!group) throw new Error("Group not found");

  // Handle legacy format for members array if it lacks proper objects
  if (group.members && group.members.length > 0 && !group.members[0].user && group.members[0]._id === undefined) {
    group.members = group.members.map(memberId => ({
      user: memberId,
      role: memberId.toString() === group.host.toString() ? 'host' : 'member',
      joinedAt: group.createdAt || new Date()
    }));
  }
  
  const currentUserObj = group.members.find(m => m.user && m.user.toString() === reqUserId.toString());
  const targetUserObj = group.members.find(m => m.user && m.user.toString() === targetMemberId.toString());
  
  if (!currentUserObj) throw new Error("You are not a member of this group");
  
  const currentUserRole = currentUserObj.role;
  const targetUserRole = targetUserObj ? targetUserObj.role : null;
  
  if (currentUserRole === 'member') throw new Error("You do not have permission for this action");
  
  return { group, currentUserRole, targetUserRole, targetUserObj };
};

exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const reqUserId = req.user._id || req.user.id;
    
    if (memberId === reqUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot remove yourself" });
    }
    
    const { group, currentUserRole, targetUserRole } = await checkGroupAndRoles(groupId, reqUserId, memberId);
    if (!targetUserRole) return res.status(404).json({ success: false, message: "User is not a member of this group" });
    
    if (targetUserRole === 'host') return res.status(403).json({ success: false, message: "Cannot remove the host" });
    if (currentUserRole === 'cohost' && targetUserRole === 'cohost') return res.status(403).json({ success: false, message: "Co-hosts cannot remove other co-hosts" });
    
    // Remove from group
    group.members = group.members.filter(m => m.user.toString() !== memberId);
    
    // Log activity
    group.activityLogs.push({ action: "Removed member", user: memberId, performedBy: reqUserId });
    await group.save();
    
    // Remove from chatroom
    const ChatRoom = require('../models/ChatRoom');
    await ChatRoom.findOneAndUpdate({ travelGroupId: groupId }, { $pull: { members: memberId } });
    
    res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.banMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const reqUserId = req.user._id || req.user.id;
    
    if (memberId === reqUserId.toString()) return res.status(400).json({ success: false, message: "You cannot ban yourself" });
    
    const { group, currentUserRole, targetUserRole } = await checkGroupAndRoles(groupId, reqUserId, memberId);
    
    if (currentUserRole !== 'host') return res.status(403).json({ success: false, message: "Only host can ban users" });
    if (targetUserRole === 'host') return res.status(403).json({ success: false, message: "Cannot ban the host" });
    
    // Ban user
    if (!group.bannedUsers.includes(memberId)) {
      group.bannedUsers.push(memberId);
    }
    
    // Remove from members if currently a member
    if (targetUserRole) {
      group.members = group.members.filter(m => m.user.toString() !== memberId);
      
      const ChatRoom = require('../models/ChatRoom');
      await ChatRoom.findOneAndUpdate({ travelGroupId: groupId }, { $pull: { members: memberId } });
    }
    
    // Log activity
    group.activityLogs.push({ action: "Banned member", user: memberId, performedBy: reqUserId });
    await group.save();
    
    res.status(200).json({ success: true, message: "User banned successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.promoteMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const reqUserId = req.user._id || req.user.id;
    
    const { group, currentUserRole, targetUserRole, targetUserObj } = await checkGroupAndRoles(groupId, reqUserId, memberId);
    
    if (currentUserRole !== 'host') return res.status(403).json({ success: false, message: "Only host can promote members" });
    if (!targetUserRole) return res.status(404).json({ success: false, message: "User is not a member" });
    if (targetUserRole === 'host') return res.status(400).json({ success: false, message: "User is already the host" });
    
    targetUserObj.role = targetUserObj.role === 'cohost' ? 'member' : 'cohost'; // Toggle role
    const actionMsg = targetUserObj.role === 'cohost' ? "Promoted to co-host" : "Demoted to member";
    
    group.activityLogs.push({ action: actionMsg, user: memberId, performedBy: reqUserId });
    await group.save();
    
    res.status(200).json({ success: true, message: actionMsg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.sendWarning = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { message } = req.body;
    const reqUserId = req.user._id || req.user.id;
    
    const { group, currentUserRole, targetUserRole } = await checkGroupAndRoles(groupId, reqUserId, memberId);
    if (!targetUserRole) return res.status(404).json({ success: false, message: "User is not a member" });
    
    if (targetUserRole === 'host') return res.status(403).json({ success: false, message: "Cannot warn the host" });
    if (currentUserRole === 'cohost' && targetUserRole === 'cohost') return res.status(403).json({ success: false, message: "Co-hosts cannot warn other co-hosts" });
    
    group.warnings.push({ user: memberId, message });
    group.activityLogs.push({ action: "Sent warning", user: memberId, performedBy: reqUserId });
    await group.save();
    
    // (Notification sending logic goes here)
    const Notification = require('../models/Notification');
    if (Notification) {
      await Notification.create({
        user: memberId,
        sender: reqUserId,
        type: "warning",
        message: `Warning from Travel Group "${group.title}": ${message}`,
        link: `/social/group/${group._id}`
      });
    }
    
    res.status(200).json({ success: true, message: "Warning sent" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { groupId } = req.params;
    const TravelGroup = require('../models/TravelGroup');
    const group = await TravelGroup.findById(groupId)
      .populate('activityLogs.user', 'name username pic')
      .populate('activityLogs.performedBy', 'name username pic');
      
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    
    const reqUserId = req.user._id || req.user.id;
    const currentUserObj = group.members.find(m => m.user && m.user.toString() === reqUserId.toString());
    if (!currentUserObj || currentUserObj.role === 'member') {
      return res.status(403).json({ success: false, message: "Only host or co-host can view logs" });
    }
    
    res.status(200).json({ success: true, logs: group.activityLogs.sort((a,b) => b.createdAt - a.createdAt) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getFeltPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = req.user ? (req.user._id || req.user.id) : null;

    if (authUserId) {
      const targetUser = await User.findById(userId).lean().select("privateAccount followers");
      if (targetUser && targetUser.privateAccount && authUserId.toString() !== userId.toString()) {
         const isFollower = targetUser.followers && targetUser.followers.some(f => f.toString() === authUserId.toString());
         if (!isFollower && (!req.user || !req.user.isAdmin)) {
             return res.status(200).json({ success: true, memories: [] });
         }
      }
    }
    
    const feltPosts = await Post.find({ likes: userId })
      .lean()
      .populate("userId", "name username pic img profileImage")
      .sort({ createdAt: -1 });
      
    const formattedPosts = feltPosts.map(post => {
      return {
        ...post,
        commentsCount: post.comments ? post.comments.length : 0,
        comments: [] // empty comments array for initial load
      };
    });

    res.status(200).json({ success: true, memories: formattedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};