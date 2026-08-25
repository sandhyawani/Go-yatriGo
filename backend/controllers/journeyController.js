const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyTimeline = require("../models/JourneyTimeline");
const JourneyWorkspace = require("../models/JourneyWorkspace");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyMemory = require("../models/JourneyMemory");
const JourneyGallery = require("../models/JourneyGallery");
const Notification = require("../models/Notification");
const ChatRoom = require("../models/ChatRoom");
const Post = require("../models/Post");
const Story = require("../models/Story");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");
const imageService = require("../utils/imageService");

exports.getAutoCoverPreview = async (req, res) => {
  try {
    const { destination, title, category } = req.query;
    if (!destination) {
      return res.status(400).json({ success: false, message: "Destination is required" });
    }
    const imageUrls = await imageService.fetchAutoCoverImages({ destination, title, category });
    res.json({ success: true, url: imageUrls[0], urls: imageUrls });
  } catch (error) {
    console.error("Error generating auto cover preview:", error);
    res.status(500).json({ success: false, message: "Server error fetching auto cover" });
  }
};

// Import domain sub-controllers
const journeyLifecycleController = require("./journeyLifecycleController");
const journeyHostController = require("./journeyHostController");
const journeyCancellationController = require("./journeyCancellationController");
const journeyMembershipController = require("./journeyMembershipController");

const { syncJourneyStatus } = journeyLifecycleController;

// ==========================================
// CORE JOURNEY CRUD & FETCHING
// ==========================================

