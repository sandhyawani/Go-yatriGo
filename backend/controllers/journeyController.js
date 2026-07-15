const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyTimeline = require("../models/JourneyTimeline");
const JourneyWorkspace = require("../models/JourneyWorkspace");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyMemory = require("../models/JourneyMemory");
const JourneyGallery = require("../models/JourneyGallery");
const Notification = require("../models/Notification");
const ChatRoom = require("../models/ChatRoom");
const Post = require("../models/Post");
const Story = require("../models/Story");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");

// Helper: Compute & Synchronize Lifecycle Status
const syncJourneyStatus = async (journey) => {
  if (!journey || journey.status === "Cancelled") return journey;

  const now = new Date();
  const start = new Date(journey.startDate);
  const end = new Date(journey.endDate);

  let expectedStatus = "Upcoming";
  if (now > end) {
    expectedStatus = "Completed";
  } else if (now >= start && now <= end) {
    expectedStatus = "Ongoing";
  }

  if (journey.status !== expectedStatus) {
    const oldStatus = journey.status;
    journey.status = expectedStatus;

    if (expectedStatus === "Completed" && !journey.completedAt) {
      journey.completedAt = now;

      if (!journey.aiSummary) {
        const memberCount = journey.members?.length || 1;
        journey.aiSummary = `Your ${journey.durationDays || 3}-day ${journey.destination} collaborative journey included ${memberCount} travelers, exploring local scenic highlights, sharing incredible memories, and building lifelong travel friendships.`;
      }

      // Safe Atomic Upsert Guard to eliminate parallel race conditions
      await JourneyMemory.findOneAndUpdate(
        { journeyId: journey._id },
        {
          $setOnInsert: {
            journeyId: journey._id,
            title: journey.title,
            destination: journey.destination,
            coverImage: journey.coverImage,
            durationDays: journey.durationDays,
            participantsCount: journey.members?.length || 1,
            participants: journey.members?.map((m) => ({
              userId: m.user?._id || m.user,
              name: m.user?.name || "Traveler",
              pic: m.user?.profilePic || "",
              role: m.role,
            })),
            aiSummary: journey.aiSummary,
            highlights: [
              { title: "Journey Created", eventType: "journey_created", createdAt: journey.createdAt },
              { title: "Journey Started", eventType: "journey_started", createdAt: journey.startDate },
              { title: "Journey Completed Successfully", eventType: "journey_completed", createdAt: now },
            ],
          },
        },
        { upsert: true, new: true }
      );

      await JourneyTimeline.create({
        journeyId: journey._id,
        userId: journey.creator,
        userName: "System",
        eventType: "journey_completed",
        title: "Journey Completed",
        description: `Congratulations on completing ${journey.title}!`,
      });
    } else if (expectedStatus === "Ongoing" && oldStatus === "Upcoming") {
      await JourneyTimeline.create({
        journeyId: journey._id,
        userId: journey.creator,
        userName: "System",
        eventType: "journey_started",
        title: "Journey Started",
        description: `The journey to ${journey.destination} has officially begun!`,
      });
    }
    await journey.save();
  }
  return journey;
};

