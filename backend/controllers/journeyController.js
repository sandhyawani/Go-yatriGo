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

// ----------------------------------------------------
// Helper: Compute & Synchronize Lifecycle Status
// ----------------------------------------------------
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

      // Generate AI Summary if not present
      if (!journey.aiSummary) {
        const memberCount = journey.members?.length || 1;
        journey.aiSummary = `Your ${journey.durationDays || 3}-day ${journey.destination} collaborative journey included ${memberCount} travelers, exploring local scenic highlights, sharing incredible memories, and building lifelong travel friendships.`;
      }

      // Create persistent memory archive if not created yet
      const existingMem = await JourneyMemory.findOne({
        journeyId: journey._id,
      });
      if (!existingMem) {
        await JourneyMemory.create({
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
            {
              title: "Journey Created",
              eventType: "journey_created",
              createdAt: journey.createdAt,
            },
            {
              title: "Journey Started",
              eventType: "journey_started",
              createdAt: journey.startDate,
            },
            {
              title: "Journey Completed Successfully",
              eventType: "journey_completed",
              createdAt: now,
            },
          ],
        });
      }

      // Add timeline entry
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

const TravelGroup = require("../models/TravelGroup");

// ----------------------------------------------------
// 1. Create Journey (Master Source Architecture)
// ----------------------------------------------------
exports.createJourney = async (req, res) => {
  try {
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
    const user = await User.findById(userId);

    const finalSourceType = sourceType || "manual";
    let membersList = [
      { user: userId, role: "Organizer", joinedAt: new Date() },
    ];
    let chatMembers = [userId];

    // If launched from Explore squad, import approved members automatically
    if (finalSourceType === "explore" && sourceId) {
      const exploreGroup = await TravelGroup.findById(sourceId);
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

    // Create group chat room for the journey
    const chatRoom = await ChatRoom.create({
      name: `${title} Squad`,
      type: "group",
      members: chatMembers,
    });

    const newJourney = await Journey.create({
      title,
      description,
      coverImage,
      destination,
      destinationCoordinates,
      startDate,
      endDate,
      privacy: privacy || "Public",
      journeyType: membersList.length > 1 ? "Friends" : journeyType || "Solo",
      status: "Planning",
      sourceType: finalSourceType,
      sourceId: sourceId || null,
      createdFrom:
        finalSourceType === "explore"
          ? "Explore Travel Squad"
          : "Manual Creation",
      creator: userId,
      members: membersList,
      memberCount: membersList.length,
      chatRoomId: chatRoom._id,
    });

    chatRoom.journeyId = newJourney._id;
    await chatRoom.save();

    // Create JourneyMember entries for all enrolled members
    await Promise.all(
      membersList.map((m) =>
        JourneyMember.create({
          journeyId: newJourney._id,
          userId: m.user,
          role: m.role,
        }),
      ),
    );

    // Initial timeline entry
    await JourneyTimeline.create({
      journeyId: newJourney._id,
      userId,
      userName: user ? user.name : "Organizer",
      userPic: user ? user.profilePic : "",
      eventType: "journey_created",
      title: "Journey Created",
      description: `Organized a new travel workspace for ${destination}`,
    });

    // If manual/friends/followers and invitedUserIds provided, generate Journey Invitations
    if (
      finalSourceType !== "explore" &&
      Array.isArray(invitedUserIds) &&
      invitedUserIds.length > 0
    ) {
      const validIds = invitedUserIds.filter(
        (id) => id && id !== userId.toString(),
      );
      if (validIds.length > 0) {
        await Promise.all(
          validIds.map((invId) =>
            JourneyInvitation.create({
              journeyId: newJourney._id,
              inviterId: userId,
              inviteeId: invId,
              type: "invitation",
              status: "pending",
              role: "Member",
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }),
          ),
        );

        newJourney.pendingInvitationCount = validIds.length;
        await newJourney.save();

        await Promise.all(
          validIds.map((invId) =>
            Notification.create({
              sender: userId,
              receiver: invId,
              type: "journey_invitation",
              journey: newJourney._id,
              message: `${user?.name || "A traveler"} invited you to join "${title}"`,
            }),
          ),
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Journey created successfully",
      journey: newJourney,
    });
  } catch (error) {
    console.error("Error creating journey:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// ----------------------------------------------------
// 2. Get My Journeys (Filtered by Status Tab)
// ----------------------------------------------------
exports.getMyJourneys = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query; // Upcoming, Ongoing, Completed, Cancelled, all

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

    // Synchronize statuses
    const syncedJourneys = await Promise.all(
      journeys.map((j) => syncJourneyStatus(j)),
    );

    // If query asked for specific status after sync, re-filter in memory
    const finalJourneys =
      status && status !== "all"
        ? syncedJourneys.filter((j) => j.status === status)
        : syncedJourneys;

    const journeysWithCounts = await Promise.all(
      finalJourneys.map(async (j) => {
        const pendingCount = await JourneyInvitation.countDocuments({
          journeyId: j._id,
          status: "pending",
        });
        const acceptedCount = await JourneyInvitation.countDocuments({
          journeyId: j._id,
          status: "accepted",
        });
        const jobj = j.toObject ? j.toObject() : { ...j._doc };
        jobj.pendingInvitationCount = pendingCount;
        jobj.acceptedInvitationCount = acceptedCount;
        return jobj;
      }),
    );

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

// ----------------------------------------------------
// 3. Get Journey Details
// ----------------------------------------------------
exports.getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    let journey = await Journey.findById(id)
      .populate("creator", "name profilePic bio")
      .populate("members.user", "name profilePic bio");

    if (!journey) {
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });
    }

    journey = await syncJourneyStatus(journey);

    const pendingCount = await JourneyInvitation.countDocuments({
      journeyId: journey._id,
      status: "pending",
    });
    const acceptedCount = await JourneyInvitation.countDocuments({
      journeyId: journey._id,
      status: "accepted",
    });
    const timeline = await JourneyTimeline.find({
      journeyId: journey._id,
    }).sort({ createdAt: -1 });
    const journeyObj = journey.toObject
      ? journey.toObject()
      : { ...journey._doc };
    journeyObj.pendingInvitationCount = pendingCount;
    journeyObj.acceptedInvitationCount = acceptedCount;
    journeyObj.timeline = timeline;

    res.json({
      success: true,
      journey: journeyObj,
    });
  } catch (error) {
    console.error("Error fetching journey details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 4. Update Journey
// ----------------------------------------------------
exports.updateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    // Verify Organizer role
    const isOrg = journey.members.some(
      (m) =>
        (m.user?.toString() === userId.toString() ||
          m.user?._id?.toString() === userId.toString()) &&
        (m.role === "Organizer" || m.role === "Co-Organizer"),
    );
    if (!isOrg && journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this journey",
      });
    }

    const updatableFields = [
      "title",
      "description",
      "coverImage",
      "destination",
      "destinationCoordinates",
      "startDate",
      "endDate",
      "privacy",
      "journeyType",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        journey[field] = req.body[field];
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

    res.json({
      success: true,
      message: "Journey updated successfully",
      journey,
    });
  } catch (error) {
    console.error("Error updating journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 5. Cancel Journey
// ----------------------------------------------------
exports.cancelJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only journey creator can cancel" });
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

    // Notify members
    for (const mem of journey.members) {
      const memId = mem.user?._id || mem.user;
      if (memId.toString() !== userId.toString()) {
        await Notification.create({
          sender: userId,
          receiver: memId,
          type: "journey_cancelled",
          journey: journey._id,
          message: `The journey "${journey.title}" has been cancelled by the organizer.`,
        });
      }
    }

    res.json({
      success: true,
      message: "Journey cancelled successfully",
      journey,
    });
  } catch (error) {
    console.error("Error cancelling journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 6. Delete Journey (Only if Cancelled)
// ----------------------------------------------------
exports.deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only creator can delete journey" });
    }

    if (journey.status !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Journey must be cancelled before deletion",
      });
    }

    await Journey.findByIdAndDelete(id);
    await JourneyMember.deleteMany({ journeyId: id });
    await JourneyTimeline.deleteMany({ journeyId: id });
    await JourneyWorkspace.deleteMany({ journeyId: id });
    await JourneyGallery.deleteMany({ journeyId: id });
    await JourneyInvitation.deleteMany({ journeyId: id });
    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndDelete(journey.chatRoomId);
    }

    res.json({ success: true, message: "Journey deleted permanently" });
  } catch (error) {
    console.error("Error deleting journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 7. Member Invitations & Join Management
// ----------------------------------------------------
exports.inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, role } = req.body; // userIds array
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    const inviter = await User.findById(userId);

    const createdInvites = [];
    for (const targetId of userIds) {
      const existingMem = journey.members.some(
        (m) => (m.user?._id || m.user).toString() === targetId.toString(),
      );
      if (!existingMem) {
        const invite = await JourneyInvitation.findOneAndUpdate(
          { journeyId: id, inviteeId: targetId },
          {
            inviterId: userId,
            type: "invitation",
            status: "pending",
            role: role || "Member",
          },
          { upsert: true, new: true },
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

    const pendingCount = await JourneyInvitation.countDocuments({
      journeyId: id,
      status: "pending",
    });
    journey.pendingInvitationCount = pendingCount;
    await journey.save();

    res.json({
      success: true,
      message: "Invitations sent successfully",
      invites: createdInvites,
    });
  } catch (error) {
    console.error("Error inviting members:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id || req.user.id;

    const invitation = await JourneyInvitation.findById(invitationId);
    if (!invitation || invitation.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired invitation" });
    }

    if (invitation.inviteeId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this invitation",
      });
    }

    invitation.status = "accepted";
    await invitation.save();

    const targetUserId =
      invitation.type === "request"
        ? invitation.inviterId
        : invitation.inviteeId;

    const journey = await Journey.findById(invitation.journeyId);
    if (journey) {
      const alreadyIn = journey.members.some(
        (m) => (m.user?._id || m.user).toString() === targetUserId.toString(),
      );
      if (!alreadyIn) {
        journey.members.push({
          user: targetUserId,
          role: invitation.role,
          joinedAt: new Date(),
        });
        if (journey.journeyType === "Solo" && journey.members.length > 1) {
          journey.journeyType = "Friends";
        }
        journey.memberCount = journey.members.length;
        const pendingCount = await JourneyInvitation.countDocuments({
          journeyId: journey._id,
          status: "pending",
        });
        const acceptedCount = await JourneyInvitation.countDocuments({
          journeyId: journey._id,
          status: "accepted",
        });
        journey.pendingInvitationCount = pendingCount;
        journey.acceptedInvitationCount = acceptedCount;
        await journey.save();

        await JourneyMember.create({
          journeyId: journey._id,
          userId: targetUserId,
          role: invitation.role,
        });

        if (journey.chatRoomId) {
          await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
            $addToSet: { members: targetUserId },
          });
        }

        const user = await User.findById(targetUserId);
        await JourneyTimeline.create({
          journeyId: journey._id,
          userId: targetUserId,
          userName: user?.name || "Traveler",
          userPic: user?.profilePic || "",
          eventType: "member_joined",
          title: "Member Joined",
          description: `${user?.name || "A traveler"} joined the squad!`,
        });

        // Notify appropriate party
        await Notification.create({
          sender: userId,
          receiver:
            invitation.type === "request" ? targetUserId : journey.creator,
          type:
            invitation.type === "request"
              ? "journey_request_approved"
              : "journey_invitation_accepted",
          journey: journey._id,
          message:
            invitation.type === "request"
              ? `Your request to join "${journey.title}" was approved!`
              : `${user?.name || "A traveler"} accepted your invite to "${journey.title}".`,
        });
      }
    }

    res.json({
      success: true,
      message: "Joined journey successfully",
      journey,
      redirectUrl: journey
        ? `/social/journeys/${journey._id}`
        : "/social/journeys",
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findByIdAndUpdate(invitationId, {
      status: "rejected",
    });
    if (inv && inv.journeyId) {
      const pendingCount = await JourneyInvitation.countDocuments({
        journeyId: inv.journeyId,
        status: "pending",
      });
      await Journey.findByIdAndUpdate(inv.journeyId, {
        pendingInvitationCount: pendingCount,
      });
    }
    res.json({ success: true, message: "Invitation declined" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.leaveJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Creator cannot leave; please cancel or transfer journey",
      });
    }

    journey.members = journey.members.filter(
      (m) => (m.user?._id || m.user).toString() !== userId.toString(),
    );
    await journey.save();

    await JourneyMember.findOneAndUpdate(
      { journeyId: id, userId },
      { status: "left" },
    );
    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
        $pull: { members: userId },
      });
    }

    const user = await User.findById(userId);
    await JourneyTimeline.create({
      journeyId: id,
      userId,
      userName: user?.name || "Traveler",
      userPic: user?.profilePic || "",
      eventType: "member_left",
      title: "Member Left",
      description: `${user?.name || "A traveler"} left the journey.`,
    });

    res.json({ success: true, message: "Left journey successfully" });
  } catch (error) {
    console.error("Error leaving journey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const currentUserId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only creator can remove members" });
    }

    journey.members = journey.members.filter(
      (m) => (m.user?._id || m.user).toString() !== targetUserId.toString(),
    );
    await journey.save();

    await JourneyMember.findOneAndUpdate(
      { journeyId: id, userId: targetUserId },
      { status: "removed" },
    );
    if (journey.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(journey.chatRoomId, {
        $pull: { members: targetUserId },
      });
    }

    res.json({
      success: true,
      message: "Member removed successfully",
      journey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 8. Workspace Notes CRUD
// ----------------------------------------------------
exports.getWorkspaceItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let filter = { journeyId: id };
    if (category && category !== "All") filter.category = category;

    const notes = await JourneyWorkspace.find(filter).sort({
      isPinned: -1,
      updatedAt: -1,
    });
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
      title,
      content,
      items: items || [],
      isPinned: Boolean(isPinned),
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Error adding workspace note:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

exports.updateWorkspaceItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const note = await JourneyWorkspace.findByIdAndUpdate(itemId, req.body, {
      new: true,
    });
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

// ----------------------------------------------------
// 9. Timeline & Safe Check-in
// ----------------------------------------------------
exports.getTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const timeline = await JourneyTimeline.find({ journeyId: id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.safeCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInType, location, message } = req.body; // Started Journey, Reached Destination, etc.
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

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

    // Notify other members
    for (const mem of journey.members) {
      const memId = mem.user?._id || mem.user;
      if (memId.toString() !== userId.toString()) {
        await Notification.create({
          sender: userId,
          receiver: memId,
          type: "safe_checkin",
          journey: id,
          message: `${user?.name || "A travel buddy"} checked in safely: ${checkInType}`,
        });
      }
    }

    res.json({
      success: true,
      message: "Safe check-in broadcasted!",
      timelineEntry,
    });
  } catch (error) {
    console.error("Error in safe check-in:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 10. Gallery & Memories
// ----------------------------------------------------
exports.getGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const gallery = await JourneyGallery.find({ journeyId: id }).sort({
      createdAt: -1,
    });
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
      if (mediaType === "video")
        journey.stats.videosCount = (journey.stats.videosCount || 0) + 1;
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
    let mem = await JourneyMemory.findOne({ journeyId: id }).populate(
      "participants.userId",
      "name profilePic",
    );
    if (!mem) {
      const journey = await Journey.findById(id).populate(
        "members.user",
        "name profilePic",
      );
      if (!journey)
        return res
          .status(404)
          .json({ success: false, message: "Journey not found" });
      await syncJourneyStatus(journey);
      mem = await JourneyMemory.findOne({ journeyId: id }).populate(
        "participants.userId",
        "name profilePic",
      );
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
      { new: true },
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
      { new: true },
    );

    res.json({ success: true, memory: mem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 11. Travel Passport Statistics & Badges
// ----------------------------------------------------
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

    // Count posts and stories shared by user
    const postsShared = await Post.countDocuments({ userId: targetUserId });
    const storiesShared = await Story.countDocuments({ userId: targetUserId });

    // Achievements calculation
    const badges = [];
    if (total >= 1)
      badges.push({
        id: "first_journey",
        title: "First Journey",
        icon: "Milestone",
        desc: "Started your travel legacy on Go yatriGo",
      });
    if (
      journeys.some(
        (j) => (j.durationDays || 1) <= 3 && j.status === "Completed",
      )
    )
      badges.push({
        id: "weekend_traveler",
        title: "Weekend Traveler",
        icon: "Compass",
        desc: "Mastered quick weekend escapes",
      });
    if (
      journeys.some((j) =>
        /beach|goa|andaman|bali|gokarna/i.test(j.destination),
      )
    )
      badges.push({
        id: "beach_lover",
        title: "Beach Lover",
        icon: "Sun",
        desc: "Sun, sand, and ocean vibes",
      });
    if (
      journeys.some((j) =>
        /manali|leh|ladakh|shimla|mountain|ooty/i.test(j.destination),
      )
    )
      badges.push({
        id: "mountain_explorer",
        title: "Mountain Explorer",
        icon: "Mountain",
        desc: "Conquered the high altitudes",
      });
    if (journeys.some((j) => (j.members?.length || 1) >= 4))
      badges.push({
        id: "community_traveler",
        title: "Community Traveler",
        icon: "Users",
        desc: "Traveled with a thriving squad",
      });
    if (storiesShared >= 3)
      badges.push({
        id: "storyteller",
        title: "Storyteller",
        icon: "Sparkles",
        desc: "Shared inspiring visual memories",
      });
    if (postsShared >= 5)
      badges.push({
        id: "memory_collector",
        title: "Memory Collector",
        icon: "Camera",
        desc: "Documented the journey beautifully",
      });

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

// ----------------------------------------------------
// 15. Get My Received Invitations (Notifications Center)
// ----------------------------------------------------
exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query; // pending, accepted, rejected, expired, all

    const filter = { inviteeId: userId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const invitations = await JourneyInvitation.find(filter)
      .populate(
        "journeyId",
        "title coverImage destination startDate endDate journeyType members creator status",
      )
      .populate("inviterId", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Error loading user invitations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 15b. Get Previous Companions (Traveled With)
// ----------------------------------------------------
exports.getPreviousCompanions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 50;

    // Find all journeys where current user is creator or member
    const journeys = await Journey.find({
      $or: [{ creator: userId }, { "members.user": userId }],
      status: { $ne: "Cancelled" },
    })
      .populate(
        "members.user",
        "name username bio pic avatar profilePic isVerified verificationStatus",
      )
      .populate(
        "creator",
        "name username bio pic avatar profilePic isVerified verificationStatus",
      )
      .sort({ startDate: -1, createdAt: -1 });

    const companionMap = {};
    const groupedByJourney = [];

    journeys.forEach((j) => {
      const journeyCompanions = [];
      const allUsersInJourney = [];

      if (j.creator && j.creator._id) {
        allUsersInJourney.push(j.creator);
      }
      if (j.members && Array.isArray(j.members)) {
        j.members.forEach((m) => {
          if (m.user && m.user._id) {
            allUsersInJourney.push(m.user);
          }
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

    // Filter by search if provided
    if (search.trim()) {
      const kw = search.toLowerCase();
      companions = companions.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(kw)) ||
          (c.username && c.username.toLowerCase().includes(kw)),
      );
    }

    // Sort by most shared trips, then most recent trip
    companions.sort((a, b) => {
      if (b.tripsCount !== a.tripsCount) {
        return b.tripsCount - a.tripsCount;
      }
      const dateA = new Date(a.lastJourney.date).getTime();
      const dateB = new Date(b.lastJourney.date).getTime();
      return dateB - dateA;
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

// ----------------------------------------------------
// 16. Get Sent Invitations for Journey (Organizer Roster)
// ----------------------------------------------------
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

// ----------------------------------------------------
// 17. Resend Invitation
// ----------------------------------------------------
exports.resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findById(invitationId).populate(
      "journeyId",
      "title",
    );
    if (!inv)
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });

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

    res.json({
      success: true,
      message: "Invitation resent successfully",
      invitation: inv,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 18. Cancel Invitation
// ----------------------------------------------------
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const inv = await JourneyInvitation.findById(invitationId);
    if (!inv)
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });

    inv.status = "cancelled";
    await inv.save();

    const pendingCount = await JourneyInvitation.countDocuments({
      journeyId: inv.journeyId,
      status: "pending",
    });
    await Journey.findByIdAndUpdate(inv.journeyId, {
      pendingInvitationCount: pendingCount,
    });

    res.json({ success: true, message: "Invitation revoked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ----------------------------------------------------
// 19. Update Member Role (Promote / Transfer Ownership)
// ----------------------------------------------------
exports.updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; // Organizer, Co-Organizer, Member
    const requesterId = req.user._id || req.user.id;

    const journey = await Journey.findById(id);
    if (!journey)
      return res
        .status(404)
        .json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== requesterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the Organizer can manage member roles",
      });
    }

    const memIndex = journey.members.findIndex(
      (m) => (m.user?._id || m.user).toString() === userId.toString(),
    );
    if (memIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "Member not found in squad" });

    journey.members[memIndex].role = role;

    if (role === "Organizer") {
      const oldOwnerIndex = journey.members.findIndex(
        (m) => (m.user?._id || m.user).toString() === requesterId.toString(),
      );
      if (oldOwnerIndex !== -1) {
        journey.members[oldOwnerIndex].role = "Co-Organizer";
      }
      journey.creator = userId;
    }

    await journey.save();

    await JourneyMember.findOneAndUpdate({ journeyId: id, userId }, { role });

    res.json({
      success: true,
      message: `Member role updated to ${role}`,
      journey,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