exports.createJourney = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      title,
      description,
      coverImage,
      destination,
      from,
      destinationCoordinates,
      startDate,
      endDate,
      privacy,
      journeyType,
      maxMembers,
      sourceType,
      sourceId,
      invitedUserIds,
      category,
      budget,
      allowJoinAfterStart,
      isExplorePrivate,
      tags
    } = req.body;

    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const trimmedDestination = typeof destination === "string" ? destination.trim() : "";
    if (!trimmedDestination) {
      return res.status(400).json({ success: false, message: "Destination is required" });
    }

    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ success: false, message: "Valid start date is required" });
    }

    if (!endDate || isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ success: false, message: "Valid end date is required" });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({ success: false, message: "End date cannot be earlier than start date" });
    }

    const validPrivacyEnums = ["Public", "Followers Only", "Friends Only", "Private"];
    if (privacy && !validPrivacyEnums.includes(privacy)) {
      return res.status(400).json({ success: false, message: "Invalid privacy setting" });
    }

    const validJourneyTypes = ["Solo", "Friends", "Group", "Solo Journey", "Shared Journey"];
    if (journeyType && !validJourneyTypes.includes(journeyType)) {
      return res.status(400).json({ success: false, message: "Invalid journey type" });
    }

    if (maxMembers !== undefined && (typeof maxMembers !== "number" || isNaN(maxMembers) || maxMembers < 1)) {
      return res.status(400).json({ success: false, message: "Capacity must be a positive number" });
    }

    const userId = req.user._id || req.user.id;

    const finalSourceType = sourceType || "manual";

    // Guard 1: If sourceId is itself an existing Journey._id, do not create a duplicate; return existing Journey
    if (sourceId && mongoose.isValidObjectId(sourceId)) {
      const existingJourneyById = await Journey.findById(sourceId).session(session);
      if (existingJourneyById) {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          message: "Journey created successfully",
          journey: existingJourneyById
        });
      }
    }
    
    // Guard 2: If an existing Journey was already converted from this source entity (e.g. TravelGroup), return it
    if (finalSourceType === "explore" && sourceId) {
      const existingJourney = await Journey.findOne({
        $or: [
          { sourceType: "explore", sourceId: sourceId },
          { sourceId: sourceId }
        ]
      }).session(session);
      if (existingJourney) {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          message: "Journey created successfully",
          journey: existingJourney
        });
      }
    }

    const { idempotencyKey } = req.body;
    if (idempotencyKey && mongoose.isValidObjectId(idempotencyKey)) {
      const existingKeyJourney = await Journey.findById(idempotencyKey).session(session);
      if (existingKeyJourney) {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          message: "Journey created successfully",
          journey: existingKeyJourney
        });
      }
    }

    const user = await User.findById(userId).session(session);
    let membersList = [{ user: userId, role: "Organizer", joinedAt: new Date() }];
    let chatMembers = [userId];

    let exploreGroupCoverImage = null;
    if (finalSourceType === "explore" && sourceId) {
      const exploreGroup = await TravelGroup.findById(sourceId).session(session);
      if (exploreGroup) {
        if (exploreGroup.coverImage) {
          exploreGroupCoverImage = exploreGroup.coverImage;
        }
        if (exploreGroup.members) {
          exploreGroup.members.forEach((m) => {
            const mIdStr = (m.user?._id || m.user).toString();
            if (mIdStr !== userId.toString()) {
              membersList.push({
                user: m.user?._id || m.user,
                role: m.role === "cohost" ? "Co-Organizer" : "Member",
                joinedAt: new Date()
              });
              chatMembers.push(m.user?._id || m.user);
            }
          });
        }
      }
    }

    const chatRoom = await ChatRoom.create([{
      name: title.trim(),
      type: "group",
      members: chatMembers
    }], { session });
    const chatRoomId = chatRoom[0]._id;

    const finalCoverImage = exploreGroupCoverImage || coverImage?.trim() || await imageService.fetchAutoCoverImage({ destination, title, category });

    const journeyPayload = {
      title: title.trim(),
      description,
      coverImage: finalCoverImage,
      destination: destination.trim(),
      from: from ? from.trim() : "",
      destinationCoordinates,
      startDate,
      endDate,
      privacy: privacy ? privacy : (finalSourceType === "manual" ? "Private" : "Public"),
      journeyType: journeyType || (membersList.length > 1 ? "Friends" : "Solo"),
      status: "Planning",
      sourceType: finalSourceType,
      sourceId: sourceId || null,
      createdFrom: finalSourceType === "explore" ? "Explore Travel Squad" : "Manual Creation",
      creator: userId,
      maxMembers: maxMembers || 50,
      members: membersList,
      memberCount: membersList.length,
      chatRoomId: chatRoomId,
      category: category || "Adventure",
      budget: budget || 0,
      allowJoinAfterStart: allowJoinAfterStart !== undefined ? allowJoinAfterStart : true,
      isExplorePrivate: isExplorePrivate !== undefined ? isExplorePrivate : false,
      tags: Array.isArray(tags) ? tags : []
    };

    if (idempotencyKey) {
      journeyPayload._id = idempotencyKey;
    }

    const newJourney = await Journey.create([journeyPayload], { session });

    await ChatRoom.findByIdAndUpdate(chatRoomId, { journeyId: newJourney[0]._id }).session(session);

    await JourneyMember.create(
    membersList.map((m) => ({
      journeyId: newJourney[0]._id,
      userId: m.user,
      role: m.role
    })),
    { session }
    );

    await JourneyTimeline.create([{
      journeyId: newJourney[0]._id,
      userId,
      userName: user ? user.name : "Organizer",
      userPic: user ? user.profilePic : "",
      eventType: "journey_created",
      title: "Journey Created",
      description: `Organized a new travel workspace for ${destination}`
    }], { session });

    if (finalSourceType !== "explore" && Array.isArray(invitedUserIds) && invitedUserIds.length > 0) {
      let validIds = invitedUserIds.filter((id) => id && id.toString() !== userId.toString());

      const filteredIds = [];
      for (const invId of validIds) {
        const targetUser = await User.findById(invId);
        if (targetUser) {
          const mode = targetUser.privacySettings?.journeyInvites || "everyone";
          if (mode === "none") continue;
          if (mode === "mates_only") {
            const isMate = targetUser.following?.some((id) => id.toString() === userId.toString()) &&
            targetUser.followers?.some((id) => id.toString() === userId.toString());
            if (!isMate) continue;
          }
          filteredIds.push(invId);
        }
      }
      validIds = filteredIds;

      if (validIds.length > 0) {
        await JourneyInvitation.create(
        validIds.map((invId) => ({
          journeyId: newJourney[0]._id,
          inviterId: userId,
          inviteeId: invId,
          type: "invitation",
          status: "pending",
          role: "Member",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })),
        { session }
        );

        newJourney[0].pendingInvitationCount = validIds.length;
        await newJourney[0].save({ session });

        await Notification.create(
        validIds.map((invId) => ({
          sender: userId,
          receiver: invId,
          type: "journey_invitation",
          journey: newJourney[0]._id,
          message: `${user?.name || "A traveler"} invited you to join "${title}"`
        })),
        { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Journey created successfully",
      journey: newJourney[0]
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Check for duplicate key error OR TransientTransactionError (WriteConflict) during concurrent creation
    const isDuplicateKey = error.code === 11000 && error.keyPattern && error.keyPattern.sourceType && error.keyPattern.sourceId;
    const isWriteConflict = error.code === 112 || (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError'));
    
    if (isDuplicateKey || isWriteConflict) {
      const { sourceType, sourceId } = req.body;
      const finalSourceType = sourceType || "manual";
      
      if (sourceId) {
        // The transaction is aborted and session ended; we can safely fetch the Journey that won the race
        let existingJourney = await Journey.findOne({
          $or: [
            ...(mongoose.isValidObjectId(sourceId) ? [{ _id: sourceId }] : []),
            { sourceType: finalSourceType, sourceId: sourceId },
            { sourceId: sourceId }
          ]
        });
        
        // If WriteConflict aborted us but the winner hasn't committed yet, existingJourney will be null.
        if (!existingJourney && isWriteConflict) {
          await new Promise(resolve => setTimeout(resolve, 800));
          existingJourney = await Journey.findOne({
            $or: [
              ...(mongoose.isValidObjectId(sourceId) ? [{ _id: sourceId }] : []),
              { sourceType: finalSourceType, sourceId: sourceId },
              { sourceId: sourceId }
            ]
          });
        }

        if (existingJourney) {
          return res.status(200).json({
            success: true,
            message: "Journey created successfully",
            journey: existingJourney
          });
        }
      }
    }

    console.error("Error creating journey:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.getMyJourneys = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { filter, status } = req.query;

    let query = {
      $or: [
        { creator: userId },
        { "members.user": userId }
      ]
    };

    if (status && status !== "all") {
      query.status = status;
    }

    let journeys = await Journey.find(query).
    populate("creator", "name profilePic pic img avatar").
    populate("members.user", "name profilePic pic img avatar").
    sort({ startDate: 1 });

    const syncedJourneys = await Promise.all(journeys.map((j) => syncJourneyStatus(j)));

    let finalJourneys = syncedJourneys;
    if (filter === "upcoming") {
      finalJourneys = syncedJourneys.filter((j) => j.status === "Upcoming" || j.status === "Planning");
    } else if (filter === "ongoing") {
      finalJourneys = syncedJourneys.filter((j) => j.status === "Ongoing");
    } else if (filter === "completed") {
      finalJourneys = syncedJourneys.filter((j) => j.status === "Completed");
    } else if (filter === "cancelled") {
      finalJourneys = syncedJourneys.filter((j) => j.status === "Cancelled" || j.isCancelled);
    }

    res.json({
      success: true,
      count: finalJourneys.length,
      journeys: finalJourneys
    });
  } catch (error) {
    console.error("Error fetching user journeys:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    let journey = await Journey.findById(id).
    populate("creator", "name profilePic pic img avatar bio").
    populate("members.user", "name profilePic pic img avatar bio");

    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    const isMember = journey.members.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    ) || (journey.creator && (journey.creator._id || journey.creator).toString() === userId.toString());

    if (journey.privacy === "Private" && !isMember) {
      return res.status(403).json({ success: false, message: "Access denied. Private journey." });
    }

    journey = await syncJourneyStatus(journey);

    const timeline = await JourneyTimeline.find({ journeyId: id }).sort({ createdAt: -1 });
    const safetyState = computeSafetyState(journey, timeline);

    const journeyObj = journey.toObject ? journey.toObject() : { ...journey };
    journeyObj.timeline = timeline;
    journeyObj.safetyState = safetyState;

    res.json({
      success: true,
      journey: journeyObj,
      isMember,
      safetyState
    });
  } catch (error) {
    console.error("Error fetching journey by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    let journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the journey creator can edit details" });
    }

    if (String(journey.status || "").toLowerCase() === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot update a cancelled journey" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "coverImage",
      "destination",
      "from",
      "destinationCoordinates",
      "startDate",
      "endDate",
      "privacy",
      "journeyType",
      "maxMembers"
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        journey[field] = req.body[field];
      }
    });

    if (journey.members.length > (journey.maxMembers || 50)) {
      return res.status(400).json({
        success: false,
        message: `Capacity cannot be lower than existing member count (${journey.members.length})`
      });
    }

    await journey.save();
    res.json({ success: true, message: "Journey updated successfully", journey });
  } catch (error) {
    console.error("Error updating journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteJourney = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).session(session);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the creator can delete this journey" });
    }

    await Journey.findByIdAndDelete(id).session(session);
    await JourneyMember.deleteMany({ journeyId: id }).session(session);
    await JourneyTimeline.deleteMany({ journeyId: id }).session(session);
    await JourneyWorkspace.deleteMany({ journeyId: id }).session(session);
    await JourneyInvitation.deleteMany({ journeyId: id }).session(session);
    await JourneyJoinRequest.deleteMany({ journeyId: id }).session(session);
    await JourneyMemory.deleteMany({ journeyId: id }).session(session);
    await JourneyGallery.deleteMany({ journeyId: id }).session(session);

    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndDelete(journey.chatRoomId).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Journey deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// WORKSPACE & TIMELINE & CHECKIN