// 1. Create Journey (Atomic & Sanitized)
exports.createJourney = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const {
      title,
      description,
      coverImage,
      destination,
      destinationCoordinates,
      startDate,
      endDate,
      privacy,
      journeyType,
      sourceType,
      sourceId,
      invitedUserIds,
    } = req.body;

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).session(session);

    const finalSourceType = sourceType || "manual";
    let membersList = [{ user: userId, role: "Organizer", joinedAt: new Date() }];
    let chatMembers = [userId];

    if (finalSourceType === "explore" && sourceId) {
      const exploreGroup = await TravelGroup.findById(sourceId).session(session);
      if (exploreGroup && exploreGroup.members) {
        exploreGroup.members.forEach((m) => {
          const mIdStr = (m.user?._id || m.user).toString();
          if (mIdStr !== userId.toString()) {
            membersList.push({
              user: m.user?._id || m.user,
              role: m.role === "cohost" ? "Co-Organizer" : "Member",
              joinedAt: new Date(),
            });
            chatMembers.push(m.user?._id || m.user);
          }
        });
      }
    }

    const chatRoom = await ChatRoom.create([{
      name: `${title.trim()} Squad`,
      type: "group",
      members: chatMembers,
    }], { session });

    const newJourney = await Journey.create([{
      title: title.trim(),
      description,
      coverImage,
      destination: destination.trim(),
      destinationCoordinates,
      startDate,
      endDate,
      privacy: privacy || "Public",
      journeyType: membersList.length > 1 ? "Friends" : journeyType || "Solo",
      status: "Planning",
      sourceType: finalSourceType,
      sourceId: sourceId || null,
      createdFrom: finalSourceType === "explore" ? "Explore Travel Squad" : "Manual Creation",
      creator: userId,
      members: membersList,
      memberCount: membersList.length,
      chatRoomId: chatRoom[0]._id,
    }], { session });

    chatRoom[0].journeyId = newJourney[0]._id;
    await chatRoom[0].save({ session });

    await JourneyMember.create(
      membersList.map((m) => ({
        journeyId: newJourney[0]._id,
        userId: m.user,
        role: m.role,
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
      description: `Organized a new travel workspace for ${destination}`,
    }], { session });

    if (finalSourceType !== "explore" && Array.isArray(invitedUserIds) && invitedUserIds.length > 0) {
      const validIds = invitedUserIds.filter((id) => id && id.toString() !== userId.toString());
      if (validIds.length > 0) {
        await JourneyInvitation.create(
          validIds.map((invId) => ({
            journeyId: newJourney[0]._id,
            inviterId: userId,
            inviteeId: invId,
            type: "invitation",
            status: "pending",
            role: "Member",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
            message: `${user?.name || "A traveler"} invited you to join "${title}"`,
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
      journey: newJourney[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating journey:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// 2. Get My Journeys (Optimized Aggregation Strategy)
exports.getMyJourneys = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query;

    let filter = {
      $or: [{ creator: userId }, { "members.user": userId }],
    };

    if (status && status !== "all") {
      filter.status = status;
    }

    const journeys = await Journey.find(filter)
      .populate("creator", "name profilePic")
      .populate("members.user", "name profilePic")
      .sort({ startDate: 1 });

    const syncedJourneys = await Promise.all(journeys.map((j) => syncJourneyStatus(j)));
    const finalJourneys = status && status !== "all" ? syncedJourneys.filter((j) => j.status === status) : syncedJourneys;
    const targetJourneyIds = finalJourneys.map((j) => j._id);

    // Optimized Single-Pass Aggregation instead of repeated queries in a map
    const invitationCounts = await JourneyInvitation.aggregate([
      { $match: { journeyId: { $in: targetJourneyIds }, status: { $in: ["pending", "accepted"] } } },
      { $group: { _id: { journeyId: "$journeyId", status: "$status" }, count: { $sum: 1 } } }
    ]);

    const countMap = invitationCounts.reduce((acc, curr) => {
      const jId = curr._id.journeyId.toString();
      const stat = curr._id.status;
      if (!acc[jId]) acc[jId] = { pending: 0, accepted: 0 };
      acc[jId][stat] = curr.count;
      return acc;
    }, {});

    const journeysWithCounts = finalJourneys.map((j) => {
      const jobj = j.toObject ? j.toObject() : { ...j._doc };
      jobj.pendingInvitationCount = countMap[j._id.toString()]?.pending || 0;
      jobj.acceptedInvitationCount = countMap[j._id.toString()]?.accepted || 0;
      return jobj;
    });

    res.json({
      success: true,
      count: journeysWithCounts.length,
      journeys: journeysWithCounts,
    });
  } catch (error) {
    console.error("Error fetching my journeys:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Get Journey Details
exports.getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    let journey = await Journey.findById(id)
      .populate("creator", "name profilePic bio")
      .populate("members.user", "name profilePic bio");

    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    journey = await syncJourneyStatus(journey);

    const [pendingCount, acceptedCount, timeline] = await Promise.all([
      JourneyInvitation.countDocuments({ journeyId: journey._id, status: "pending" }),
      JourneyInvitation.countDocuments({ journeyId: journey._id, status: "accepted" }),
      JourneyTimeline.find({ journeyId: journey._id }).sort({ createdAt: -1 }),
    ]);

    const journeyObj = journey.toObject ? journey.toObject() : { ...journey._doc };
    journeyObj.pendingInvitationCount = pendingCount;
    journeyObj.acceptedInvitationCount = acceptedCount;
    journeyObj.timeline = timeline;

    res.json({ success: true, journey: journeyObj });
  } catch (error) {
    console.error("Error fetching journey details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. Update Journey
exports.updateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    const isOrg = journey.members.some(
      (m) =>
        (m.user?.toString() === userId.toString() || m.user?._id?.toString() === userId.toString()) &&
        (m.role === "Organizer" || m.role === "Co-Organizer")
    );
    if (!isOrg && journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this journey" });
    }

    const updatableFields = [
      "title", "description", "coverImage", "destination", 
      "destinationCoordinates", "startDate", "endDate", "privacy", "journeyType"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        journey[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
      }
    });

    await journey.save();

    const user = await User.findById(userId);
    await JourneyTimeline.create({
      journeyId: journey._id,
      userId,
      userName: user?.name || "Organizer",
      userPic: user?.profilePic || "",
      eventType: "journey_updated",
      title: "Journey Updated",
      description: `Updated travel details for ${journey.title}`,
    });

    res.json({ success: true, message: "Journey updated successfully", journey });
  } catch (error) {
    console.error("Error updating journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 5. Cancel Journey
exports.cancelJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only journey creator can cancel" });
    }

    journey.status = "Cancelled";
    journey.cancelledAt = new Date();
    await journey.save();

    const user = await User.findById(userId);
    await JourneyTimeline.create({
      journeyId: journey._id,
      userId,
      userName: user?.name || "Creator",
      userPic: user?.profilePic || "",
      eventType: "journey_cancelled",
      title: "Journey Cancelled",
      description: `${journey.title} has been cancelled`,
    });

    const targetMembers = journey.members
      .map((m) => m.user?._id || m.user)
      .filter((memId) => memId.toString() !== userId.toString());

    if (targetMembers.length > 0) {
      await Notification.create(
        targetMembers.map((memId) => ({
          sender: userId,
          receiver: memId,
          type: "journey_cancelled",
          journey: journey._id,
          message: `The journey "${journey.title}" has been cancelled by the organizer.`,
        }))
      );
    }

    res.json({ success: true, message: "Journey cancelled successfully", journey });
  } catch (error) {
    console.error("Error cancelling journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 6. Delete Journey (Transactional Cleanup)
exports.deleteJourney = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).session(session);
    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    if (journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only creator can delete journey" });
    }

    if (journey.status !== "Cancelled") {
      return res.status(400).json({ success: false, message: "Journey must be cancelled before deletion" });
    }

    await Journey.findByIdAndDelete(id).session(session);
    await JourneyMember.deleteMany({ journeyId: id }).session(session);
    await JourneyTimeline.deleteMany({ journeyId: id }).session(session);
    await JourneyWorkspace.deleteMany({ journeyId: id }).session(session);
    await JourneyGallery.deleteMany({ journeyId: id }).session(session);
    await JourneyInvitation.deleteMany({ journeyId: id }).session(session);

    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndDelete(journey.chatRoomId).session(session);
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: "Journey deleted permanently" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 7. Member Invitations & Join Management
exports.inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, role } = req.body;
    const userId = req.user._id || req.user.id;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid members selected" });
    }

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    const inviter = await User.findById(userId);
    const createdInvites = [];

    for (const targetId of userIds) {
      const existingMem = journey.members.some((m) => (m.user?._id || m.user).toString() === targetId.toString());
      if (!existingMem) {
        const invite = await JourneyInvitation.findOneAndUpdate(
          { journeyId: id, inviteeId: targetId },
          { inviterId: userId, type: "invitation", status: "pending", role: role || "Member" },
          { upsert: true, new: true }
        );
        createdInvites.push(invite);

        await Notification.create({
          sender: userId,
          receiver: targetId,
          type: "journey_invitation",
          journey: id,
          message: `${inviter?.name || "An organizer"} invited you to join the journey "${journey.title}".`,
        });
      }
    }

    journey.pendingInvitationCount = await JourneyInvitation.countDocuments({ journeyId: id, status: "pending" });
    await journey.save();

    res.json({ success: true, message: "Invitations sent successfully", invites: createdInvites });
  } catch (error) {
    console.error("Error inviting members:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.acceptInvitation = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { invitationId } = req.params;
    const userId = req.user._id || req.user.id;

    const invitation = await JourneyInvitation.findById(invitationId).session(session);
    if (!invitation || invitation.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.inviteeId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this invitation" });
    }

    invitation.status = "accepted";
    await invitation.save({ session });

    const targetUserId = invitation.type === "request" ? invitation.inviterId : invitation.inviteeId;
    const journey = await Journey.findById(invitation.journeyId).session(session);

    if (journey) {
      const alreadyIn = journey.members.some((m) => (m.user?._id || m.user).toString() === targetUserId.toString());
      if (!alreadyIn) {
        journey.members.push({ user: targetUserId, role: invitation.role, joinedAt: new Date() });
        
        if (journey.journeyType === "Solo" && journey.members.length > 1) {
          journey.journeyType = "Friends";
        }
        journey.memberCount = journey.members.length;

        const [pCount, aCount] = await Promise.all([
          JourneyInvitation.countDocuments({ journeyId: journey._id, status: "pending" }).session(session),
          JourneyInvitation.countDocuments({ journeyId: journey._id, status: "accepted" }).session(session),
        ]);

        journey.pendingInvitationCount = pCount;
        journey.acceptedInvitationCount = aCount;
        await journey.save({ session });

        await JourneyMember.create([{ journeyId: journey._id, userId: targetUserId, role: invitation.role }], { session });

        if (journey.chatRoomId) {
          await ChatRoom.findByIdAndUpdate(journey.chatRoomId, { $addToSet: { members: targetUserId } }).session(session);
        }

        const user = await User.findById(targetUserId).session(session);
        await JourneyTimeline.create([{
          journeyId: journey._id,
          userId: targetUserId,
          userName: user?.name || "Traveler",
          userPic: user?.profilePic || "",
          eventType: "member_joined",
          title: "Member Joined",
          description: `${user?.name || "A traveler"} joined the squad!`,
        }], { session });

        // Notify matching recipient boundary correctly
        await Notification.create([{
          sender: userId,
          receiver: invitation.type === "request" ? targetUserId : journey.creator,
          type: invitation.type === "request" ? "journey_request_approved" : "journey_invitation_accepted",
          journey: journey._id,
          message: invitation.type === "request"
            ? `Your request to join "${journey.title}" was approved!`
            : `${user?.name || "A traveler"} accepted your invite to "${journey.title}".`,
        }], { session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Joined journey successfully",
      journey,
      redirectUrl: journey ? `/social/journeys/${journey._id}` : "/social/journeys",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error accepting invite:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findByIdAndUpdate(invitationId, { status: "rejected" }, { new: true });
    if (inv && inv.journeyId) {
      const pendingCount = await JourneyInvitation.countDocuments({ journeyId: inv.journeyId, status: "pending" });
      await Journey.findByIdAndUpdate(inv.journeyId, { pendingInvitationCount: pendingCount });
    }
    res.json({ success: true, message: "Invitation declined" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.leaveJourney = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).session(session);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "Creator cannot leave; please cancel or transfer journey" });
    }

    journey.members = journey.members.filter((m) => (m.user?._id || m.user).toString() !== userId.toString());
    journey.memberCount = journey.members.length;
    await journey.save({ session });

    await JourneyMember.findOneAndUpdate({ journeyId: id, userId }, { status: "left" }).session(session);
    
    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(journey.chatRoomId, { $pull: { members: userId } }).session(session);
    }

    const user = await User.findById(userId).session(session);
    await JourneyTimeline.create([{
      journeyId: id,
      userId,
      userName: user?.name || "Traveler",
      userPic: user?.profilePic || "",
      eventType: "member_left",
      title: "Member Left",
      description: `${user?.name || "A traveler"} left the journey.`,
    }], { session });

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: "Left journey successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error leaving journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.removeMember = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id, userId: targetUserId } = req.params;
    const currentUserId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).session(session);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: "Only creator can remove members" });
    }

    journey.members = journey.members.filter((m) => (m.user?._id || m.user).toString() !== targetUserId.toString());
    journey.memberCount = journey.members.length;
    await journey.save({ session });

    await JourneyMember.findOneAndUpdate({ journeyId: id, userId: targetUserId }, { status: "removed" }).session(session);
    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(journey.chatRoomId, { $pull: { members: targetUserId } }).session(session);
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, message: "Member removed successfully", journey });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 8. Workspace Notes CRUD
exports.getWorkspaceItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let filter = { journeyId: id };
    if (category && category !== "All") filter.category = category;

    const notes = await JourneyWorkspace.find(filter).sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addWorkspaceItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, content, items, isPinned } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const note = await JourneyWorkspace.create({
      journeyId: id,
      creatorId: userId,
      creatorName: user?.name || "Member",
      creatorPic: user?.profilePic || "",
      category: category || "Squad Notes",
      title: title ? title.trim() : "",
      content,
      items: items || [],
      isPinned: Boolean(isPinned),
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Error adding workspace note:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.updateWorkspaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (req.body.title) req.body.title = req.body.title.trim();
    const note = await JourneyWorkspace.findByIdAndUpdate(itemId, req.body, { new: true });
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteWorkspaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await JourneyWorkspace.findByIdAndDelete(itemId);
    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 9. Timeline & Safe Check-in
exports.getTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const timeline = await JourneyTimeline.find({ journeyId: id }).sort({ createdAt: -1 });
    res.json({ success: true, timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.safeCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInType, location, message } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    const entryTitle = `Safe Check-in: ${checkInType}`;
    const desc = `${user?.name || "Traveler"} checked in: "${checkInType}" ${location ? `at ${location}` : ""} ${message ? `(${message})` : ""}`;

    const timelineEntry = await JourneyTimeline.create({
      journeyId: id,
      userId,
      userName: user?.name || "Traveler",
      userPic: user?.profilePic || "",
      eventType: "safe_checkin",
      title: entryTitle,
      description: desc,
      checkInType,
    });

    journey.stats.checkInsCount = (journey.stats.checkInsCount || 0) + 1;
    await journey.save();

    const targetMembers = journey.members
      .map((m) => m.user?._id || m.user)
      .filter((memId) => memId.toString() !== userId.toString());

    if (targetMembers.length > 0) {
      await Notification.create(
        targetMembers.map((memId) => ({
          sender: userId,
          receiver: memId,
          type: "safe_checkin",
          journey: id,
          message: `${user?.name || "A travel buddy"} checked in safely: ${checkInType}`,
        }))
      );
    }

    res.json({ success: true, message: "Safe check-in broadcasted!", timelineEntry });
  } catch (error) {
    console.error("Error in safe check-in:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 10. Gallery & Memories
exports.getGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const gallery = await JourneyGallery.find({ journeyId: id }).sort({ createdAt: -1 });
    res.json({ success: true, gallery });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaUrl, mediaType, itemType, caption } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const item = await JourneyGallery.create({
      journeyId: id,
      uploaderId: userId,
      uploaderName: user?.name || "Member",
      uploaderPic: user?.profilePic || "",
      mediaUrl,
      mediaType: mediaType || "image",
      itemType: itemType || "photo",
      caption,
    });

    const journey = await Journey.findById(id);
    if (journey) {
      if (mediaType === "video") journey.stats.videosCount = (journey.stats.videosCount || 0) + 1;
      else journey.stats.photosCount = (journey.stats.photosCount || 0) + 1;
      await journey.save();
    }

    await JourneyTimeline.create({
      journeyId: id,
      userId,
      userName: user?.name || "Member",
      userPic: user?.profilePic || "",
      eventType: "photo_uploaded",
      title: "Photo Uploaded",
      description: `Uploaded new memory capture`,
      mediaUrl,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMemories = async (req, res) => {
  try {
    const { id } = req.params;
    let mem = await JourneyMemory.findOne({ journeyId: id }).populate("participants.userId", "name profilePic");
    if (!mem) {
      const journey = await Journey.findById(id).populate("members.user", "name profilePic");
      if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });
      await syncJourneyStatus(journey);
      mem = await JourneyMemory.findOne({ journeyId: id }).populate("participants.userId", "name profilePic");
    }
    res.json({ success: true, memory: mem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addMemoryComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const mem = await JourneyMemory.findOneAndUpdate(
      { journeyId: id },
      {
        $push: {
          comments: {
            userId,
            userName: user?.name || "Traveler",
            userPic: user?.profilePic || "",
            text,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({ success: true, memory: mem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.reactToMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id || req.user.id;

    const mem = await JourneyMemory.findOneAndUpdate(
      { journeyId: id },
      { $push: { reactions: { userId, emoji, createdAt: new Date() } } },
      { new: true }
    );

    res.json({ success: true, memory: mem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 11. Travel Passport Statistics & Badges
exports.getUserStatistics = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id || req.user.id;

    const journeys = await Journey.find({
      $or: [{ creator: targetUserId }, { "members.user": targetUserId }],
    });

    let total = journeys.length;
    let completed = 0;
    let upcoming = 0;
    let cancelled = 0;
    let travelDays = 0;
    let destMap = {};

    journeys.forEach((j) => {
      if (j.status === "Completed") {
        completed++;
        travelDays += j.durationDays || 1;
      } else if (j.status === "Upcoming") upcoming++;
      else if (j.status === "Cancelled") cancelled++;

      if (j.destination) {
        destMap[j.destination] = (destMap[j.destination] || 0) + 1;
      }
    });

    let mostVisited = "None";
    let maxCount = 0;
    Object.keys(destMap).forEach((d) => {
      if (destMap[d] > maxCount) {
        maxCount = destMap[d];
        mostVisited = d;
      }
    });

    const [postsShared, storiesShared] = await Promise.all([
      Post.countDocuments({ userId: targetUserId }),
      Story.countDocuments({ userId: targetUserId })
    ]);

    const badges = [];
    if (total >= 1) {
      badges.push({ id: "first_journey", title: "First Journey", icon: "Milestone", desc: "Started your travel legacy on Go yatriGo" });
    }
    if (journeys.some((j) => (j.durationDays || 1) <= 3 && j.status === "Completed")) {
      badges.push({ id: "weekend_traveler", title: "Weekend Traveler", icon: "Compass", desc: "Mastered quick weekend escapes" });
    }
    if (journeys.some((j) => /beach|goa|andaman|bali|gokarna/i.test(j.destination))) {
      badges.push({ id: "beach_lover", title: "Beach Lover", icon: "Sun", desc: "Sun, sand, and ocean vibes" });
    }
    if (journeys.some((j) => /manali|leh|ladakh|shimla|mountain|ooty/i.test(j.destination))) {
      badges.push({ id: "mountain_explorer", title: "Mountain Explorer", icon: "Mountain", desc: "Conquered the high altitudes" });
    }
    if (journeys.some((j) => (j.members?.length || 1) >= 4)) {
      badges.push({ id: "community_traveler", title: "Community Traveler", icon: "Users", desc: "Traveled with a thriving squad" });
    }
    if (storiesShared >= 3) {
      badges.push({ id: "storyteller", title: "Storyteller", icon: "Sparkles", desc: "Shared inspiring visual memories" });
    }
    if (postsShared >= 5) {
      badges.push({ id: "memory_collector", title: "Memory Collector", icon: "Camera", desc: "Documented the journey beautifully" });
    }

    res.json({
      success: true,
      stats: {
        totalJourneys: total,
        completed,
        upcoming,
        cancelled,
        travelDays,
        photosShared: postsShared,
        storiesShared,
        postsShared,
        mostVisitedDestination: mostVisited,
        achievements: badges,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 12. Get My Received Invitations (Notifications Center)
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query;

    const filter = { inviteeId: userId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const invitations = await JourneyInvitation.find(filter)
      .populate("journeyId", "title coverImage destination startDate endDate journeyType members creator status")
      .populate("inviterId", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Error loading user invitations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 13. Get Previous Companions (Traveled With)
exports.getPreviousCompanions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 50;

    const journeys = await Journey.find({
      $or: [{ creator: userId }, { "members.user": userId }],
      status: { $ne: "Cancelled" },
    })
      .populate("members.user", "name username bio pic avatar profilePic isVerified verificationStatus")
      .populate("creator", "name username bio pic avatar profilePic isVerified verificationStatus")
      .sort({ startDate: -1, createdAt: -1 });

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
                date: j.startDate || j.createdAt,
              },
              category: "Previous Companions",
              pill: "Past Companion",
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
          companions: journeyCompanions,
        });
      }
    });

    let companions = Object.values(companionMap);

    if (search.trim()) {
      const kw = search.toLowerCase();
      companions = companions.filter(
        (c) => (c.name && c.name.toLowerCase().includes(kw)) || (c.username && c.username.toLowerCase().includes(kw))
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
      groupedByJourney: groupedByJourney.slice(0, 10),
    });
  } catch (error) {
    console.error("Error loading previous companions:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 14. Get Sent Invitations for Journey (Organizer Roster)
exports.getJourneyInvitations = async (req, res) => {
  try {
    const { id } = req.params;
    const invitations = await JourneyInvitation.find({ journeyId: id })
      .populate("inviteeId", "name profilePic email")
      .populate("inviterId", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Error loading journey invitations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 15. Resend Invitation
exports.resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findById(invitationId).populate("journeyId", "title");
    if (!inv) return res.status(404).json({ success: false, message: "Invitation not found" });

    inv.status = "pending";
    inv.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await inv.save();

    await Notification.create({
      sender: req.user._id || req.user.id,
      receiver: inv.inviteeId,
      type: "journey_invitation",
      journey: inv.journeyId?._id || inv.journeyId,
      message: `Reminder: You have a pending invitation to join "${inv.journeyId?.title || "a journey"}"`,
    });

    res.json({ success: true, message: "Invitation resent successfully", invitation: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 16. Cancel Invitation
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findById(invitationId);
    if (!inv) return res.status(404).json({ success: false, message: "Invitation not found" });

    inv.status = "cancelled";
    await inv.save();

    const pendingCount = await JourneyInvitation.countDocuments({ journeyId: inv.journeyId, status: "pending" });
    await Journey.findByIdAndUpdate(inv.journeyId, { pendingInvitationCount: pendingCount });

    res.json({ success: true, message: "Invitation revoked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 17. Update Member Role (Promote / Transfer Ownership)
exports.updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const requesterId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== requesterId.toString()) {
      return res.status(403).json({ success: false, message: "Only the Organizer can manage member roles" });
    }

    const memIndex = journey.members.findIndex((m) => (m.user?._id || m.user).toString() === userId.toString());
    if (memIndex === -1) {
      return res.status(404).json({ success: false, message: "Member not found in squad" });
    }

    journey.members[memIndex].role = role;

    if (role === "Organizer") {
      const oldOwnerIndex = journey.members.findIndex((m) => (m.user?._id || m.user).toString() === requesterId.toString());
      if (oldOwnerIndex !== -1) {
        journey.members[oldOwnerIndex].role = "Co-Organizer";
      }
      journey.creator = userId;
    }

    await journey.save();
    await JourneyMember.findOneAndUpdate({ journeyId: id, userId }, { role });

    res.json({ success: true, message: `Member role updated to ${role}`, journey });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};