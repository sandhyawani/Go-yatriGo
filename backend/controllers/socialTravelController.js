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

// --- 1. TRAVEL GROUPS ---

// Create Travel Group
exports.createTravelBuddyTrip = async (req, res) => {
  try {
    const {
      title, destination, startDate, endDate,
      maxMembers, maxCompanions, // accept both field names
      description, coverImage, category,
      from, isPrivate, tags, budget
    } = req.body;
    const userId = req.user._id || req.user.id;

    // Accept maxCompanions as alias for maxMembers (frontend sends maxCompanions)
    const resolvedMaxMembers = maxMembers || maxCompanions;

    // Identify which fields are missing for a clear error
    const missing = [];
    if (!title?.trim()) missing.push("title");
    if (!destination?.trim()) missing.push("destination");
    if (!startDate) missing.push("startDate");
    if (!endDate) missing.push("endDate");
    if (!description?.trim()) missing.push("description");
    if (!resolvedMaxMembers) missing.push("maxCompanions/maxMembers");

    if (missing.length > 0) {
      console.log("[createTravelBuddyTrip] Missing fields:", missing);
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(", ")}` });
    }

    const group = new TravelGroup({
      host: userId,
      title,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxMembers: Number(resolvedMaxMembers),
      description,
      coverImage: coverImage || "",
      category: category || "Adventure",
      from: from || "",
      isPrivate: isPrivate || false,
      tags: tags || [],
      budget: Number(budget) || 0,
      members: [{ user: userId, role: "host" }] // Host is a member by default
    });

    await group.save();

    // Automatically create a Group Chat for this trip
    const chatRoom = new ChatRoom({
      name: `${title} - Group Chat`,
      type: "group",
      members: [userId],
      travelGroupId: group._id
    });
    await chatRoom.save();

    res.status(201).json({ success: true, message: "Travel group created successfully", group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Explore Metadata (Dynamic Categories, Counts, Active Travelers)
exports.getExploreMetadata = async (req, res) => {
  try {
    const now = new Date();

    // 1. Calculate Categories (excluding cancelled)
    const categoriesAggr = await TravelGroup.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const categories = categoriesAggr.map(cat => ({ name: cat._id || "Other", count: cat.count }));

    // 2. Lifecycle Status Counts
    const totalGroups = await TravelGroup.countDocuments({});
    const upcomingGroups = await TravelGroup.countDocuments({ status: { $ne: "cancelled" }, startDate: { $gt: now } });
    const activeGroups = await TravelGroup.countDocuments({ status: { $ne: "cancelled" }, startDate: { $lte: now }, endDate: { $gte: now } });
    const completedGroups = await TravelGroup.countDocuments({ status: { $ne: "cancelled" }, endDate: { $lt: now } });
    const cancelledGroups = await TravelGroup.countDocuments({ status: "cancelled" });

    // 3. Online/Active Travelers
    // Use users updated in the last 30 minutes as a real fallback
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeTravelers = await User.countDocuments({ updatedAt: { $gte: thirtyMinsAgo } });

    res.status(200).json({
      success: true,
      categories,
      counts: {
        total: totalGroups,
        upcoming: upcomingGroups,
        active: activeGroups,
        completed: completedGroups,
        cancelled: cancelledGroups
      },
      onlineTravelers: activeTravelers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Travel Groups
exports.getAllTravelBuddyTrips = async (req, res) => {
  try {
    const { destination, category, lifecycleStatus, sortBy, userId } = req.query;
    let query = {};

    const currentUserId = req.user._id || req.user.id;
    const currentUser = await User.findById(currentUserId);
    const followingList = currentUser ? currentUser.following : [];
    const privateUsers = await User.find({ privateAccount: true }).distinct('_id');
    const privateUsersNotFollowed = privateUsers.filter(id => 
      id.toString() !== currentUserId.toString() && 
      !followingList.some(f => f.toString() === id.toString())
    );

    const baseCondition = {
      $or: [
        { host: { $nin: privateUsersNotFollowed } },
        { "members.user": currentUserId }
      ]
    };

    if (userId) {
      const targetUser = await User.findById(userId).lean().select("privateAccount followers");
      if (targetUser && targetUser.privateAccount && currentUserId.toString() !== userId.toString()) {
         const isFollower = targetUser.followers && targetUser.followers.some(f => f.toString() === currentUserId.toString());
         if (!isFollower && (!req.user || !req.user.isAdmin)) {
             return res.status(200).json({ success: true, trips: [], pagination: { total: 0, page: 1, limit: parseInt(req.query.limit) || 10, hasMore: false } });
         }
      }

      query.$and = [
        baseCondition,
        { $or: [{ host: userId }, { "members.user": userId }] }
      ];
    } else {
      query.$or = baseCondition.$or;
    }

    if (destination) {
      query.destination = new RegExp(destination, "i");
    }
    if (category && category !== "All") {
      query.category = new RegExp(category, "i");
    }

    const now = new Date();
    if (lifecycleStatus && lifecycleStatus !== "All") {
      if (lifecycleStatus.toLowerCase() === "cancelled") {
        query.status = "cancelled";
      } else {
        query.status = { $ne: "cancelled" };
        if (lifecycleStatus.toLowerCase() === "upcoming") {
          query.startDate = { $gt: now };
        } else if (lifecycleStatus.toLowerCase() === "active now" || lifecycleStatus.toLowerCase() === "active") {
          query.startDate = { $lte: now };
          query.endDate = { $gte: now };
        } else if (lifecycleStatus.toLowerCase() === "completed") {
          query.endDate = { $lt: now };
        }
      }
    }

    let sortObj = { createdAt: -1 };
    if (sortBy === "Oldest") sortObj = { createdAt: 1 };
    else if (sortBy === "Starting Soon") sortObj = { startDate: 1 };
    else if (sortBy === "Recently Active") sortObj = { updatedAt: -1 };
    else if (sortBy === "Newly Created") sortObj = { createdAt: -1 };
    else if (sortBy === "Most Travelers") sortObj = { maxMembers: -1 }; 
    else if (sortBy === "Highest Rated") sortObj = { createdAt: -1 }; 

    // Cancelled trips always at the bottom
    sortObj = { isCancelled: 1, ...sortObj };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await TravelGroup.countDocuments(query);

    const groups = await TravelGroup.find(query)
      .populate("host", "name username pic img isVerified rating completedTrips")
      .populate("members.user", "name username pic img")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Map fields for frontend compatibility
    const groupIds = groups.map(g => g._id);
    const allRequests = await JoinRequest.find({ groupId: { $in: groupIds } });

    const mapped = groups.map(g => {
      const obj = g.toObject();
      obj.userId = obj.host;            // frontend expects userId for host info
      const membs = obj.members || [];
      obj.companions = membs.map(m => m.user || m);     // frontend expects companions array
      obj.maxCompanions = obj.maxMembers; // frontend expects maxCompanions for slot count
      obj.joinRequests = allRequests.filter(req => req?.groupId?.toString() === obj?._id?.toString());
      return obj;
    });

    res.status(200).json({ 
      success: true, 
      trips: mapped,
      pagination: {
        total,
        page,
        limit,
        hasMore: total > skip + groups.length
      }
    });
  } catch (error) {
    console.error("GET ALL TRIPS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Liked Buddy Trips (Felt Vibes)
exports.getLikedBuddyTrips = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    const query = { likes: currentUserId };

    const groups = await TravelGroup.find(query)
      .populate("host", "name username pic img isVerified rating completedTrips")
      .populate("members.user", "name username pic img")
      .sort({ createdAt: -1 });

    const groupIds = groups.map(g => g._id);
    const allRequests = await JoinRequest.find({ groupId: { $in: groupIds } });

    const mapped = groups.map(g => {
      const obj = g.toObject();
      obj.userId = obj.host; // frontend expects userId for host info
      const membs = obj.members || [];
      obj.companions = membs.map(m => m.user || m); 
      obj.maxCompanions = obj.maxMembers;
      obj.joinRequests = allRequests.filter(req => req?.groupId?.toString() === obj?._id?.toString());
      return obj;
    });

    res.status(200).json({ 
      success: true, 
      trips: mapped
    });
  } catch (error) {
    console.error("GET LIKED TRIPS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Felt Vibes Collection (Unified Memory/Story/Group aggregation)
exports.getFeltVibesCollection = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    // 1. Fetch Liked Travel Memories (Posts)
    const posts = await Post.find({ likes: currentUserId })
      .populate("userId", "name username pic img isVerified")
      .lean();

    const formattedPosts = posts.map(post => ({
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
      createdAt: post.createdAt
    }));

    // 2. Fetch Reacted Stories
    const stories = await Story.find({ "storyReactions.userId": currentUserId })
      .populate("userId", "name username pic img isVerified")
      .lean();

    const formattedStories = stories.map(story => {
      // Get the specific reaction the user made
      const userReaction = story.storyReactions?.find(r => r.userId?.toString() === currentUserId.toString());
      return {
        _id: story._id,
        type: "story",
        postType: "story", // Uniform property for frontend filters
        mediaUrl: story.media,
        mediaType: story.mediaType || "image",
        author: story.userId || { name: story.userName, pic: story.userPic },
        location: "", // Stories might not have location in this model
        caption: story.caption || "",
        likesCount: story.storyReactions ? story.storyReactions.length : 0,
        commentsCount: story.comments ? story.comments.length : 0,
        createdAt: userReaction ? userReaction.reactedAt : story.createdAt
      };
    });

    // 3. Fetch Liked Travel Groups
    const groups = await TravelGroup.find({ likes: currentUserId })
      .populate("host", "name username pic img isVerified rating")
      .lean();

    const formattedGroups = groups.map(group => ({
      _id: group._id,
      type: "group",
      postType: "group",
      mediaUrl: group.coverImage,
      mediaType: "image",
      author: group.host,
      location: `${group.from ? group.from + ' → ' : ''}${group.destination}`,
      caption: group.title || "",
      likesCount: group.likes ? group.likes.length : 0,
      commentsCount: 0, // Groups don't have direct comments array
      createdAt: group.createdAt,
      extra: {
        startDate: group.startDate,
        endDate: group.endDate,
        status: group.lifecycleStatus,
        slotsOpen: Math.max(0, group.maxMembers - (group.members ? group.members.length : 0))
      }
    }));

    // Combine all and sort
    let allFeltVibes = [...formattedPosts, ...formattedStories, ...formattedGroups];
    
    // Sort logic
    // 1. Travel Memories
    // 2. Stories
    // 3. Travel Groups
    // 4. Documents
    // 5. Profile Updates
    // 6. General
    const sortPriority = {
      "travel_memory": 1,
      "travel_photo": 1,
      "travel_video": 1,
      "memory": 1, // Fallback
      "story": 2,
      "group": 3,
      "document": 4,
      "profile_update": 5,
      "general": 6
    };

    allFeltVibes.sort((a, b) => {
      const priorityA = sortPriority[a.postType] || 6;
      const priorityB = sortPriority[b.postType] || 6;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({ 
      success: true, 
      feltVibes: allFeltVibes
    });
  } catch (error) {
    console.error("GET FELT VIBES ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Like / Favourite a Travel Buddy Trip
exports.toggleLikeBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Travel group not found" });
    }

    const likeIdx = group.likes.findIndex(id => id.toString() === userId.toString());
    let isLiked = false;

    if (likeIdx === -1) {
      group.likes.push(userId);
      isLiked = true;
    } else {
      group.likes.splice(likeIdx, 1);
    }

    await group.save();
    res.status(200).json({ success: true, isLiked, likesCount: group.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Travel Group by ID
exports.getTravelBuddyTripById = async (req, res) => {
  try {
    const group = await TravelGroup.findById(req.params.id)
      .populate("host", "name username pic img isVerified rating completedTrips interests bio")
      .populate("members.user", "name username pic img interests completedTrips rating");

    if (!group) {
      return res.status(404).json({ success: false, message: "Travel group not found" });
    }

    // Find requests for this group
    const requests = await JoinRequest.find({ groupId: group._id })
      .populate("userId", "name username pic img rating completedTrips");

    // Map properties for UI compatibility
    const groupObj = group.toObject();
    
    // Handle legacy members that are just ObjectIds (strings/ObjectIds)
    let processedMembers = groupObj.members || [];
    if (processedMembers.length > 0 && !processedMembers[0].user && processedMembers[0]._id === undefined) {
      // It's a legacy array of ObjectIds
      const User = require("../models/User");
      const users = await User.find({ _id: { $in: processedMembers } }).select("name username pic img interests completedTrips rating").lean();
      
      processedMembers = users.map(u => ({
        user: u,
        role: (group.host && group.host._id && u._id.toString() === group.host._id.toString()) ? 'host' : 'member',
        joinedAt: group.createdAt
      }));
    }
    
    // Also inject host into processedMembers if not present, because new UI expects host in members list
    if (group.host) {
      if (!processedMembers.some(m => m.user && m.user._id && m.user._id.toString() === group.host._id.toString())) {
        const hostObj = group.host._id ? group.host : { _id: group.host };
        processedMembers.unshift({ user: hostObj, role: 'host', joinedAt: group.createdAt });
      }
    }
    
    groupObj.members = processedMembers;
    const hostIdStr = group.host && group.host._id ? group.host._id.toString() : (group.host ? group.host.toString() : null);
    groupObj.companions = processedMembers.map(m => m.user).filter(u => u && u._id && (hostIdStr ? u._id.toString() !== hostIdStr : true));
    groupObj.joinRequests = requests.map(req => ({
      _id: req._id,
      userId: req.userId,
      status: req.status,
      message: req.message,
      createdAt: req.createdAt
    }));
    groupObj.userId = group.host; // mapping userId to host for legacy compat

    res.status(200).json({ success: true, trip: groupObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request to Join Travel Group
exports.requestToJoinTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { message } = req.body;

    const group = await TravelGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Travel group not found" });
    }

    // Fix legacy members array format if needed
    if (group.members && group.members.length > 0 && !group.members[0].user && group.members[0]._id === undefined) {
      group.members = group.members.map(memberId => ({
        user: memberId,
        role: memberId.toString() === group.host.toString() ? 'host' : 'member',
        joinedAt: group.createdAt || new Date()
      }));
    }

    if (group.host.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "You are the host of this group" });
    }

    if (group.members.some(m => m.user && m.user.toString() === userId.toString())) {
      return res.status(400).json({ success: false, message: "You are already a member of this group" });
    }

    if (!group.isPrivate) {
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({ success: false, message: "This travel group is already full" });
      }
      group.members.push({ user: userId, role: "member" });
      if (group.members.length >= group.maxMembers) {
        group.status = "full";
      }
      await group.save();

      await ChatRoom.findOneAndUpdate(
        { travelGroupId: group._id },
        { $push: { members: userId } }
      );

      const senderUser = await User.findById(userId);
      await Notification.create({
        sender: userId,
        receiver: group.host,
        type: "group_joined",
        group: group._id,
        message: `${senderUser.name} joined your travel group "${group.title}".`
      });

      return res.status(200).json({ success: true, message: "Successfully joined the travel group", group });
    }

    // Check if duplicate requests exist
    let requestObj = await JoinRequest.findOne({ groupId, userId });
    if (requestObj) {
      if (requestObj.status === "Pending") {
        return res.status(400).json({ success: false, message: "You already have a pending join request" });
      }
      requestObj.status = "Pending";
      requestObj.message = message || "";
      await requestObj.save();
    } else {
      requestObj = new JoinRequest({
        groupId,
        userId,
        message: message || "",
        status: "Pending"
      });
      await requestObj.save();
    }

    // Notify host
    const senderUser = await User.findById(userId);
    await Notification.create({
      sender: userId,
      receiver: group.host,
      type: "join_request",
      group: group._id,
      joinRequest: requestObj._id,
      message: `${senderUser.name} requested to join your travel group "${group.title}".`
    });

    res.status(200).json({ success: true, message: "Join request submitted successfully", request: requestObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Host Manage Request (Approve/Reject)
exports.manageJoinRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body; // status: "Approved" or "Rejected"
    const hostId = req.user._id || req.user.id;

    if (!requestId || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid request ID and status required" });
    }

    const requestObj = await JoinRequest.findById(requestId);
    if (!requestObj) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const group = await TravelGroup.findById(requestObj.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Fix legacy members array format if needed
    if (group.members && group.members.length > 0 && !group.members[0].user && group.members[0]._id === undefined) {
      group.members = group.members.map(memberId => ({
        user: memberId,
        role: memberId.toString() === group.host.toString() ? 'host' : 'member',
        joinedAt: group.createdAt || new Date()
      }));
    }

    if (group.host.toString() !== hostId.toString()) {
      return res.status(403).json({ success: false, message: "Only the host can manage join requests" });
    }

    requestObj.status = status;
    await requestObj.save();

    if (status === "Approved") {
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({ success: false, message: "This travel group is already full" });
      }
      if (!group.members.some(m => m.user && m.user.toString() === requestObj.userId.toString())) {
        group.members.push({ user: requestObj.userId, role: "member" });
        if (group.members.length >= group.maxMembers) {
          group.status = "full";
        }
        await group.save();

        if (ChatRoom) {
          // Automatically add to ChatRoom for group chat
          await ChatRoom.findOneAndUpdate(
            { travelGroupId: group._id },
            { $push: { members: requestObj.userId } }
          );
        }
      }
    }

    // Create Notification
    await Notification.create({
      sender: hostId,
      receiver: requestObj.userId,
      type: status === "Approved" ? "request_approved" : "request_rejected",
      group: group._id,
      message: `Your request to join "${group.title}" was ${status.toLowerCase()}.`
    });

    // Remove the original pending join_request notification
    await Notification.findOneAndDelete({
      receiver: hostId,
      type: "join_request",
      joinRequest: requestObj._id
    });

    res.status(200).json({ success: true, message: `Request successfully ${status.toLowerCase()}`, request: requestObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Leave Travel Group
exports.leaveTravelBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Travel group not found" });
    }

    // Fix legacy members array format if needed
    if (group.members && group.members.length > 0 && !group.members[0].user && group.members[0]._id === undefined) {
      group.members = group.members.map(memberId => ({
        user: memberId,
        role: memberId.toString() === group.host.toString() ? 'host' : 'member',
        joinedAt: group.createdAt || new Date()
      }));
    }

    if (group.host.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "Hosts cannot leave their own group. Please complete or cancel the trip." });
    }

    group.members = group.members.filter(m => m.user && m.user.toString() !== userId.toString());
    if (group.status === "full" && group.members.length < group.maxMembers) {
      group.status = "open";
    }
    if (!group.activityLogs) group.activityLogs = [];
    group.activityLogs.push({ action: "Left the group", user: userId, performedBy: userId });
    await group.save();

    // Remove from ChatRoom members
    await ChatRoom.findOneAndUpdate(
      { travelGroupId: group._id },
      { $pull: { members: userId } }
    );

    // Clean up join requests
    await JoinRequest.deleteOne({ groupId, userId });

    // Notify host
    const leavingUser = await User.findById(userId);
    if (Notification && leavingUser) {
      await Notification.create({
        sender: userId,
        receiver: group.host,
        type: "group_left",
        group: group._id,
        message: `${leavingUser.name} left your travel group "${group.title}".`
      });
    }

    res.status(200).json({ success: true, message: "Left travel group successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Travel Group
exports.deleteTravelBuddyTrip = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id || req.user.id;

    const reqUserId = req.user._id || req.user.id;

    const group = await TravelGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Travel group not found" });
    }

    // Fix legacy members array format if needed
    if (group.members && group.members.length > 0 && !group.members[0].user && group.members[0]._id === undefined) {
      group.members = group.members.map(memberId => ({
        user: memberId,
        role: memberId.toString() === group.host.toString() ? 'host' : 'member',
        joinedAt: group.createdAt || new Date()
      }));
    }

    if (group.host.toString() !== reqUserId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Only the host can delete this group" });
    }

    await TravelGroup.findByIdAndDelete(groupId);
    
    // Clean up associated data
    await ChatRoom.findOneAndDelete({ travelGroupId: groupId });
    await JoinRequest.deleteMany({ groupId });

    res.status(200).json({ success: true, message: "Travel group deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. TRAVEL POSTS (Instagram Style) ---

// Create Travel Post
exports.createMemory = async (req, res) => {
  try {
    const { caption, location, image, mediaUrl, mediaUrls, mediaType, tags, title, music, taggedUsers, disableComments, hideLikes } = req.body;
    const userId = req.user._id || req.user.id;

    if (!caption || (!image && !mediaUrl && (!mediaUrls || mediaUrls.length === 0))) {
      return res.status(400).json({ success: false, message: "Caption and Media are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
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
      image: finalMediaUrl, // For backward compatibility
      mediaUrl: finalMediaUrl,
      mediaUrls: mediaUrls || [],
      mediaType: finalMediaType,
      music: music || undefined,
      taggedUsers: taggedUsers || [],
      disableComments: disableComments || false,
      hideLikes: hideLikes || false,
      likes: [],
      comments: []
    });

    await post.save();
    res.status(201).json({ success: true, message: "Travel post created successfully", post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Posts Feed (Followed users and own posts only)
exports.getAllMemories = async (req, res) => {
  try {
    const authUserId = req.user._id || req.user.id;
    const { userId: filterUserId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    const user = await User.findById(authUserId).lean().select("following blockedUsers");
    
    let query = {};
    if (filterUserId) {
      const targetUser = await User.findById(filterUserId).lean().select("privateAccount followers");
      if (targetUser && targetUser.privateAccount && authUserId.toString() !== filterUserId.toString()) {
         const isFollower = targetUser.followers && targetUser.followers.some(f => f.toString() === authUserId.toString());
         if (!isFollower && (!req.user || !req.user.isAdmin)) {
             return res.status(200).json({ success: true, memories: [] });
         }
      }
      query.userId = filterUserId;
    } else {
      const followingList = (user && user.following) ? user.following : [];
      const allIds = [...followingList, authUserId];
      query.userId = { $in: allIds };
    }
    
    let uniquePosts = await Post.find(query)
      .lean()
      .populate("userId", "name username pic img type isVerified rating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedPosts = uniquePosts.map(post => {
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

// Toggle Like Post
exports.toggleLikeMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const likeIdx = post.likes.findIndex(id => id.toString() === userId.toString());
    let isLiked = false;
    let updatedPost;

    if (likeIdx === -1) {
      updatedPost = await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId }
      }, { new: true });
      isLiked = true;

      if (updatedPost && updatedPost.userId && updatedPost.userId.toString() !== userId.toString()) {
        try {
          const senderUser = await User.findById(userId);
          if (senderUser) {
            await Notification.create({
              sender: userId,
              receiver: updatedPost.userId,
              type: "post_like",
              post: updatedPost._id,
              message: `${senderUser.name} liked your post.`
            });
          }
        } catch (e) {
          console.error("Notification creation failed:", e);
        }
      }
    } else {
      updatedPost = await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId }
      }, { new: true });
      isLiked = false;
      
      if (updatedPost && updatedPost.userId && updatedPost.userId.toString() !== userId.toString()) {
        try {
          await Notification.findOneAndDelete({
            sender: userId,
            receiver: updatedPost.userId,
            type: "post_like",
            post: updatedPost._id
          });
        } catch (e) {
          console.error("Notification removal failed:", e);
        }
      }
    }

    res.status(200).json({ success: true, likesCount: updatedPost.likes.length, isLiked, memory: updatedPost });
  } catch (error) {
    console.error("Toggle memory like error:", error);
    res.status(500).json({ success: false, message: "Error toggling like", error: error.message, stack: error.stack });
  }
};

// Comment on Post
exports.commentOnMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const comment = new Comment({
      postId,
      userId,
      userName: user.name,
      userPic: user.pic,
      text
    });
    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    // Notify post author
    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        sender: userId,
        receiver: post.userId,
        type: "post_comment",
        post: post._id,
        message: `${user.name} commented on your post: "${text.substring(0, 30)}..."`
      });
    }

    // Populate and return post with updated comments
    const updatedPost = await Post.findById(postId)
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name username pic" }
      });

    const blockedUserIdsStr = user && user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : [];
    const p = updatedPost.toObject();
    if (p.comments) {
      p.comments = p.comments.filter(comment => {
        if (!comment.userId) return false;
        const authorId = comment.userId._id ? comment.userId._id.toString() : comment.userId.toString();
        return !blockedUserIdsStr.includes(authorId);
      });
    }

    res.status(200).json({ success: true, message: "Comment added successfully", memory: p });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const post = await Post.findById(postId);
    const comment = await Comment.findById(commentId);
    
    if (!post || !comment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    
    if (comment.userId.toString() !== userId.toString() && post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }
    
    await Comment.findByIdAndDelete(commentId);
    post.comments = post.comments.filter(id => id.toString() !== commentId.toString());
    await post.save();
    
    // Populate and return updated post with filtered comments
    const updatedPost = await Post.findById(postId)
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name username pic" }
      });

    const user = await User.findById(userId);
    const blockedUserIdsStr = user && user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : [];
    const p = updatedPost.toObject();
    if (p.comments) {
      p.comments = p.comments.filter(comment => {
        if (!comment.userId) return false;
        const authorId = comment.userId._id ? comment.userId._id.toString() : comment.userId.toString();
        return !blockedUserIdsStr.includes(authorId);
      });
    }
    
    res.status(200).json({ success: true, message: "Comment deleted successfully", memory: p });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save Post
exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const alreadySaved = await SavedPost.findOne({ userId, postId });
    if (alreadySaved) {
      return res.status(200).json({ success: true, isSaved: true, message: "Post already saved" });
    } else {
      const saved = new SavedPost({ userId, postId });
      await saved.save();
      return res.status(200).json({ success: true, isSaved: true, message: "Post saved successfully" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unsave Post
exports.unsavePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const alreadySaved = await SavedPost.findOne({ userId, postId });
    if (alreadySaved) {
      await SavedPost.deleteOne({ _id: alreadySaved._id });
    }
    return res.status(200).json({ success: true, isSaved: false, message: "Post unsaved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Saved Posts by User
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { idsOnly } = req.query;

    let savedQuery = SavedPost.find({ userId }).sort({ createdAt: -1 });

    if (idsOnly === 'true') {
      const saved = await savedQuery.select("postId").lean();
      const posts = saved.map(s => ({ _id: s.postId }));
      return res.status(200).json({ success: true, posts });
    }

    const saved = await savedQuery.populate({
      path: "postId",
      populate: { path: "userId", select: "name username pic img" }
    });

    const posts = saved.map(s => s.postId).filter(Boolean);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Own Post
exports.deleteMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userId.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    await Comment.deleteMany({ postId });
    await SavedPost.deleteMany({ postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Own Post (Memory)
exports.updateMemory = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { caption, location, tags } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own posts" });
    }

    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    if (tags !== undefined) post.tags = tags;

    await post.save();
    res.status(200).json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Liked Posts
exports.getLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const likedPosts = await Post.find({ likes: userId })
      .populate("userId", "name username pic img")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name pic avatar username" }
      })
      .sort({ createdAt: -1 });

    const user = await User.findById(userId);
    const blockedUserIdsStr = user && user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : [];
    const formattedPosts = likedPosts.map(post => {
      const p = post.toObject ? post.toObject() : post;
      if (p.comments) {
        p.comments = p.comments.filter(comment => {
          if (!comment.userId) return false;
          const authorId = comment.userId._id ? comment.userId._id.toString() : comment.userId.toString();
          return !blockedUserIdsStr.includes(authorId);
        });
      }
      return p;
    });

    res.status(200).json({ success: true, posts: formattedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getMemoryComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;
    const post = await Post.findById(postId).populate({
        path: "comments",
        populate: { path: "userId", select: "name username pic avatar" }
    }).lean();
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    const user = await User.findById(userId).lean();
    const blockedUserIdsStr = user && user.blockedUsers ? user.blockedUsers.map(id => id.toString()) : [];
    const filteredComments = post.comments.filter(comment => {
      if (!comment.userId) return false;
      const authorId = comment.userId._id ? comment.userId._id.toString() : comment.userId.toString();
      return !blockedUserIdsStr.includes(authorId);
    });
    res.status(200).json({ success: true, comments: filteredComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 3. TRAVEL STORIES (24h Expiration) ---

// Publish Story
exports.createStory = async (req, res) => {
  try {
    const { mediaType, caption, captionPosition, captionColor, visibility } = req.body;
    let { song, allowedUsers, hiddenFrom, stickers } = req.body;
    const userId = req.user._id || req.user.id;

    if (song && typeof song === 'string') {
      try { song = JSON.parse(song); } catch (e) {}
    }
    if (allowedUsers && typeof allowedUsers === 'string') {
      try { allowedUsers = JSON.parse(allowedUsers); } catch (e) {}
    }
    if (hiddenFrom && typeof hiddenFrom === 'string') {
      try { hiddenFrom = JSON.parse(hiddenFrom); } catch (e) {}
    }
    console.log("REQ BODY STICKERS:", req.body.stickers);
    if (stickers) {
      try {
        stickers = typeof stickers === 'string' ? JSON.parse(stickers) : stickers;
      } catch (err) {
        console.error("Invalid stickers JSON", err);
      }
    }

    const media = req.file ? req.file.path : req.body.media;
    if (!media) {
      return res.status(400).json({ success: false, message: "Media required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const story = new Story({
      userId,
      userName: user.name,
      userPic: user.pic,
      media,
      mediaType: mediaType || 'image',
      caption: caption || "",
      captionPosition: captionPosition || 'center',
      captionColor: captionColor || 'white',
      visibility: visibility || 'public',
      allowedUsers: (visibility === 'private' && Array.isArray(allowedUsers)) ? allowedUsers : [],
      hiddenFrom: Array.isArray(hiddenFrom) ? hiddenFrom : [],
      song: song || null,
      stickers: Array.isArray(stickers) ? stickers : []
    });

    await story.save();
    console.log("SAVED STORY:", story.stickers);
    res.status(201).json({ success: true, message: "Story published", story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// React to Story
exports.reactToStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id || req.user.id;
    const { emoji } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const reactIdx = story.storyReactions.findIndex(r => r.userId?.toString() === userId.toString());
    const currentUser = await User.findById(userId).select("name username pic img");
    const io = req.app.get("io");
    
    if (reactIdx === -1) {
      story.storyReactions.push({ userId, emoji, reactedAt: new Date() });
      
      // Notify story owner
      if (story.userId.toString() !== userId.toString()) {
        const notification = await Notification.create({
          sender: userId,
          receiver: story.userId,
          type: "story_like",
          story: story._id,
          message: `${currentUser.name} reacted ${emoji} to your story.`
        });
        
        if (io) {
          io.to(story.userId.toString()).emit("story_reaction_update", {
            storyId: story._id,
            reaction: {
              userId: currentUser,
              emoji,
              reactedAt: new Date()
            }
          });
          io.to(story.userId.toString()).emit("new_notification", notification);
        }


        // Send a direct message
        const ChatRoom = require("../models/ChatRoom");
        const Message = require("../models/Message");

        let room = await ChatRoom.findOne({
          type: "direct",
          members: { $all: [userId, story.userId] }
        });

        if (!room) {
          const ownerUser = await User.findById(story.userId);
          room = new ChatRoom({
            name: ownerUser ? ownerUser.name : "Traveler",
            type: "direct",
            members: [userId, story.userId],
            requestStatus: "pending",
            requestedBy: userId
          });
          await room.save();
        }

        const message = new Message({
          roomId: room._id,
          sender: userId,
          senderName: currentUser.name,
          senderPic: currentUser.pic || currentUser.img,
          text: `Reacted to your story: ${emoji}`,
          unreadBy: [story.userId]
        });
        await message.save();

        room.updatedAt = new Date();
        await room.save();

        if (io) {
          io.to(room._id.toString()).emit("receive_chat_message", message);
        }
      }
    } else {
      story.storyReactions[reactIdx].emoji = emoji;
      story.storyReactions[reactIdx].reactedAt = new Date();
      
      if (io && story.userId.toString() !== userId.toString()) {
        io.to(story.userId.toString()).emit("story_reaction_update", {
          storyId: story._id,
          reaction: {
            userId: currentUser,
            emoji,
            reactedAt: new Date()
          }
        });
      }
    }

    await story.save();
    res.status(200).json({ success: true, message: "Reaction updated", storyReactions: story.storyReactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. GLOBAL SEARCH LOGIC ---

// Search travelers, posts, and travel groups
exports.globalSocialSearch = async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = req.user._id || req.user.id;

    if (!q || q.trim() === "") {
      return res.status(200).json({ success: true, travelers: [], trips: [], memories: [] });
    }

    const regex = new RegExp(q, "i");

    const [travelers, groups, posts] = await Promise.all([
      // Search Travelers by name, username, location (country), interests
      User.find({
        _id: { $ne: currentUserId },
        type: { $in: ["traveler", "Traveler"] },
        $or: [
          { name: { $regex: regex } },
          { username: { $regex: regex } },
          { country: { $regex: regex } },
          { interests: { $regex: regex } }
        ]
      })
      .select("name username pic img type isVerified rating completedTrips interests")
      .limit(10),

      // Search Groups by destination, title, category
      TravelGroup.find({
        $or: [
          { destination: { $regex: regex } },
          { title: { $regex: regex } },
          { category: { $regex: regex } }
        ]
      })
      .populate("host", "name username pic img isVerified")
      .limit(10),

      // Search Posts by caption, location, tags
      Post.find({
        $or: [
          { caption: { $regex: regex } },
          { location: { $regex: regex } },
          { tags: { $regex: regex } }
        ]
      })
      .populate("userId", "name username pic img isVerified")
      .limit(10)
    ]);

    // Map keys for compatibility with frontend components
    const mappedGroups = groups.map(g => {
      const gObj = g.toObject();
      gObj.userId = g.host;
      return gObj;
    });

    res.status(200).json({ success: true, travelers, trips: mappedGroups, memories: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. STORY REPLY (DM) ---

// Reply to a story — creates/finds direct DM room and sends the reply as a message
exports.replyToStory = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const storyOwnerId = req.params.storyUserId;
    const { text, storyId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }
    if (senderId.toString() === storyOwnerId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot reply to your own story" });
    }

    const senderUser = await User.findById(senderId);
    const ownerUser = await User.findById(storyOwnerId);
    if (!senderUser || !ownerUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get or create direct chat room
    let room = await ChatRoom.findOne({
      type: "direct",
      members: { $all: [senderId, storyOwnerId] }
    });

    if (!room) {
      room = new ChatRoom({
        name: ownerUser.name,
        type: "direct",
        members: [senderId, storyOwnerId]
      });
      await room.save();
    }

    const Message = require("../models/Message");
    const message = new Message({
      roomId: room._id,
      sender: senderId,
      senderName: senderUser.name,
      senderPic: senderUser.pic,
      text: `${text}`,
      unreadBy: [storyOwnerId]
    });
    await message.save();

    room.updatedAt = new Date();
    await room.save();

    // Notify story owner
    const notification = await Notification.create({
      sender: senderId,
      receiver: storyOwnerId,
      type: "story_reply",
      story: storyId || undefined,
      message: `${senderUser.name} replied to your story: "${text.substring(0, 40)}"`
    });

    const io = req.app.get("io");
    if (io) {
      io.to(storyOwnerId.toString()).emit("new_notification", notification);
      io.to(room._id.toString()).emit("receive_chat_message", message);
    }

    res.status(200).json({ success: true, message: "Story reply sent!", roomId: room._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. SETTINGS & ACCOUNT ---

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).populate("blockedUsers", "name username pic img");
    res.status(200).json({ success: true, blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.userId;

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
    await user.save();
    
    // Also remove from Block collection if it exists
    if (mongoose.models.Block) {
      await mongoose.model('Block').deleteOne({ blocker: userId, blocked: targetUserId });
    }

    res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    res.status(200).json({ success: true, contacts: user.emergencyContacts || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. GLOBAL SEARCH LOGIC ---

// Search travelers, posts, and travel groups
exports.globalSocialSearch = async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = req.user._id || req.user.id;

    if (!q || q.trim() === "") {
      return res.status(200).json({ success: true, travelers: [], trips: [], memories: [] });
    }

    const regex = new RegExp(q, "i");

    const [travelers, groups, posts] = await Promise.all([
      // Search Travelers by name, username, location (country), interests
      User.find({
        _id: { $ne: currentUserId },
        type: { $in: ["traveler", "Traveler"] },
        $or: [
          { name: { $regex: regex } },
          { username: { $regex: regex } },
          { country: { $regex: regex } },
          { interests: { $regex: regex } }
        ]
      })
      .select("name username pic img type isVerified rating completedTrips interests")
      .limit(10),

      // Search Groups by destination, title, category
      TravelGroup.find({
        $or: [
          { destination: { $regex: regex } },
          { title: { $regex: regex } },
          { category: { $regex: regex } }
        ]
      })
      .populate("host", "name username pic img isVerified")
      .limit(10),

      // Search Posts by caption, location, tags
      Post.find({
        $or: [
          { caption: { $regex: regex } },
          { location: { $regex: regex } },
          { tags: { $regex: regex } }
        ]
      })
      .populate("userId", "name username pic img isVerified")
      .limit(10)
    ]);

    // Map keys for compatibility with frontend components
    const mappedGroups = groups.map(g => {
      const gObj = g.toObject();
      gObj.userId = g.host;
      return gObj;
    });

    res.status(200).json({ success: true, travelers, trips: mappedGroups, memories: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. STORY REPLY (DM) ---

// Reply to a story — creates/finds direct DM room and sends the reply as a message
exports.replyToStory = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const storyOwnerId = req.params.storyUserId;
    const { text, storyId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }
    if (senderId.toString() === storyOwnerId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot reply to your own story" });
    }

    const senderUser = await User.findById(senderId);
    const ownerUser = await User.findById(storyOwnerId);
    if (!senderUser || !ownerUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get or create direct chat room
    let room = await ChatRoom.findOne({
      type: "direct",
      members: { $all: [senderId, storyOwnerId] }
    });

    if (!room) {
      room = new ChatRoom({
        name: ownerUser.name,
        type: "direct",
        members: [senderId, storyOwnerId]
      });
      await room.save();
    }

    const Message = require("../models/Message");
    let message = new Message({
      roomId: room._id,
      sender: senderId,
      senderName: senderUser.name,
      senderPic: senderUser.pic,
      text: `${text}`,
      storyId: storyId || undefined,
      unreadBy: [storyOwnerId]
    });
    await message.save();
    
    // Populate story to show in the reply
    if (storyId) {
      await message.populate("storyId", "media mediaType caption");
    }

    room.updatedAt = new Date();
    await room.save();

    // Notify story owner
    const notification = await Notification.create({
      sender: senderId,
      receiver: storyOwnerId,
      type: "story_reply",
      story: storyId || undefined,
      message: `${senderUser.name} replied to your story: "${text.substring(0, 40)}"`
    });

    const io = req.app.get("io");
    if (io) {
      io.to(storyOwnerId.toString()).emit("new_notification", notification);
      io.to(room._id.toString()).emit("receive_chat_message", message);
    }

    res.status(200).json({ success: true, message: "Story reply sent!", roomId: room._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. SETTINGS & ACCOUNT ---

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).populate("blockedUsers", "name username pic img");
    res.status(200).json({ success: true, blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.userId;

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
    await user.save();
    
    // Also remove from Block collection if it exists
    if (mongoose.models.Block) {
      await mongoose.model('Block').deleteOne({ blocker: userId, blocked: targetUserId });
    }

    res.status(200).json({ success: true, message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    res.status(200).json({ success: true, contacts: user.emergencyContacts || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (req.body.isPrimary) {
      user.emergencyContacts.forEach(c => c.isPrimary = false);
    }
    
    user.emergencyContacts.push(req.body);
    await user.save();
    res.status(201).json({ success: true, contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;
    const user = await User.findById(userId);
    
    const contact = user.emergencyContacts.id(contactId);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });
    
    if (req.body.isPrimary) {
      user.emergencyContacts.forEach(c => c.isPrimary = false);
    }
    
    Object.assign(contact, req.body);
    await user.save();
    
    res.status(200).json({ success: true, contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const contactId = req.params.id;
    const user = await User.findById(userId);
    
    user.emergencyContacts = user.emergencyContacts.filter(c => c._id.toString() !== contactId.toString());
    await user.save();
    
    res.status(200).json({ success: true, contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Travel Group
exports.cancelTravelBuddyTrip = async (req, res) => {
  try {
    const trip = await TravelGroup.findById(req.params.id).populate('members.user');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    // Only host or admin can cancel
    if (trip.host.toString() !== (req.user._id || req.user.id).toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can cancel this trip.' });
    }

    if (trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Trip is already cancelled.' });
    }

    trip.status = 'cancelled';
    trip.isCancelled = true;
    trip.cancelledAt = new Date();
    trip.cancelledBy = req.user._id || req.user.id;
    trip.cancellationReason = req.body.cancellationReason || '';

    await trip.save();

    // Create notifications for all joined members
    if (trip.members && trip.members.length > 0) {
      const notifications = trip.members
        .filter(member => member._id.toString() !== (req.user._id || req.user.id).toString())
        .map(member => ({
          sender: req.user._id || req.user.id,
          receiver: member._id,
          type: 'trip_cancelled',
          group: trip._id,
          message: `The host has cancelled the travel group "${trip.title}".`
        }));
      
      if (notifications.length > 0) {
        const Notification = require('../models/Notification');
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({ success: true, message: 'Trip has been cancelled.', trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

  // Fix legacy members array format if needed
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