// ==========================================

exports.getWorkspaceItems = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await JourneyWorkspace.find({ journeyId: id }).populate("creatorId", "name profilePic").sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addWorkspaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, content, items, isPinned } = req.body;
    const userId = req.user._id || req.user.id;
    const userName = req.user.name || req.user.username || "Traveler";
    const userPic = req.user.profilePic || req.user.pic || req.user.avatar || "";

    const item = await JourneyWorkspace.create({
      journeyId: id,
      creatorId: userId,
      creatorName: userName,
      creatorPic: userPic,
      category,
      title,
      content,
      items: Array.isArray(items) ? items : [],
      isPinned: Boolean(isPinned)
    });

    res.status(201).json({ success: true, note: item, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.updateWorkspaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await JourneyWorkspace.findByIdAndUpdate(itemId, req.body, { new: true });
    res.json({ success: true, note: item, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.deleteWorkspaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await JourneyWorkspace.findByIdAndDelete(itemId);
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const JOURNEY_MILESTONES = [
  "Started Journey",
  "Reached Destination",
  "Reached Accommodation",
  "Returning Home",
  "Reached Home Safely"
];
exports.JOURNEY_MILESTONES = JOURNEY_MILESTONES;

const computeSafetyState = (journey, timelineEvents = []) => {
  if (!journey) return null;

  // Filter timeline events for milestone checkins
  const milestoneEvents = timelineEvents
    .filter(e => e.eventType === "safe_checkin" && JOURNEY_MILESTONES.includes(e.checkInType))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Extract unique ordered completed milestones
  const completedMilestones = [];
  const completedMilestoneDetails = {};
  for (const ev of milestoneEvents) {
    if (!completedMilestones.includes(ev.checkInType)) {
      completedMilestones.push(ev.checkInType);
      completedMilestoneDetails[ev.checkInType] = {
        time: ev.createdAt,
        location: ev.locationName || ev.location || "",
        userId: ev.userId,
        userName: ev.userName
      };
    }
  }

  const nextIndex = completedMilestones.length;
  const nextExpectedMilestone = nextIndex < JOURNEY_MILESTONES.length ? JOURNEY_MILESTONES[nextIndex] : null;
  const isSafetyComplete = completedMilestones.length === JOURNEY_MILESTONES.length || journey.status === "Completed";
  const canCheckIn = !isSafetyComplete && journey.status !== "Cancelled" && journey.status !== "Archived" && journey.isCancelled !== true;

  // All safe check-in events (milestone OR safe_confirmation)
  const allCheckInEvents = timelineEvents
    .filter(e => e.eventType === "safe_checkin")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const lastCheckIn = allCheckInEvents[0] ? {
    id: allCheckInEvents[0]._id,
    type: allCheckInEvents[0].checkInType || "safe_confirmation",
    title: allCheckInEvents[0].title,
    time: allCheckInEvents[0].createdAt,
    location: allCheckInEvents[0].locationName || allCheckInEvents[0].location || "",
    userName: allCheckInEvents[0].userName,
    isQuickSafe: allCheckInEvents[0].checkInType === "safe_confirmation" || !allCheckInEvents[0].checkInType
  } : null;

  // Check if SOS is active on journey or timeline
  const isSosActive = journey.isEmergencyActive === true || journey.safetyStatus === "SOS_ACTIVE" || timelineEvents.some(e => e.eventType === "emergency_alert" && !e.isResolved);

  // Status calculation: 🟢 SAFE, 🟡 CHECK-IN DUE, 🟠 CHECK-IN OVERDUE, 🔴 SOS ACTIVE
  let safetyStatus = "SAFE";
  let safetyStatusText = "Recently confirmed";
  let safetyStatusSubtext = "All good with your travel squad.";
  let safetyStatusColor = "emerald";

  if (isSosActive) {
    safetyStatus = "SOS_ACTIVE";
    safetyStatusText = "SOS Active";
    safetyStatusSubtext = "Emergency alert is active.";
    safetyStatusColor = "rose";
  } else if (journey.status === "Ongoing") {
    if (lastCheckIn) {
      const hoursSince = (Date.now() - new Date(lastCheckIn.time).getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        safetyStatus = "CHECK_IN_OVERDUE";
        safetyStatusText = "Check-in overdue";
        safetyStatusSubtext = "We haven't received a safety check-in recently. Check in when convenient.";
        safetyStatusColor = "orange";
      } else if (hoursSince > 12) {
        safetyStatus = "CHECK_IN_DUE";
        safetyStatusText = "Check-in due";
        safetyStatusSubtext = "A routine safety check-in is due.";
        safetyStatusColor = "amber";
      } else {
        safetyStatus = "SAFE";
        safetyStatusText = "Recently confirmed";
        safetyStatusSubtext = "All good with your travel squad.";
        safetyStatusColor = "emerald";
      }
    } else {
      const journeyStartTime = new Date(journey.startDate || journey.updatedAt || journey.createdAt || Date.now()).getTime();
      const hoursSinceStart = (Date.now() - journeyStartTime) / (1000 * 60 * 60);
      if (hoursSinceStart > 24) {
        safetyStatus = "CHECK_IN_OVERDUE";
        safetyStatusText = "Check-in overdue";
        safetyStatusSubtext = "We haven't received a safety check-in recently. Check in when convenient.";
        safetyStatusColor = "orange";
      } else {
        safetyStatus = "CHECK_IN_DUE";
        safetyStatusText = "Check-in due";
        safetyStatusSubtext = "No check-in recorded yet.";
        safetyStatusColor = "amber";
      }
    }
  } else if (journey.status === "Completed") {
    safetyStatus = "COMPLETED";
    safetyStatusText = "Journey safely completed";
    safetyStatusSubtext = "All milestones completed.";
    safetyStatusColor = "emerald";
  } else if (journey.status === "Cancelled" || journey.isCancelled) {
    safetyStatus = "CANCELLED";
    safetyStatusText = "Journey cancelled";
    safetyStatusSubtext = "Trip has been cancelled.";
    safetyStatusColor = "slate";
  } else {
    safetyStatus = "STANDBY";
    safetyStatusText = "Pre-trip standby";
    safetyStatusSubtext = "Journey has not started yet.";
    safetyStatusColor = "sky";
  }

  return {
    completedMilestones,
    completedMilestoneDetails,
    nextExpectedMilestone,
    isSafetyComplete,
    canCheckIn,
    lastCheckIn,
    safetyStatus,
    safetyStatusText,
    safetyStatusSubtext,
    safetyStatusColor,
    allMilestones: JOURNEY_MILESTONES
  };
};

exports.computeSafetyState = computeSafetyState;

exports.getTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const journey = await Journey.findById(id);
    const timeline = await JourneyTimeline.find({ journeyId: id }).sort({ createdAt: -1 });
    const safetyState = journey ? computeSafetyState(journey, timeline) : null;
    res.json({ success: true, timeline, safetyState });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.safeCheckIn = async (req, res) => {
  let session = null;
  let useTransaction = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (e) {
    session = null;
    useTransaction = false;
  }

  try {
    const { id } = req.params;
    const { checkInType, location, message, locationName, note, isQuickSafe, coordinates } = req.body;
    const userId = req.user._id || req.user.id;

    const userQuery = User.findById(userId);
    if (useTransaction) userQuery.session(session);
    const user = await userQuery;

    if (!user) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const journeyQuery = Journey.findById(id);
    if (useTransaction) journeyQuery.session(session);
    const journey = await journeyQuery;

    if (!journey) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    // 1. Membership Authorization (Creator or Member)
    const isMember = journey.members?.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    ) || (journey.creator && (journey.creator._id || journey.creator).toString() === userId.toString());

    if (!isMember) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(403).json({ success: false, code: "NOT_JOURNEY_MEMBER", message: "Only journey members can broadcast check-ins." });
    }

    // 2. Journey Status Checks
    if (journey.status === "Cancelled" || journey.isCancelled) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(400).json({ success: false, code: "JOURNEY_NOT_ACTIVE", message: "Cannot check in to a cancelled journey." });
    }

    const finalLocation = location || locationName || journey.destination || "Current Location";
    const finalNote = message || note || "";

    // 3. Determine if Quick Safety or Milestone Check-In
    const isExplicitQuickSafe = isQuickSafe === true || checkInType === "safe_confirmation" || checkInType === "Safety Confirmation" || !checkInType;

    if (isExplicitQuickSafe) {
      // BRANCH A: QUICK "I'M SAFE" SAFETY CONFIRMATION
      // Does NOT advance milestones, does NOT alter journey status.
      const createPayload = {
        journeyId: id,
        userId,
        userName: user.name || "Traveler",
        userPic: user.profilePic || user.pic || user.avatar || "",
        eventType: "safe_checkin",
        title: "Safety Confirmation",
        checkInType: "safe_confirmation",
        description: finalNote || `${user.name || "Traveler"} checked in as safe at ${finalLocation}`,
        locationName: finalLocation,
        coordinates: coordinates || null
      };

      let checkIn;
      if (useTransaction) {
        const created = await JourneyTimeline.create([createPayload], { session });
        checkIn = created[0];
      } else {
        checkIn = await JourneyTimeline.create(createPayload);
      }

      journey.stats = journey.stats || {};
      journey.stats.checkInsCount = (journey.stats.checkInsCount || 0) + 1;
      if (useTransaction) {
        await journey.save({ session });
      } else {
        await journey.save();
      }

      // Notify other members
      const recipientIds = (journey.members || [])
        .map(m => (m.user?._id || m.user).toString())
        .filter(uId => uId !== userId.toString());

      if (recipientIds.length > 0) {
        const notifPayload = recipientIds.map(rId => ({
          sender: userId,
          receiver: rId,
          type: "safe_checkin",
          journey: journey._id,
          message: `🛡️ ${user.name || "A buddy"} confirmed they are safe at ${finalLocation}.`
        }));
        if (useTransaction) {
          await Notification.create(notifPayload, { session });
        } else {
          await Notification.create(notifPayload);
        }
      }

      if (useTransaction) {
        await session.commitTransaction();
        session.endSession();
      }

      const allTimeline = await JourneyTimeline.find({ journeyId: id }).sort({ createdAt: -1 });
      const safetyState = computeSafetyState(journey, allTimeline);

      return res.status(201).json({
        success: true,
        message: "You're marked safe.",
        checkIn,
        timelineEntry: checkIn,
        isQuickSafe: true,
        safetyState
      });
    }

    // BRANCH B: SEQUENTIAL JOURNEY MILESTONE
    if (!JOURNEY_MILESTONES.includes(checkInType)) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(400).json({
        success: false,
        code: "MILESTONE_OUT_OF_ORDER",
        message: `Invalid check-in type: '${checkInType}'. Valid milestones: ${JOURNEY_MILESTONES.join(", ")}`
      });
    }

    if (journey.status === "Completed") {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(400).json({
        success: false,
        code: "JOURNEY_NOT_ACTIVE",
        message: "Journey is already completed. No further milestone check-ins can be recorded."
      });
    }

    // Query existing milestones to ensure sequential progression and duplicate prevention
    const timelineQuery = JourneyTimeline.find({
      journeyId: id,
      eventType: "safe_checkin",
      checkInType: { $in: JOURNEY_MILESTONES }
    }).sort({ createdAt: 1 });
    if (useTransaction) timelineQuery.session(session);
    const existingMilestoneEvents = await timelineQuery;

    const completedMilestones = [];
    for (const ev of existingMilestoneEvents) {
      if (!completedMilestones.includes(ev.checkInType)) {
        completedMilestones.push(ev.checkInType);
      }
    }

    // Rule: Duplicate check -> 409 Conflict
    if (completedMilestones.includes(checkInType)) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(409).json({
        success: false,
        code: "MILESTONE_ALREADY_COMPLETED",
        message: `'${checkInType}' has already been recorded for this journey.`
      });
    }

    // Rule: Next expected check
    const nextExpectedIndex = completedMilestones.length;
    const nextExpectedMilestone = JOURNEY_MILESTONES[nextExpectedIndex];

    if (!nextExpectedMilestone) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(400).json({
        success: false,
        code: "MILESTONE_OUT_OF_ORDER",
        message: "All journey milestones have already been completed."
      });
    }

    if (checkInType !== nextExpectedMilestone) {
      if (useTransaction) await session.abortTransaction();
      if (session) session.endSession();
      return res.status(400).json({
        success: false,
        code: "MILESTONE_OUT_OF_ORDER",
        message: `Cannot check in to '${checkInType}'. Next required milestone is '${nextExpectedMilestone}'.`
      });
    }


    // Create the milestone event
    const createPayload = {
      journeyId: id,
      userId,
      userName: user.name || "Traveler",
      userPic: user.profilePic || user.pic || user.avatar || "",
      eventType: "safe_checkin",
      title: checkInType,
      checkInType: checkInType,
      description: finalNote || `Milestone reached: ${checkInType} at ${finalLocation}`,
      locationName: finalLocation,
      coordinates: coordinates || null
    };

    let checkIn;
    if (useTransaction) {
      const created = await JourneyTimeline.create([createPayload], { session });
      checkIn = created[0];
    } else {
      checkIn = await JourneyTimeline.create(createPayload);
    }

    // Status progressions
    if (checkInType === "Started Journey" && (journey.status === "Planning" || journey.status === "Upcoming")) {
      journey.status = "Ongoing";
    }

    if (checkInType === "Reached Home Safely") {
      journey.status = "Completed";
      journey.completedAt = new Date();
    }

    journey.stats = journey.stats || {};
    journey.stats.checkInsCount = (journey.stats.checkInsCount || 0) + 1;
    if (useTransaction) {
      await journey.save({ session });
    } else {
      await journey.save();
    }

    // Notify other members
    const recipientIds = (journey.members || [])
      .map(m => (m.user?._id || m.user).toString())
      .filter(uId => uId !== userId.toString());

    if (recipientIds.length > 0) {
      const notifPayload = recipientIds.map(rId => ({
        sender: userId,
        receiver: rId,
        type: "safe_checkin",
        journey: journey._id,
        message: `📍 ${user.name || "A buddy"} checked in: ${checkInType} at ${finalLocation}.`
      }));
      if (useTransaction) {
        await Notification.create(notifPayload, { session });
      } else {
        await Notification.create(notifPayload);
      }
    }

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    const allTimeline = await JourneyTimeline.find({ journeyId: id }).sort({ createdAt: -1 });
    const safetyState = computeSafetyState(journey, allTimeline);

    return res.status(201).json({
      success: true,
      message: `Checked in: ${checkInType}!`,
      checkIn,
      timelineEntry: checkIn,
      isQuickSafe: false,
      safetyState
    });
  } catch (error) {
    if (useTransaction && session) {
      try { await session.abortTransaction(); } catch (e) {}
      try { session.endSession(); } catch (e) {}
    }
    const isWriteConflict = error.code === 112 || (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError'));
    if (isWriteConflict) {
      try {
        const { checkInType } = req.body || {};
        if (checkInType) {
          const existing = await JourneyTimeline.findOne({
            journeyId: req.params.id,
            eventType: "safe_checkin",
            checkInType
          });
          if (existing) {
            return res.status(409).json({
              success: false,
              code: "MILESTONE_ALREADY_COMPLETED",
              message: `'${checkInType}' has already been recorded for this journey.`
            });
          }
        }
        return res.status(409).json({
          success: false,
          code: "MILESTONE_ALREADY_COMPLETED",
          message: "Another check-in request is being processed. Please retry."
        });
      } catch (err) {

        // fallback
      }
    }
    console.error("Error doing safe check-in:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// ==========================================
// GALLERY & MEMORIES
// ==========================================

exports.getGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const journey = await Journey.findById(id);
    if (journey) {
      await syncJourneyStatus(journey);
    }
    const gallery = await JourneyGallery.find({ journeyId: id }).populate("uploadedBy", "name profilePic").sort({ createdAt: -1 });
    res.json({ success: true, gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, caption, type } = req.body;
    const userId = req.user._id || req.user.id;

    const item = await JourneyGallery.create({
      journeyId: id,
      url,
      caption,
      mediaType: type || "image",
      uploadedBy: userId
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMemories = async (req, res) => {
  try {
    const { id } = req.params;
    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    await syncJourneyStatus(journey);

    const isUnlocked = journey.status === "Completed";
    if (!isUnlocked) {
      return res.json({
        success: true,
        unlocked: false,
        message: "Your Scrapbook will unlock after the journey is completed",
        endDate: journey.endDate
      });
    }

    const memory = await JourneyMemory.findOne({ journeyId: id }).
    populate("comments.userId", "name profilePic");

    res.json({
      success: true,
      unlocked: true,
      memory,
      memories: memory ? [memory] : []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addMemoryComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (journey) {
      await syncJourneyStatus(journey);
    }

    const memory = await JourneyMemory.findOneAndUpdate(
      { journeyId: id },
      { $push: { comments: { userId, text, createdAt: new Date() } } },
      { new: true }
    ).populate("comments.userId", "name profilePic");

    res.json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.reactToMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (journey) {
      await syncJourneyStatus(journey);
    }

    const memory = await JourneyMemory.findOne({ journeyId: id });
    if (!memory) return res.status(404).json({ success: false, message: "Memory not found" });

    const existingIndex = memory.reactions.findIndex((r) => r.userId.toString() === userId.toString());
    if (existingIndex > -1) {
      if (memory.reactions[existingIndex].type === reactionType) {
        memory.reactions.splice(existingIndex, 1);
      } else {
        memory.reactions[existingIndex].type = reactionType;
      }
    } else {
      memory.reactions.push({ userId, type: reactionType || "love" });
    }

    await memory.save();
    res.json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// STATISTICS & COMPANIONS
// ==========================================

exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id || req.user.id;

    const allJourneys = await Journey.find({
      $or: [{ creator: userId }, { "members.user": userId }]
    });

    const activeJourneys = allJourneys.filter((j) => !j.isCancelled && String(j.status || "").toLowerCase() !== "cancelled");
    const completedJourneys = activeJourneys.filter((j) => j.status === "Completed");

    let totalDurationDays = 0;
    const uniqueDestinations = new Set();
    const companionIds = new Set();

    activeJourneys.forEach((j) => {
      if (j.destination) uniqueDestinations.add(j.destination.trim().toLowerCase());
      if (j.startDate && j.endDate) {
        const start = new Date(j.startDate);
        const end = new Date(j.endDate);
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        totalDurationDays += days;
      } else if (j.durationDays) {
        totalDurationDays += j.durationDays;
      }

      if (j.members && Array.isArray(j.members)) {
        j.members.forEach((m) => {
          const memId = (m.user?._id || m.user).toString();
          if (memId !== userId.toString()) {
            companionIds.add(memId);
          }
        });
      }
    });

    const totalPostsCount = await Post.countDocuments({ userId: userId });
    const totalStoriesCount = await Story.countDocuments({ userId: userId });
    const userDoc = await User.findById(userId).select("followers following reputationPoints verified");

    const tripMateController = require("./tripMateController");
    const validTripMates = await tripMateController.getValidTripMates(userId);
    const tripMatesCount = validTripMates.length;

    const ongoing = activeJourneys.filter((j) => {
      const s = String(j.status || "").toLowerCase();
      return s === "ongoing" || s === "active" || s === "active now" || s === "open";
    }).length;
    const upcoming = activeJourneys.filter((j) => {
      const s = String(j.status || "").toLowerCase();
      return s === "upcoming" || s === "planning" || s === "pending" || (!["ongoing", "active", "active now", "open", "completed"].includes(s));
    }).length;

    res.json({
      success: true,
      stats: {
        totalJourneys: activeJourneys.length,
        completedJourneysCount: completedJourneys.length,
        destinationsExploredCount: uniqueDestinations.size,
        totalTravelDays: totalDurationDays,
        totalCompanionsMet: companionIds.size,
        totalPostsCount,
        totalStoriesCount,
        followersCount: userDoc?.followers?.length || 0,
        followingCount: userDoc?.following?.length || 0,
        tripMatesCount,
        reputationPoints: userDoc?.reputationPoints || 100,
        isVerified: userDoc?.verified || false,
        // ExplorerDashboardWidget expected fields
        ongoing,
        upcoming,
        postsShared: totalPostsCount,
        companionsCount: companionIds.size,
        achievements: (() => {
          const badges = [];
          if (completedJourneys.length >= 1) {
            badges.push({ title: "First Steps", desc: "Completed your first collaborative journey." });
          }
          if (completedJourneys.length >= 5) {
            badges.push({ title: "Seasoned Traveler", desc: "Successfully completed 5 trips." });
          }
          if (totalDurationDays >= 30) {
            badges.push({ title: "Globetrotter", desc: "Spent over a month traveling the world." });
          }
          if (companionIds.size >= 3) {
            badges.push({ title: "Social Butterfly", desc: "Traveled with 3 or more mates." });
          }
          if (uniqueDestinations.size >= 3) {
            badges.push({ title: "Explorer", desc: "Visited at least 3 distinct destinations." });
          }
          return badges;
        })()
      }
    });
  } catch (error) {
    console.error("Error generating user statistics:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getPreviousCompanions = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id || req.user.id;
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 50;

    const journeys = await Journey.find({
      $or: [{ creator: userId }, { "members.user": userId }],
      status: { $ne: "Cancelled" }
    }).
    populate("members.user", "name username bio pic avatar profilePic isVerified verificationStatus").
    populate("creator", "name username bio pic avatar profilePic isVerified verificationStatus").
    sort({ startDate: -1, createdAt: -1 });

    const buddyTrips = await TravelGroup.find({
      $or: [{ host: userId }, { "members.user": userId }],
      status: { $ne: "cancelled" }
    }).
    populate("members.user", "name username bio pic avatar profilePic isVerified verificationStatus").
    populate("host", "name username bio pic avatar profilePic isVerified verificationStatus").
    sort({ startDate: -1, createdAt: -1 });

    const journeySourceIds = new Set(
      journeys
        .filter((j) => (j.sourceType === "explore" || j.sourceType === "travel_group") && j.sourceId)
        .map((j) => j.sourceId.toString())
    );
    const filteredBuddyTrips = buddyTrips.filter(
      (trip) => !journeySourceIds.has((trip._id || trip.id).toString())
    );

    const companionMap = {};
    const groupedByJourney = [];

    journeys.forEach((j) => {
      const journeyCompanions = [];
      const allUsersInJourney = [];

      if (j.creator && j.creator._id) allUsersInJourney.push(j.creator);
      if (j.members && Array.isArray(j.members)) {
        j.members.forEach((m) => {
          if (m.user && m.user._id) allUsersInJourney.push(m.user);
        });
      }

      allUsersInJourney.forEach((u) => {
        const uId = u._id.toString();
        if (uId !== userId.toString()) {
          journeyCompanions.push(u);
          if (!companionMap[uId]) {
            companionMap[uId] = {
              _id: u._id,
              name: u.name,
              username: u.username,
              bio: u.bio || "Travel Enthusiast",
              profilePic: u.profilePic || u.pic || u.avatar,
              verified: u.isVerified || u.verificationStatus === "verified",
              tripsCount: 0,
              lastJourney: {
                title: j.title,
                destination: j.destination,
                date: j.startDate || j.createdAt
              },
              category: "Previous Companions",
              pill: "Past Companion"
            };
          }
          companionMap[uId].tripsCount += 1;
        }
      });

      if (journeyCompanions.length > 0) {
        groupedByJourney.push({
          _id: j._id,
          title: j.title,
          destination: j.destination,
          startDate: j.startDate,
          companions: journeyCompanions
        });
      }
    });

    filteredBuddyTrips.forEach((trip) => {
      const allUsersInTrip = [];

      if (trip.host && trip.host._id) allUsersInTrip.push(trip.host);
      if (trip.members && Array.isArray(trip.members)) {
        trip.members.forEach((m) => {
          if (m.user && m.user._id) allUsersInTrip.push(m.user);
        });
      }

      const tripCompanions = [];
      allUsersInTrip.forEach((u) => {
        const uId = u._id.toString();
        if (uId !== userId.toString()) {
          tripCompanions.push(u);
          if (!companionMap[uId]) {
            companionMap[uId] = {
              _id: u._id,
              name: u.name,
              username: u.username,
              bio: u.bio || "Travel Enthusiast",
              profilePic: u.profilePic || u.pic || u.avatar,
              verified: u.isVerified || u.verificationStatus === "verified",
              tripsCount: 0,
              lastJourney: {
                title: trip.title || trip.destination,
                destination: trip.destination,
                date: trip.startDate || trip.createdAt
              },
              category: "Previous Companions",
              pill: "Past Companion"
            };
          }
          companionMap[uId].tripsCount += 1;
        }
      });

      if (tripCompanions.length > 0) {
        groupedByJourney.push({
          _id: trip._id,
          title: trip.title || trip.destination,
          destination: trip.destination,
          startDate: trip.startDate,
          companions: tripCompanions
        });
      }
    });

    let companions = Object.values(companionMap);

    if (search.trim()) {
      const kw = search.toLowerCase();
      companions = companions.filter(
      (c) => c.name && c.name.toLowerCase().includes(kw) || c.username && c.username.toLowerCase().includes(kw)
      );
    }

    companions.sort((a, b) => {
      if (b.tripsCount !== a.tripsCount) return b.tripsCount - a.tripsCount;
      return new Date(b.lastJourney.date).getTime() - new Date(a.lastJourney.date).getTime();
    });

    const totalCount = companions.length;
    const slicedCompanions = companions.slice(0, limit);

    res.json({
      success: true,
      count: slicedCompanions.length,
      totalCount,
      hasMore: totalCount > limit,
      companions: slicedCompanions,
      groupedByJourney: groupedByJourney.slice(0, 10)
    });
  } catch (error) {
    console.error("Error loading previous companions:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ==========================================

exports.syncJourneyStatus = journeyLifecycleController.syncJourneyStatus;
exports.syncJourneyStatusHandler = journeyLifecycleController.syncJourneyStatusHandler;

exports.transferHost = journeyHostController.transferHost;

exports.cancelJourney = journeyCancellationController.cancelJourney;
exports.evaluateCancellationRules = journeyCancellationController.evaluateCancellationRules;

exports.inviteMembers = journeyMembershipController.inviteMembers;
exports.acceptInvitation = journeyMembershipController.acceptInvitation;
exports.rejectInvitation = journeyMembershipController.rejectInvitation;
exports.leaveJourney = journeyMembershipController.leaveJourney;
exports.removeMember = journeyMembershipController.removeMember;
exports.getMyInvitations = journeyMembershipController.getMyInvitations;
exports.getJourneyInvitations = journeyMembershipController.getJourneyInvitations;
exports.resendInvitation = journeyMembershipController.resendInvitation;
exports.cancelInvitation = journeyMembershipController.cancelInvitation;
exports.updateMemberRole = journeyMembershipController.updateMemberRole;
exports.requestToJoinJourney = journeyMembershipController.requestToJoinJourney;
exports.getJourneyJoinRequests = journeyMembershipController.getJourneyJoinRequests;
exports.cancelJourneyJoinRequest = journeyMembershipController.cancelJourneyJoinRequest;
exports.acceptJourneyJoinRequest = journeyMembershipController.acceptJourneyJoinRequest;
exports.rejectJourneyJoinRequest = journeyMembershipController.rejectJourneyJoinRequest;
exports.getMyJoinRequest = journeyMembershipController.getMyJoinRequest;
exports.revokeSocketRoomAccess = journeyMembershipController.revokeSocketRoomAccess;