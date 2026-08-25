const mongoose = require("mongoose");
const TravelGroup = require("../models/TravelGroup");
const User = require("../models/User");
const Post = require("../models/Post");
const JoinRequest = require("../models/JoinRequest");
const Notification = require("../models/Notification");
const ChatRoom = require("../models/ChatRoom");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyTimeline = require("../models/JourneyTimeline");
const {
  canJoinJourney,
  getUserActiveJourney,
  getOverlappingCommitment,
  hasOverlappingJourney,
  datesOverlap,
  getJourneyLifecycle
} = require("../services/journeyEligibility");
const { syncJourneyStatus } = require("./journeyLifecycleController");
const { isBlockedPair, getBlockedUserIds } = require("../utils/blockHelper");

const addJourneyMemberAtomic = async (journeyId, userId, role = "Member") => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.findByIdAndUpdate(userId, { $inc: { __v: 1 } }).session(session);

    let journey = await Journey.findById(journeyId).session(session);
    if (!journey) throw new Error("not_found");

    const eligibility = await canJoinJourney(userId, journey);
    if (!eligibility.allowed) {
      const err = new Error(eligibility.reason || "cannot_add");
      err.code = eligibility.code;
      throw err;
    }

    const updatedJourney = await Journey.findOneAndUpdate(
      {
        _id: journeyId,
        status: { $in: ["Planning", "Upcoming", "open"] },
        "members.user": { $ne: userId },
        $expr: { $lt: [{ $size: { $ifNull: ["$members", []] } }, "$maxMembers"] }
      },
      {
        $push: { members: { user: userId, role: role, joinedAt: new Date() } },
        $inc: { memberCount: 1 }
      },
      { new: true, session }
    );

    if (!updatedJourney) {
      const currentJourney = await Journey.findById(journeyId).session(session);
      if (currentJourney && currentJourney.members.length >= currentJourney.maxMembers) {
        throw new Error("capacity_full");
      } else {
        throw new Error("cannot_add");
      }
    }

    await JourneyMember.findOneAndUpdate(
      { journeyId: updatedJourney._id, userId },
      { status: "active", role: role, joinedAt: new Date() },
      { upsert: true, session }
    );

    if (updatedJourney.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(updatedJourney.chatRoomId, {
        $addToSet: { members: userId }
      }).session(session);
    }

    const user = await User.findById(userId).session(session);
    if (user) {
      await JourneyTimeline.create([{
        journeyId: updatedJourney._id,
        userId: userId,
        userName: user.name || user.username || "Traveler",
        userPic: user.profilePic || user.pic || "",
        eventType: "member_joined",
        title: "Member Joined",
        description: `${user.name || user.username || "A traveler"} joined the trip!`
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();
    return updatedJourney;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

exports.createTravelBuddyTrip = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      title,
      destination,
      from,
      startDate,
      endDate,
      category,
      maxMembers,
      estimatedBudget,
      description,
      itinerary,
      coverImage,
      idempotencyKey
    } = req.body;

    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, destination, start date, and end date are required"
      });
    }

    if (idempotencyKey) {
      const existingTrip = await TravelGroup.findOne({ _id: idempotencyKey });
      if (existingTrip) {
        const populatedExistingGroup = await TravelGroup.findById(existingTrip._id)
          .populate("host", "name username pic img avatar rating isVerified")
          .populate("members.user", "name username pic img avatar rating isVerified");
        return res.status(200).json({
          success: true,
          trip: populatedExistingGroup,
          group: populatedExistingGroup
        });
      }
    } else {
      const recentDuplicate = await TravelGroup.findOne({
        host: userId,
        title: title.trim(),
        destination: destination.trim(),
        createdAt: { $gte: new Date(Date.now() - 15000) }
      });

      if (recentDuplicate) {
        const populatedRecentGroup = await TravelGroup.findById(recentDuplicate._id)
          .populate("host", "name username pic img avatar rating isVerified")
          .populate("members.user", "name username pic img avatar rating isVerified");
        return res.status(200).json({
          success: true,
          trip: populatedRecentGroup,
          group: populatedRecentGroup
        });
      }
    }

    const groupPayload = {
      title: title.trim(),
      destination: destination.trim(),
      from: from ? from.trim() : "",
      startDate,
      endDate,
      category: category || "General",
      maxMembers: maxMembers || 10,
      estimatedBudget: estimatedBudget || "Budget Flexible",
      description: description || "",
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      coverImage: coverImage || await imageService.fetchAutoCoverImage({ destination, title, category }),
      host: userId,
      members: [{ user: userId, role: "host", joinedAt: new Date() }],
      status: "open",
      lifecycleStatus: "active"
    };

    if (idempotencyKey) {
      groupPayload._id = idempotencyKey;
    }

    const group = new TravelGroup(groupPayload);

    await group.save();

    const chatRoom = new ChatRoom({
      name: group.title,
      type: "group",
      travelGroupId: group._id,
      members: [userId],
      requestStatus: "accepted"
    });
    await chatRoom.save();

    group.chatRoomId = chatRoom._id;
    await group.save();

    const populatedGroup = await TravelGroup.findById(group._id)
      .populate("host", "name username pic img avatar rating isVerified")
      .populate("members.user", "name username pic img avatar rating isVerified");

    res.status(201).json({
      success: true,
      trip: populatedGroup,
      group: populatedGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllTravelBuddyTrips = async (req, res) => {
  try {
    const {
      search,
      category,
      destination,
      status,
      lifecycleStatus,
      userId: queryUserId,
      exploreCity,
      exploreState,
      sortBy = "Starting Soon",
      page = 1,
      limit = 12
    } = req.query;

    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 12);
    const skip = (pageNum - 1) * limitNum;

    let filter = { isPrivate: { $ne: true } };
    let journeyFilter = {
      sourceType: "explore",
      $or: [{ privacy: "Public" }, { privacy: { $exists: false } }]
    };

    if (queryUserId) {
      filter.$or = [
        { host: queryUserId },
        { "members.user": queryUserId }
      ];
      journeyFilter.$or = [
        { creator: queryUserId },
        { "members.user": queryUserId }
      ];
    }

    const escapeRegex = (str) => String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (search) {
      const safeSearch = escapeRegex(search.trim());
      const searchConditions = [
        { title: { $regex: safeSearch, $options: "i" } },
        { destination: { $regex: safeSearch, $options: "i" } },
        { from: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } }
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: searchConditions });

      journeyFilter.$and = journeyFilter.$and || [];
      journeyFilter.$and.push({ $or: searchConditions });
    }

    if (category && category !== "all" && category !== "All") {
      filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
      journeyFilter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    if (destination) {
      const safeDest = escapeRegex(destination.trim());
      filter.destination = { $regex: safeDest, $options: "i" };
      journeyFilter.destination = { $regex: safeDest, $options: "i" };
    }

    if (exploreCity && exploreCity !== "none") {
      const safeCity = escapeRegex(exploreCity.trim());
      filter.from = { $regex: safeCity, $options: "i" };
      journeyFilter.from = { $regex: safeCity, $options: "i" };
    }

    const rawRequested = lifecycleStatus || status;
    let normalizedLifecycle = null;
    if (rawRequested && rawRequested !== "All" && rawRequested !== "all") {
      const s = String(rawRequested).trim().toLowerCase().replace(/[-_]/g, " ");
      if (s === "active" || s === "active now" || s === "ongoing" || s === "in progress") {
        normalizedLifecycle = "active";
      } else if (s === "upcoming" || s === "planning" || s === "starting soon") {
        normalizedLifecycle = "upcoming";
      } else if (s === "completed" || s === "finished") {
        normalizedLifecycle = "completed";
      } else if (s === "cancelled" || s === "canceled") {
        normalizedLifecycle = "cancelled";
      }
    }

    if (normalizedLifecycle === "cancelled") {
      filter.status = "cancelled";
      journeyFilter.$or = [
        { status: "Cancelled" },
        { status: "cancelled" },
        { isCancelled: true }
      ];
    } else if (normalizedLifecycle === "completed") {
      filter.$or = [
        { status: "completed" },
        { endDate: { $lt: new Date() } }
      ];
      filter.status = { $ne: "cancelled" };
      journeyFilter.$or = [
        { status: { $in: ["Completed", "completed"] } },
        { endDate: { $lt: new Date() } }
      ];
      journeyFilter.status = { $nin: ["Cancelled", "cancelled"] };
      journeyFilter.isCancelled = { $ne: true };
    } else if (normalizedLifecycle === "active") {
      filter.status = { $in: ["open", "active"] };
      filter.startDate = { $lte: new Date() };
      filter.endDate = { $gte: new Date() };
      journeyFilter.$or = [
        { status: { $in: ["Ongoing", "ongoing", "Active", "active"] } },
        { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }
      ];
      journeyFilter.status = { $nin: ["Cancelled", "cancelled", "Completed", "completed"] };
      journeyFilter.isCancelled = { $ne: true };
    } else if (normalizedLifecycle === "upcoming") {
      filter.status = { $in: ["open", "active"] };
      filter.startDate = { $gt: new Date() };
      journeyFilter.$or = [
        { status: { $in: ["Upcoming", "upcoming", "Planning", "planning"] } },
        { startDate: { $gt: new Date() } }
      ];
      journeyFilter.status = { $nin: ["Cancelled", "cancelled", "Completed", "completed"] };
      journeyFilter.isCancelled = { $ne: true };
    }

    if (currentUserId) {
      const { objectIds: blockedObjectIds } = await getBlockedUserIds(currentUserId);
      if (blockedObjectIds && blockedObjectIds.length > 0) {
        filter.host = { $nin: blockedObjectIds };
        journeyFilter.creator = { $nin: blockedObjectIds };
      }
    }

    const populateFields = [
      { path: "host", select: "name username pic img avatar rating isVerified type city state" },
      { path: "members.user", select: "name username pic img avatar rating isVerified type city state" }
    ];

    const journeyPopulateFields = [
      { path: "creator", select: "name username pic img avatar rating isVerified type city state" },
      { path: "members.user", select: "name username pic img avatar rating isVerified type city state" }
    ];

    const [travelGroups, exploreJourneys] = await Promise.all([
      TravelGroup.find(filter).populate(populateFields).lean(),
      Journey.find(journeyFilter).populate(journeyPopulateFields).lean()
    ]);

    const now = new Date();

    const normalizeBackendLifecycle = (item) => {
      const rawStatus = String(item.status || "").trim().toLowerCase().replace(/[-_]/g, " ");
      const isCancelled =
        rawStatus === "cancelled" ||
        rawStatus === "canceled" ||
        rawStatus === "archived" ||
        item.isCancelled === true ||
        Boolean(item.cancelledAt);

      if (isCancelled) {
        return "cancelled";
      }

      if (rawStatus === "completed" || rawStatus === "finished" || rawStatus === "done") {
        return "completed";
      }

      const start = item.startDate ? new Date(item.startDate).getTime() : NaN;
      const end = item.endDate ? new Date(item.endDate).getTime() : NaN;
      const nowTime = now.getTime();

      if (!isNaN(end) && end < nowTime) {
        return "completed";
      }

      if (rawStatus === "upcoming" || rawStatus === "planning") {
        if (!isNaN(start) && !isNaN(end) && nowTime >= start && nowTime <= end) {
          return "active";
        }
        return "upcoming";
      }

      if (rawStatus === "ongoing" || rawStatus === "active" || rawStatus === "active now" || rawStatus === "in progress" || rawStatus === "open") {
        if (!isNaN(start) && start > nowTime && rawStatus === "open") {
          return "upcoming";
        }
        return "active";
      }

      if (!isNaN(start) && start > nowTime) {
        return "upcoming";
      }

      return "active";
    };

    const journeySourceIds = new Set(
      exploreJourneys.filter((j) => j.sourceId).map((j) => j.sourceId.toString())
    );
    const dedupedTravelGroups = travelGroups.filter(
      (tg) => !journeySourceIds.has((tg._id || tg.id).toString())
    );

    const mappedTravelGroups = dedupedTravelGroups.map((tg) => {
      const canonicalLifecycle = normalizeBackendLifecycle(tg);
      return {
        ...tg,
        isBuddyTrip: true,
        lifecycleStatus: canonicalLifecycle
      };
    });

    const mappedJourneys = exploreJourneys.map((j) => {
      const canonicalLifecycle = normalizeBackendLifecycle(j);
      return {
        ...j,
        host: j.creator,
        isBuddyTrip: true,
        status: canonicalLifecycle === "cancelled" ? "cancelled" : (canonicalLifecycle === "completed" ? "completed" : "open"),
        lifecycleStatus: canonicalLifecycle
      };
    });

    let allTrips = [...mappedTravelGroups, ...mappedJourneys];

    // Apply strict canonical lifecycle status filter
    if (normalizedLifecycle) {
      allTrips = allTrips.filter((t) => t.lifecycleStatus === normalizedLifecycle);
    } else {
      // For "all" / unfiltered explore feed, exclude cancelled journeys from general view
      allTrips = allTrips.filter((t) => t.lifecycleStatus !== "cancelled");
    }

    switch (sortBy) {
      case "Starting Soon":
        allTrips.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
          const aUpcoming = dateA >= now.getTime();
          const bUpcoming = dateB >= now.getTime();
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;
          return dateA - dateB;
        });
        break;
      case "Trending":
        allTrips.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        break;
      case "Popular":
      case "Most Travelers":
      case "Most Joined":
        allTrips.sort((a, b) => {
          const aCount = a.members?.length || a.memberCount || 0;
          const bCount = b.members?.length || b.memberCount || 0;
          return bCount - aCount;
        });
        break;
      case "Highest Rated":
        allTrips.sort((a, b) => {
          const aRating = a.host?.rating || a.creator?.rating || 0;
          const bRating = b.host?.rating || b.creator?.rating || 0;
          return bRating - aRating;
        });
        break;
      case "Newest":
      default:
        allTrips.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    const total = allTrips.length;
    const paginatedTrips = allTrips.slice(skip, skip + limitNum);
    const pages = Math.ceil(total / limitNum) || 1;
    const hasMore = pageNum < pages;

    res.status(200).json({
      success: true,
      trips: paginatedTrips,
      total,
      page: pageNum,
      pages,
      pagination: {
        total,
        page: pageNum,
        pages,
        hasMore,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error("Error in getAllTravelBuddyTrips:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLikedBuddyTrips = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const [travelGroups, journeys] = await Promise.all([
      TravelGroup.find({ likes: userId })
        .populate("host", "name username pic img avatar rating isVerified")
        .populate("members.user", "name username pic img avatar rating isVerified")
        .lean(),
      Journey.find({ likes: userId })
        .populate("creator", "name username pic img avatar rating isVerified")
        .populate("members.user", "name username pic img avatar rating isVerified")
        .lean()
    ]);

    const mappedJourneys = (journeys || []).map((j) => {
      const s = String(j.status || "").trim().toLowerCase();
      let mappedStatus = "open";
      let mappedLifecycle = "active";

      if (s === "cancelled" || j.isCancelled) {
        mappedStatus = "cancelled";
        mappedLifecycle = "cancelled";
      } else if (s === "completed") {
        mappedStatus = "completed";
        mappedLifecycle = "completed";
      } else if (s === "upcoming" || s === "planning") {
        mappedStatus = "open";
        mappedLifecycle = "upcoming";
      } else if (s === "ongoing") {
        mappedStatus = "open";
        mappedLifecycle = "active";
      }

      return {
        ...j,
        host: j.creator,
        isBuddyTrip: true,
        status: mappedStatus,
        lifecycleStatus: mappedLifecycle
      };
    });

    const journeySourceIds = new Set(
      (journeys || []).filter((j) => j.sourceId).map((j) => j.sourceId.toString())
    );
    const dedupedTravelGroups = (travelGroups || []).filter(
      (tg) => !journeySourceIds.has((tg._id || tg.id).toString())
    );

    const trips = [...dedupedTravelGroups, ...mappedJourneys];

    res.status(200).json({
      success: true,
      trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleLikeBuddyTrip = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    let trip = await TravelGroup.findById(req.params.id);

    if (!trip) {
      trip = await Journey.findById(req.params.id);
    }

    // Fallback: in case a Post ID was passed to buddy like
    if (!trip) {
      const post = await Post.findById(req.params.id);
      if (post) {
        if (!Array.isArray(post.likes)) {
          post.likes = [];
        }
        const hasLiked = post.likes.some(
          (id) => (id?._id || id)?.toString() === userId
        );
        if (hasLiked) {
          post.likes = post.likes.filter(
            (id) => (id?._id || id)?.toString() !== userId
          );
        } else {
          post.likes.push(new mongoose.Types.ObjectId(userId));
        }
        await post.save();
        return res.status(200).json({
          success: true,
          isLiked: !hasLiked,
          likesCount: post.likes.length,
          likes: post.likes,
          trip: post
        });
      }
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (!Array.isArray(trip.likes)) {
      trip.likes = [];
    }

    const hasLiked = trip.likes.some(
      (id) => (id?._id || id)?.toString() === userId
    );

    if (hasLiked) {
      trip.likes = trip.likes.filter(
        (id) => (id?._id || id)?.toString() !== userId
      );
    } else {
      trip.likes.push(new mongoose.Types.ObjectId(userId));
    }

    await trip.save();

    res.status(200).json({
      success: true,
      isLiked: !hasLiked,
      likesCount: trip.likes.length,
      likes: trip.likes,
      trip
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTravelBuddyTripById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    let trip = await TravelGroup.findById(req.params.id)
      .populate("host", "name username pic img avatar rating isVerified bio city state")
      .populate("members.user", "name username pic img avatar rating isVerified city state");

    if (!trip) {
      const journey = await Journey.findById(req.params.id)
        .populate("creator", "name username pic img avatar rating isVerified bio city state")
        .populate("members.user", "name username pic img avatar rating isVerified city state");
      
      if (journey) {
        const s = String(journey.status || "").trim().toLowerCase();
        let mappedStatus = "open";
        let mappedLifecycle = "active";

        if (s === "cancelled" || journey.isCancelled) {
          mappedStatus = "cancelled";
          mappedLifecycle = "cancelled";
        } else if (s === "completed") {
          mappedStatus = "completed";
          mappedLifecycle = "completed";
        } else if (s === "upcoming" || s === "planning") {
          mappedStatus = "open";
          mappedLifecycle = "upcoming";
        } else if (s === "ongoing") {
          mappedStatus = "open";
          mappedLifecycle = "active";
        }

        trip = {
          ...journey.toObject(),
          host: journey.creator,
          isBuddyTrip: true,
          status: mappedStatus,
          lifecycleStatus: mappedLifecycle
        };
      }
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    let joinRequestStatus = null;
    let joinRequests = [];

    if (userId) {
      const hostId = trip.host?._id || trip.host || trip.creator?._id || trip.creator;
      if (hostId && (await isBlockedPair(userId, hostId))) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      let existingRequest;
      const hostIdStr = hostId ? hostId.toString() : "";
      const isHost = hostIdStr === userId.toString();

      if (trip.sourceType === "explore" || trip.isBuddyTrip) {
        existingRequest = await JourneyJoinRequest.findOne({
          journeyId: trip._id,
          userId
        });
        if (isHost) {
          joinRequests = await JourneyJoinRequest.find({ journeyId: trip._id })
            .populate("userId", "name username pic img avatar rating isVerified city state");
        }
      } else {
        existingRequest = await JoinRequest.findOne({
          groupId: trip._id,
          userId
        });
        if (isHost) {
          joinRequests = await JoinRequest.find({ groupId: trip._id })
            .populate("userId", "name username pic img avatar rating isVerified city state");
        }
      }

      if (existingRequest) {
        joinRequestStatus = existingRequest.status;
      }
    }

    res.status(200).json({
      success: true,
      trip: {
        ...(typeof trip.toObject === 'function' ? trip.toObject() : trip),
        joinRequestStatus,
        joinRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestToJoinTrip = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groupId = req.params.id;
    const { note } = req.body;

    let journey = await Journey.findById(groupId);
    if (journey) {
      const isBlocked = await isBlockedPair(userId, journey.creator);
      if (isBlocked) {
        return res.status(403).json({ success: false, message: "Cannot join trip with a blocked user" });
      }

      journey = await syncJourneyStatus(journey);
      const eligibility = await canJoinJourney(userId, journey);
      if (eligibility.allowed === false) {
        return res.status(400).json({
          success: false,
          code: eligibility.code,
          message: eligibility.reason
        });
      }

      const isPublic = journey.isExplorePrivate === false;

      if (isPublic) {
        try {
          await addJourneyMemberAtomic(journey._id, userId);
          return res.status(200).json({
            success: true,
            message: "Joined successfully",
            status: "accepted"
          });
        } catch (err) {
          if (err.message === "capacity_full") {
            return res.status(400).json({ success: false, code: "CAPACITY_FULL", message: "Journey has reached maximum capacity" });
          }
          return res.status(400).json({ success: false, message: "Could not join journey (may be inactive or you are already a member)" });
        }
      } else {
        let existingReq = await JourneyJoinRequest.findOne({ journeyId: journey._id, userId });
        if (existingReq) {
          if (existingReq.status === "pending") {
            return res.status(400).json({ success: false, message: "Join request already pending" });
          }
          existingReq.status = "pending";
          existingReq.message = note || "";
          await existingReq.save();
        } else {
          existingReq = new JourneyJoinRequest({
            journeyId: journey._id,
            userId,
            message: note || "",
            status: "pending"
          });
          await existingReq.save();
        }

        const senderUser = await User.findById(userId);
        await Notification.create({
          sender: userId,
          receiver: journey.creator,
          type: "journey_join_request",
          journey: journey._id,
          journeyJoinRequest: existingReq._id,
          message: `${senderUser?.name || senderUser?.username || "A traveler"} requested to join your journey "${journey.title}"`
        });

        return res.status(200).json({
          success: true,
          message: "Join request sent successfully",
          request: existingReq
        });
      }
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isBlocked = await isBlockedPair(userId, trip.host);
    if (isBlocked) {
      return res.status(403).json({ success: false, message: "Cannot join trip with a blocked user" });
    }

    if (trip.status === "cancelled" || trip.isCancelled) {
      return res.status(400).json({ success: false, message: "Cannot join a cancelled trip" });
    }

    const isMember = trip.members.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );
    if (isMember) {
      return res.status(400).json({ success: false, message: "You are already a member of this trip" });
    }

    if (trip.members.length >= trip.maxMembers) {
      return res.status(400).json({ success: false, code: "CAPACITY_FULL", message: "Trip has reached maximum capacity" });
    }

    const overlappingCommitment = await getOverlappingCommitment(userId, trip.startDate, trip.endDate, trip._id);
    if (overlappingCommitment) {
      const conflictLifecycle = getJourneyLifecycle(overlappingCommitment);
      if (conflictLifecycle.isOngoing) {
        return res.status(400).json({
          success: false,
          code: "ACTIVE_JOURNEY_CONFLICT",
          message: "You're currently on an active journey that overlaps with this trip. Complete your current trip before joining this journey."
        });
      }
      return res.status(400).json({
        success: false,
        code: "OVERLAPPING_JOURNEY",
        message: "You already have another journey during these dates."
      });
    }

    let existingRequest = await JoinRequest.findOne({ groupId, userId });
    if (existingRequest) {
      if (existingRequest.status === "Pending") {
        return res.status(400).json({ success: false, message: "Join request already pending" });
      }
      existingRequest.status = "Pending";
      existingRequest.note = note || "";
      await existingRequest.save();
    } else {
      existingRequest = new JoinRequest({
        groupId,
        userId,
        hostId: trip.host,
        note: note || "",
        status: "Pending"
      });
      await existingRequest.save();
    }

    const senderUser = await User.findById(userId);
    await Notification.create({
      sender: userId,
      receiver: trip.host,
      type: "join_request",
      group: trip._id,
      message: `${senderUser?.name || senderUser?.username || "A traveler"} requested to join "${trip.title}"`
    });

    res.status(200).json({
      success: true,
      message: "Join request sent successfully",
      request: existingRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.manageJoinRequest = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;
    const { requestId, action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'reject'" });
    }

    let journeyReq = await JourneyJoinRequest.findById(requestId);
    if (journeyReq) {
      let journey = await Journey.findById(journeyReq.journeyId);
      if (!journey) return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Associated journey not found" });

      if (journey.creator.toString() !== hostId.toString() && !req.user.isAdmin) {
        return res.status(403).json({ success: false, code: "NOT_HOST", message: "Not authorized to manage join requests" });
      }

      if (action === "accept") {
        journey = await syncJourneyStatus(journey);
        const eligibility = await canJoinJourney(journeyReq.userId, journey);
        if (eligibility.allowed === false) {
          return res.status(400).json({
            success: false,
            code: eligibility.code,
            message: eligibility.reason
          });
        }

        try {
          await addJourneyMemberAtomic(journey._id, journeyReq.userId);
          
          journeyReq.status = "accepted";
          await journeyReq.save();

          await Notification.create({
            sender: hostId,
            receiver: journeyReq.userId,
            type: "journey_join_request_accepted",
            journey: journey._id,
            message: `Your request to join "${journey.title}" was accepted!`
          });

          return res.status(200).json({ success: true, message: "Join request accepted" });
        } catch (err) {
          if (err.message === "capacity_full") {
            journeyReq.status = "capacity_full";
            await journeyReq.save();
            await Notification.create({
              sender: hostId,
              receiver: journeyReq.userId,
              type: "journey_join_request_rejected",
              journey: journey._id,
              message: `Your request to join "${journey.title}" was not accepted because the journey has reached its capacity.`
            });
            return res.status(400).json({ success: false, code: "CAPACITY_FULL", message: "Journey is at full capacity" });
          }
          return res.status(400).json({ success: false, message: "Could not add member" });
        }
      } else {
        journeyReq.status = "rejected";
        await journeyReq.save();

        await Notification.create({
          sender: hostId,
          receiver: journeyReq.userId,
          type: "journey_join_request_rejected",
          journey: journey._id,
          message: `Your request to join "${journey.title}" was rejected.`
        });
        return res.status(200).json({ success: true, message: "Join request rejected" });
      }
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Join request not found" });
    }

    const trip = await TravelGroup.findById(request.groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Associated trip not found" });
    }

    if (trip.host.toString() !== hostId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to manage join requests for this trip" });
    }

    if (action === "accept") {
      const overlappingCommitment = await getOverlappingCommitment(request.userId, trip.startDate, trip.endDate, trip._id);
      if (overlappingCommitment) {
        const conflictLifecycle = getJourneyLifecycle(overlappingCommitment);
        if (conflictLifecycle.isOngoing) {
          return res.status(400).json({
            success: false,
            code: "ACTIVE_JOURNEY_CONFLICT",
            message: "This traveler is currently on an active journey that overlaps with this trip."
          });
        }
        return res.status(400).json({
          success: false,
          code: "OVERLAPPING_JOURNEY",
          message: "This traveler already has another journey during these dates."
        });
      }

      const updatedTrip = await TravelGroup.findOneAndUpdate(
        {
          _id: trip._id,
          "members.user": { $ne: request.userId },
          $expr: { $lt: [{ $size: { $ifNull: ["$members", []] } }, "$maxMembers"] }
        },
        {
          $push: { members: { user: request.userId, role: "member", joinedAt: new Date() } }
        },
        { new: true }
      );

      if (!updatedTrip) {
        const checkTrip = await TravelGroup.findById(trip._id);
        if (checkTrip && checkTrip.members.length >= checkTrip.maxMembers) {
          return res.status(400).json({ success: false, message: "Trip is already at maximum capacity" });
        }
      } else {
        if (updatedTrip.chatRoomId) {
          await ChatRoom.findByIdAndUpdate(updatedTrip.chatRoomId, {
            $addToSet: { members: request.userId }
          });
        }
      }

      request.status = "Approved";
      await request.save();

      await Notification.create({
        sender: hostId,
        receiver: request.userId,
        type: "request_accept",
        group: trip._id,
        message: `Your request to join "${trip.title}" was accepted!`
      });

      res.status(200).json({
        success: true,
        message: "Join request accepted",
        trip
      });
    } else {
      request.status = "Rejected";
      await request.save();

      await Notification.create({
        sender: hostId,
        receiver: request.userId,
        type: "request_reject",
        group: trip._id,
        message: `Your request to join "${trip.title}" was declined.`
      });

      res.status(200).json({
        success: true,
        message: "Join request rejected"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.leaveTravelBuddyTrip = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    let journey = await Journey.findById(groupId);
    if (journey) {
      const isCreator = journey.creator.toString() === userId.toString();
      const otherActiveMembers = journey.members.filter(
        (m) => (m.user?._id || m.user).toString() !== userId.toString()
      );

      if (isCreator) {
        if (otherActiveMembers.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Host cannot leave while active members remain. Transfer host role or cancel the journey."
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "You are the host and there are no other active members. Please cancel the journey instead."
          });
        }
      }

      journey.members = otherActiveMembers;
      journey.memberCount = journey.members.length;
      await journey.save();

      await JourneyMember.findOneAndUpdate(
        { journeyId: journey._id, userId },
        { status: "left", role: "Member" },
        { upsert: true }
      );

      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
          $pull: { members: userId }
        });
      }

      const user = await User.findById(userId);
      if (user) {
        await JourneyTimeline.create({
          journeyId: journey._id,
          userId,
          userName: user.name || "Traveler",
          userPic: user.profilePic || "",
          eventType: "member_left",
          title: "Member Left",
          description: `${user.name || "A traveler"} left the journey.`
        });
      }

      return res.status(200).json({ success: true, message: "Successfully left the journey" });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isHost = trip.host.toString() === userId.toString();
    const activeMembers = trip.members.filter(
      (m) => (m.user?._id || m.user).toString() !== userId.toString()
    );

    if (isHost && activeMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Host cannot leave while active members remain. Transfer host role or cancel the trip."
      });
    }

    trip.members = activeMembers;
    if (isHost && activeMembers.length === 0) {
      trip.status = "cancelled";
      trip.isCancelled = true;
      trip.cancelledAt = new Date();
    }

    await trip.save();

    if (trip.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(trip.chatRoomId, {
        $pull: { members: userId }
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully left the trip"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTravelBuddyTrip = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      if (journey.creator.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this trip" });
      }
      await Journey.findByIdAndDelete(groupId);
      await JourneyJoinRequest.deleteMany({ journeyId: groupId });
      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndDelete(journey.chatRoomId);
      }
      return res.status(200).json({
        success: true,
        message: "Trip deleted successfully"
      });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.host.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this trip" });
    }

    await TravelGroup.findByIdAndDelete(groupId);
    await JoinRequest.deleteMany({ groupId });

    if (trip.chatRoomId) {
      await ChatRoom.findByIdAndDelete(trip.chatRoomId);
    }

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelTravelBuddyTrip = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      if (journey.creator.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Only the host can cancel this trip" });
      }

      journey.status = "Cancelled";
      journey.isCancelled = true;
      journey.cancelledAt = new Date();
      journey.cancelledBy = userId;
      await journey.save();

      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
          $set: { status: "closed" }
        });
      }

      return res.status(200).json({
        success: true,
        message: "Trip cancelled successfully",
        trip: journey
      });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.host.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Only the host can cancel this trip" });
    }

    trip.status = "cancelled";
    trip.isCancelled = true;
    trip.cancelledAt = new Date();
    trip.cancelledBy = userId;
    await trip.save();

    if (trip.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(trip.chatRoomId, {
        $set: { status: "closed" }
      });
    }

    res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
      trip
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      const isOrganizer = journey.creator.toString() === hostId.toString() ||
                          journey.members.some(m => (m.user?._id || m.user).toString() === hostId.toString() && (m.role === "Organizer" || m.role === "Co-Organizer"));

      if (!isOrganizer && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized to remove members" });
      }

      if (journey.creator.toString() === memberId.toString()) {
        return res.status(403).json({ success: false, message: "Cannot remove the journey creator" });
      }

      journey.members = journey.members.filter(
        (m) => (m.user?._id || m.user).toString() !== memberId.toString()
      );
      journey.memberCount = journey.members.length;
      await journey.save();

      await JourneyMember.findOneAndUpdate(
        { journeyId: journey._id, userId: memberId },
        { status: "removed" }
      );

      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
          $pull: { members: memberId }
        });
      }
      return res.status(200).json({ success: true, message: "Member removed" });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    if (trip.host.toString() !== hostId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    trip.members = trip.members.filter(
      (m) => (m.user?._id || m.user).toString() !== memberId.toString()
    );
    await trip.save();

    if (trip.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(trip.chatRoomId, {
        $pull: { members: memberId }
      });
    }

    res.status(200).json({ success: true, message: "Member removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.banMember = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      const isOrganizer = journey.creator.toString() === hostId.toString() ||
                          journey.members.some(m => (m.user?._id || m.user).toString() === hostId.toString() && (m.role === "Organizer" || m.role === "Co-Organizer"));
      if (!isOrganizer && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      journey.members = journey.members.filter(
        (m) => (m.user?._id || m.user).toString() !== memberId.toString()
      );
      journey.memberCount = journey.members.length;
      await journey.save();

      await JourneyMember.findOneAndUpdate(
        { journeyId: journey._id, userId: memberId },
        { status: "removed" }
      );

      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
          $pull: { members: memberId }
        });
      }
      return res.status(200).json({ success: true, message: "Member banned" });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    if (trip.host.toString() !== hostId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    trip.members = trip.members.filter(
      (m) => (m.user?._id || m.user).toString() !== memberId.toString()
    );
    trip.bannedMembers = trip.bannedMembers || [];
    if (!trip.bannedMembers.includes(memberId)) {
      trip.bannedMembers.push(memberId);
    }
    await trip.save();

    if (trip.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(trip.chatRoomId, {
        $pull: { members: memberId }
      });
    }

    res.status(200).json({ success: true, message: "Member banned" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.promoteMember = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      if (journey.creator.toString() !== hostId.toString() && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const member = journey.members.find(
        (m) => (m.user?._id || m.user).toString() === memberId.toString()
      );
      if (member) {
        const isCoHost = member.role === "Co-Organizer";
        member.role = isCoHost ? "Member" : "Co-Organizer";
        await journey.save();

        await JourneyMember.findOneAndUpdate(
          { journeyId: journey._id, userId: memberId },
          { role: member.role }
        );
        return res.status(200).json({ success: true, message: `Member ${isCoHost ? 'demoted' : 'promoted'}` });
      }
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    if (trip.host.toString() !== hostId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const member = trip.members.find(
      (m) => (m.user?._id || m.user).toString() === memberId.toString()
    );
    if (member) {
      const isCoHost = member.role === "cohost";
      member.role = isCoHost ? "member" : "cohost";
      await trip.save();
      return res.status(200).json({ success: true, message: `Member ${isCoHost ? 'demoted' : 'promoted'}` });
    }

    return res.status(404).json({ success: false, message: "Member not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendWarning = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;
    const { groupId, memberId } = req.params;
    const { message, reason } = req.body;
    const warningReason = (reason || message || "").trim();

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid ID format" });
    }

    if (!warningReason || warningReason.length < 3) {
      return res.status(400).json({
        success: false,
        code: "INVALID_WARNING",
        message: "Please provide a valid warning reason (at least 3 characters)."
      });
    }

    if (hostId.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        code: "INVALID_WARNING",
        message: "You cannot send a warning to yourself."
      });
    }

    // Check TravelGroup first
    let trip = await TravelGroup.findById(groupId);
    if (!trip) {
      // Check Journey if not found in TravelGroup
      const journey = await Journey.findById(groupId).populate("creator", "name username");
      if (journey) {
        const hostIdStr = (journey.creator?._id || journey.creator).toString();
        const isHost = hostIdStr === hostId.toString();
        const isCoLeader = (journey.members || []).some(
          (m) => (m.user?._id || m.user).toString() === hostId.toString() && m.role === "Co-Organizer"
        );

        if (!isHost && !isCoLeader && !req.user.isAdmin) {
          return res.status(403).json({
            success: false,
            code: "UNAUTHORIZED_WARNING",
            message: "Only the journey host or co-leader can send warnings."
          });
        }

        const isMember = (journey.members || []).some(
          (m) => (m.user?._id || m.user).toString() === memberId.toString()
        );

        if (!isMember) {
          return res.status(404).json({
            success: false,
            code: "MEMBER_NOT_FOUND",
            message: "Member not found in this journey."
          });
        }

        const targetUser = await User.findById(memberId).select("name");
        const targetName = targetUser?.name || "Traveler";

        const notification = await Notification.create({
          sender: hostId,
          receiver: memberId,
          type: "warning",
          category: "Safety",
          journey: journey._id,
          journeyModel: "Journey",
          message: `Warning from ${isHost ? "journey host" : "journey co-leader"} of "${journey.title}": ${warningReason}`,
          metadata: {
            journeyId: journey._id,
            journeyTitle: journey.title,
            reason: warningReason
          }
        });

        const io = req.app.get("io");
        if (io) {
          io.to(memberId.toString()).emit("new_notification", notification);
        }

        return res.status(200).json({
          success: true,
          code: "WARNING_SENT",
          message: `Warning sent successfully to ${targetName}.`
        });
      }

      return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found." });
    }

    // TravelGroup logic
    const hostIdStr = (trip.host?._id || trip.host).toString();
    const isHost = hostIdStr === hostId.toString();
    const isCoLeader = (trip.members || []).some(
      (m) => (m.user?._id || m.user).toString() === hostId.toString() && (m.role === "cohost" || m.role === "Co-Organizer")
    );

    if (!isHost && !isCoLeader && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        code: "UNAUTHORIZED_WARNING",
        message: "Only the trip host or co-host can send warnings."
      });
    }

    if (trip.status === "completed" || trip.status === "cancelled" || trip.isCancelled) {
      return res.status(400).json({
        success: false,
        code: "INVALID_WARNING",
        message: "Cannot send warnings on completed or cancelled trips."
      });
    }

    if (hostIdStr === memberId.toString()) {
      return res.status(400).json({
        success: false,
        code: "INVALID_WARNING",
        message: "Cannot send a warning to the trip host."
      });
    }

    const isMember = (trip.members || []).some(
      (m) => (m.user?._id || m.user).toString() === memberId.toString()
    );
    if (!isMember) {
      return res.status(404).json({
        success: false,
        code: "MEMBER_NOT_FOUND",
        message: "Member not found in this group."
      });
    }

    const targetUser = await User.findById(memberId).select("name");
    const targetName = targetUser?.name || "Traveler";

    trip.warnings = trip.warnings || [];
    trip.warnings.push({
      user: memberId,
      message: warningReason,
      createdAt: new Date()
    });
    await trip.save();

    const notification = await Notification.create({
      sender: hostId,
      receiver: memberId,
      type: "warning",
      category: "Safety",
      group: trip._id,
      message: `Warning from trip host of "${trip.title}": ${warningReason}`,
      metadata: {
        groupId: trip._id,
        groupTitle: trip.title,
        reason: warningReason
      }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(memberId.toString()).emit("new_notification", notification);
      io.to(memberId.toString()).emit("trip_warning", {
        groupId: trip._id,
        groupTitle: trip.title,
        reason: warningReason,
        sentAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      code: "WARNING_SENT",
      message: `Warning sent successfully to ${targetName}.`
    });
  } catch (error) {
    console.error("sendWarning error:", error);
    return res.status(500).json({
      success: false,
      code: "WARNING_FAILED",
      message: error.message || "Failed to send warning."
    });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      return res.status(200).json({
        success: true,
        activityLogs: journey.activityLogs || []
      });
    }

    const trip = await TravelGroup.findById(groupId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    res.status(200).json({
      success: true,
      activityLogs: trip.activityLogs || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelJoinRequest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groupId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid trip ID format" });
    }

    const journey = await Journey.findById(groupId);
    if (journey) {
      const existingReq = await JourneyJoinRequest.findOne({
        journeyId: journey._id,
        userId: userId,
        status: "pending"
      });
      
      if (!existingReq) {
        return res.status(404).json({ success: false, message: "No pending join request found" });
      }
      
      existingReq.status = "cancelled";
      await existingReq.save();
      
      return res.status(200).json({ success: true, message: "Join request cancelled successfully" });
    }
    
    const trip = await TravelGroup.findById(groupId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    
    // For legacy TravelGroup, delete the pending request since there is no "Cancelled" enum status
    const result = await JoinRequest.deleteOne({
      groupId,
      userId,
      status: "Pending"
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "No pending join request found" });
    }
    
    return res.status(200).json({ success: true, message: "Join request cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const normalizeTravelDiscoveryItem = (item, source) => {
  const isJourney = source === "journey";
  const owner = isJourney ? item.creator : item.host;
  const members = item.members || [];

  // Compute lifecycle from actual dates — do NOT rely on status field alone
  const now = new Date();
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  let lifecycle = "upcoming";
  if (startDate && endDate) {
    if (endDate < now) lifecycle = "completed";
    else if (startDate <= now && endDate >= now) lifecycle = "ongoing";
    else if (startDate > now) lifecycle = "upcoming";
  }

  return {
    id: (item._id || item.id).toString(),
    type: source,
    title: item.title || "",
    origin: item.from || "",
    destination: item.destination || "",
    startDate: item.startDate,
    endDate: item.endDate,
    lifecycle,
    coverImage: item.coverImage || "",
    category: item.category || "",
    maxMembers: item.maxMembers || 0,
    participantCount: members.length,
    owner: owner
      ? {
          _id: owner._id || owner,
          name: owner.name || "",
          username: owner.username || "",
          pic: owner.pic || "",
          img: owner.img || "",
          avatar: owner.avatar || "",
          rating: owner.rating || 0,
          isVerified: owner.isVerified || false
        }
      : null,
    source,
    _id: (item._id || item.id).toString(),
    host: owner,
    creator: owner,
    members: members,
    from: item.from || "",
    likes: item.likes || [],
    allowJoinAfterStart: item.allowJoinAfterStart != null ? item.allowJoinAfterStart : true,
    lifecycleStatus: lifecycle === "ongoing" ? "active" : lifecycle
  };
};

const normalizeDestinationKey = (dest) => {
  if (!dest || typeof dest !== "string") return "";
  return dest
    .trim()
    .replace(/\s+/g, " ")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

exports.getActiveTravelsByLocation = async (req, res) => {
  try {
    const currentUserId = req.user ? (req.user._id || req.user.id) : null;
    const { city, state, scope = "all" } = req.query;

    const validScopes = ["city", "state", "all"];
    if (!validScopes.includes(scope)) {
      return res.status(400).json({
        success: false,
        message: `Invalid scope. Must be one of: ${validScopes.join(", ")}`
      });
    }
    if (scope === "city" && !city) {
      return res.status(400).json({
        success: false,
        message: "city parameter is required when scope is 'city'"
      });
    }
    if (scope === "state" && !state) {
      return res.status(400).json({
        success: false,
        message: "state parameter is required when scope is 'state'"
      });
    }

    const now = new Date();
    const escapeRegex = (str) =>
      String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let locationRegex = null;
    if (scope === "city" && city) {
      locationRegex = new RegExp(escapeRegex(city.trim()), "i");
    } else if (scope === "state" && state) {
      locationRegex = new RegExp(escapeRegex(state.trim()), "i");
    }

    const tgFilter = {
      status: { $in: ["open", "active", "full"] },
      endDate: { $gte: now },
      isPrivate: { $ne: true }
    };
    if (locationRegex) {
      tgFilter.$or = [
        { from: locationRegex },
        { destination: locationRegex }
      ];
    }

    const jFilter = {
      sourceType: "explore",
      status: { $in: ["Planning", "Upcoming", "Ongoing"] },
      endDate: { $gte: now },
      isExplorePrivate: { $ne: true }
    };
    const jAnd = [
      { $or: [{ privacy: "Public" }, { privacy: { $exists: false } }] }
    ];
    if (locationRegex) {
      jAnd.push({
        $or: [
          { from: locationRegex },
          { destination: locationRegex }
        ]
      });
    }
    jFilter.$and = jAnd;

    const populateOwner = "name username pic img avatar rating isVerified";
    const [travelGroups, journeys] = await Promise.all([
      TravelGroup.find(tgFilter)
        .populate("host", populateOwner)
        .populate("members.user", populateOwner)
        .sort({ startDate: 1, createdAt: -1 })
        .lean(),
      Journey.find(jFilter)
        .populate("creator", populateOwner)
        .populate("members.user", populateOwner)
        .sort({ startDate: 1, createdAt: -1 })
        .lean()
    ]);

    let blockedSet = new Set();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select("blockedUsers");
      if (currentUser?.blockedUsers?.length > 0) {
        blockedSet = new Set(currentUser.blockedUsers.map((id) => id.toString()));
      }
    }

    const filteredTG = travelGroups.filter((tg) => {
      const hostId = (tg.host?._id || tg.host)?.toString();
      return !(hostId && blockedSet.has(hostId));
    });

    const filteredJ = journeys.filter((j) => {
      const creatorId = (j.creator?._id || j.creator)?.toString();
      return !(creatorId && blockedSet.has(creatorId));
    });

    const journeySourceIds = new Set(
      filteredJ.filter((j) => j.sourceId).map((j) => j.sourceId.toString())
    );
    const dedupedTG = filteredTG.filter(
      (tg) => !journeySourceIds.has((tg._id || tg.id).toString())
    );

    const normalizedTrips = [
      ...dedupedTG.map((tg) => normalizeTravelDiscoveryItem(tg, "travelgroup")),
      ...filteredJ.map((j) => normalizeTravelDiscoveryItem(j, "journey"))
    ];

    const validTrips = normalizedTrips.filter(
      (t) => t.endDate && new Date(t.endDate) >= now
    );

    const lifecycleOrder = { ongoing: 0, upcoming: 1 };
    validTrips.sort((a, b) => {
      const orderA = lifecycleOrder[a.lifecycle] ?? 2;
      const orderB = lifecycleOrder[b.lifecycle] ?? 2;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    const groupMap = {};
    validTrips.forEach((trip) => {
      const destKey = normalizeDestinationKey(trip.destination);
      if (!destKey) return;
      if (!groupMap[destKey]) {
        groupMap[destKey] = { destination: destKey, tripCount: 0, trips: [] };
      }
      groupMap[destKey].tripCount += 1;
      groupMap[destKey].trips.push(trip);
    });

    const locationGroups = Object.values(groupMap).sort((a, b) => {
      if (b.tripCount !== a.tripCount) return b.tripCount - a.tripCount;
      return a.destination.localeCompare(b.destination);
    });

    const responseLocation = {};
    if (city) responseLocation.city = city;
    if (state) responseLocation.state = state;

    res.status(200).json({
      success: true,
      scope,
      location: Object.keys(responseLocation).length > 0 ? responseLocation : null,
      summary: {
        totalTrips: validTrips.length,
        totalDestinations: locationGroups.length
      },
      locationGroups: locationGroups.map((g) => ({
        destination: g.destination,
        tripCount: g.tripCount
      })),
      trips: validTrips
    });
  } catch (error) {
    console.error("[ActiveTravelsByLocation] Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
