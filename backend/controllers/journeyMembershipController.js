const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyTimeline = require("../models/JourneyTimeline");
const Notification = require("../models/Notification");
const { createAndSendNotification } = require("../utils/notificationHelper");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const { syncJourneyStatus } = require("./journeyLifecycleController");
const { isBlockedPair } = require("../utils/blockHelper");
const {
  canJoinJourney,
  canInviteMembers,
  canLeaveJourney,
  canAssignCoLeader,
  canRemoveCoLeader,
  canWarnMember
} = require("../services/journeyEligibility");

// Revoke Socket.IO room access when a user leaves or is removed.
const revokeSocketRoomAccess = (req, userId, roomId) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers && userId && roomId) {
      const uStr = userId.toString();
      const rStr = roomId.toString();
      const socketIds = onlineUsers.get(uStr);
      if (socketIds) {
        const socketIdArray = socketIds instanceof Set ? Array.from(socketIds) : Array.isArray(socketIds) ? socketIds : [socketIds];
        socketIdArray.forEach((socketId) => {
          const sock = io.sockets.sockets.get(socketId);
          if (sock) {
            sock.leave(rStr);
          }
        });
      }
      io.to(uStr).emit("room_access_revoked", { roomId: rStr });
    }
  } catch (err) {
    console.error("Error revoking socket room access:", err);
  }
};

exports.inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const userIds = req.body.userIds || req.body.invitedUserIds;
    const userId = req.user._id || req.user.id;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid members selected" });
    }

    let journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });

    journey = await syncJourneyStatus(journey);

    const inviteCheck = canInviteMembers(userId, journey);
    if (inviteCheck.allowed === false) {
      return res.status(inviteCheck.statusCode || 400).json({
        success: false,
        code: inviteCheck.code,
        message: inviteCheck.reason
      });
    }

    const inviter = await User.findById(userId);
    const createdInvites = [];

    for (const targetId of userIds) {
      const isBlocked = await isBlockedPair(userId, targetId);
      if (isBlocked) {
        continue;
      }

      const isAlreadyMember = journey.members.some(
        (m) => (m.user?._id || m.user).toString() === targetId.toString()
      );
      if (isAlreadyMember) {
        continue;
      }

      const existingPendingInvite = await JourneyInvitation.findOne({
        journeyId: id,
        inviteeId: targetId,
        status: "pending"
      });
      if (existingPendingInvite) {
        continue;
      }

      const targetUser = await User.findById(targetId);
      if (targetUser && targetUser.privacySettings) {
        const mode = targetUser.privacySettings.journeyInvites || "everyone";
        if (mode === "none") {
          continue;
        }
        if (mode === "mates_only") {
          const { getValidTripMates } = require("./tripMateController");
          const validMates = await getValidTripMates(userId);
          const isMate = validMates.some(m => m._id.toString() === targetId.toString());
          if (!isMate) {
            continue;
          }
        }
      }

      const invite = await JourneyInvitation.findOneAndUpdate(
        { journeyId: id, inviteeId: targetId },
        { inviterId: userId, type: "invitation", status: "pending", role: role || "Member" },
        { upsert: true, new: true }
      );
      createdInvites.push(invite);

      await createAndSendNotification(req.app.get("io"), {
        sender: userId,
        receiver: targetId,
        type: "journey_invitation",
        journey: id,
        invitation: invite._id,
        message: `${inviter?.name || "An organizer"} invited you to join the journey "${journey.title}".`
      });
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
  const maxRetries = 6;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let session = null;
    try {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
      const sessionOpt = session ? { session } : {};

      const invitationId = req.params.invitationId || req.params.id;
      const userId = req.user._id || req.user.id;

      const invitation = await JourneyInvitation.findById(invitationId).session(session || null);
      if (!invitation) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ success: false, message: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({ success: false, message: "Invitation has already been processed" });
      }

      if (invitation.inviteeId.toString() !== userId.toString()) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(403).json({ success: false, message: "Not authorized for this invitation" });
      }

      const targetUserId = invitation.type === "request" ? invitation.inviterId : invitation.inviteeId;

      // Atomically serialize join operations for this user across concurrent requests
      if (session) {
        await User.findByIdAndUpdate(targetUserId, { $inc: { __v: 1 } }, sessionOpt);
      }

      let journey = await Journey.findById(invitation.journeyId).session(session || null);

      if (!journey) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });
      }

      journey = await syncJourneyStatus(journey);

      const eligibility = await canJoinJourney(targetUserId, journey, { session: session || null });
      if (eligibility.allowed === false) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({
          success: false,
          code: eligibility.code,
          message: eligibility.reason
        });
      }

      const updatedJourney = await Journey.findOneAndUpdate(
        {
          _id: journey._id,
          status: { $in: ["Planning", "Upcoming"] },
          "members.user": { $ne: targetUserId },
          $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }
        },
        {
          $push: { members: { user: targetUserId, role: invitation.role, joinedAt: new Date() } },
          $inc: { memberCount: 1 }
        },
        { new: true, ...sessionOpt }
      );

      if (!updatedJourney) {
        const currentJourney = await Journey.findById(journey._id).session(session || null);
        if (currentJourney && currentJourney.members.length >= (currentJourney.maxMembers || 50)) {
          invitation.status = "capacity_full";
          await invitation.save(sessionOpt);
          if (session) { await session.commitTransaction(); session.endSession(); }
          return res.status(400).json({ success: false, message: "Journey capacity is full" });
        } else {
          invitation.status = "accepted";
          await invitation.save(sessionOpt);
          if (session) { await session.commitTransaction(); session.endSession(); }
          return res.json({ success: true, message: "User is already a member", journey: currentJourney || journey });
        }
      }

      invitation.status = "accepted";
      await invitation.save(sessionOpt);

      if (updatedJourney.journeyType === "Solo" && updatedJourney.members.length > 1) {
        await Journey.findByIdAndUpdate(updatedJourney._id, { journeyType: "Friends" }, sessionOpt);
      }

      await JourneyMember.findOneAndUpdate(
        { journeyId: updatedJourney._id, userId: targetUserId },
        { status: "active", role: invitation.role, joinedAt: new Date() },
        { upsert: true, ...sessionOpt }
      );

      if (journey.chatRoomId) {
        await ChatRoom.findByIdAndUpdate(journey.chatRoomId, { $addToSet: { members: targetUserId } }).session(session || null);
      }

      const user = await User.findById(targetUserId).session(session || null);
      await JourneyTimeline.create([{
        journeyId: journey._id,
        userId: targetUserId,
        userName: user?.name || "Traveler",
        userPic: user?.profilePic || "",
        eventType: "member_joined",
        title: "Member Joined",
        description: `${user?.name || "A traveler"} joined the squad!`
      }], sessionOpt);

      await Notification.create([{
        sender: userId,
        receiver: invitation.type === "request" ? targetUserId : journey.creator,
        type: "journey_invite_accepted",
        journey: journey._id,
        message: `${user?.name || "A traveler"} accepted the invitation to join "${journey.title}".`
      }], sessionOpt);

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      return res.json({ success: true, message: "Invitation accepted successfully", journey });
    } catch (error) {
      if (session) {
        try { await session.abortTransaction(); session.endSession(); } catch (e) {}
      }
      if (
        (error.hasErrorLabel?.('TransientTransactionError') ||
          error.code === 112 ||
          error.codeName === 'WriteConflict' ||
          (error.errorLabels && error.errorLabels.has && error.errorLabels.has('TransientTransactionError'))) &&
        attempt < maxRetries
      ) {
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100)));
        continue;
      }
      console.error("Error accepting invitation:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId || req.params.id;
    
    const inv = await JourneyInvitation.findById(invitationId);
    if (!inv) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    if (inv.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot reject invitation that is already ${inv.status}` });
    }

    inv.status = "rejected";
    await inv.save();

    if (inv.journeyId) {
      const pendingCount = await JourneyInvitation.countDocuments({ journeyId: inv.journeyId, status: "pending" });
      await Journey.findByIdAndUpdate(inv.journeyId, { pendingInvitationCount: pendingCount });
    }
    res.json({ success: true, message: "Invitation declined" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMyInvitations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status } = req.query;

    const filter = { inviteeId: userId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const invitations = await JourneyInvitation.find(filter).
    populate("journeyId", "title coverImage destination startDate endDate journeyType members creator status").
    populate("inviterId", "name profilePic pic img avatar").
    sort({ createdAt: -1 });

    res.json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Error loading user invitations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getJourneyInvitations = async (req, res) => {
  try {
    const { id } = req.params;
    const invitations = await JourneyInvitation.find({ journeyId: id }).
    populate("inviteeId", "name profilePic pic img avatar email").
    populate("inviterId", "name profilePic pic img avatar").
    sort({ createdAt: -1 });

    res.json({ success: true, count: invitations.length, invitations });
  } catch (error) {
    console.error("Error loading journey invitations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.resendInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId || req.params.id;
    const inv = await JourneyInvitation.findById(invitationId).populate("journeyId");
    if (!inv) return res.status(404).json({ success: false, code: "INVITATION_NOT_FOUND", message: "Invitation not found" });

    const journey = inv.journeyId ? await syncJourneyStatus(inv.journeyId) : null;
    const inviteCheck = canInviteMembers(req.user._id || req.user.id, journey);
    if (inviteCheck.allowed === false) {
      return res.status(inviteCheck.statusCode || 400).json({
        success: false,
        code: inviteCheck.code,
        message: inviteCheck.reason
      });
    }

    inv.status = "pending";
    inv.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await inv.save();

    try {
      const recipientId = inv.inviteeId?._id || inv.inviteeId;
      if (recipientId) {
        await createAndSendNotification(req.app.get("io"), {
          sender: req.user._id || req.user.id,
          receiver: recipientId,
          type: "journey_invitation",
          journey: inv.journeyId?._id || inv.journeyId,
          invitation: inv._id,
          message: `Reminder: You have a pending invitation to join "${inv.journeyId?.title || "a journey"}"`
        });
      }
    } catch (notifErr) {
      console.error("Error creating resend notification:", notifErr);
    }

    res.json({ success: true, message: "Invitation resent successfully", invitation: inv });
  } catch (error) {
    console.error("Error resending invitation:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to resend invitation" });
  }
};

exports.cancelInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId || req.params.id;
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

exports.leaveJourney = async (req, res) => {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { id } = req.params;
      const userId = req.user._id || req.user.id;

      let journey = await Journey.findById(id).session(session);
      if (!journey) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Journey not found" });
      }

      journey = await syncJourneyStatus(journey);

      const eligibility = canLeaveJourney(userId, journey);
      if (eligibility.allowed === false) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          code: eligibility.code,
          hasEligibleMembers: eligibility.hasEligibleMembers,
          message: eligibility.reason
        });
      }

      const isMemberInArray = journey.members.some(
        (m) => (m.user?._id || m.user).toString() === userId.toString()
      );
      const existingMemberRecord = await JourneyMember.findOne({ journeyId: id, userId }).session(session);

      if (!isMemberInArray && (!existingMemberRecord || existingMemberRecord.status === "left")) {
        await session.commitTransaction();
        session.endSession();
        if (!existingMemberRecord) {
          return res.status(400).json({ success: false, message: "You are not a member of this journey" });
        }
        return res.json({ success: true, message: "You have already left this journey" });
      }

      journey.members = journey.members.filter(
        (m) => (m.user?._id || m.user).toString() !== userId.toString()
      );
      journey.memberCount = journey.members.length;
      await journey.save({ session });

      await JourneyMember.findOneAndUpdate(
        { journeyId: id, userId },
        { status: "left", role: "Member" },
        { upsert: true, session }
      );

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
        description: `${user?.name || "A traveler"} left the journey.`
      }], { session });

      await session.commitTransaction();
      session.endSession();

      if (journey.chatRoomId) {
        revokeSocketRoomAccess(req, userId, journey.chatRoomId);
      }

      return res.json({ success: true, message: "Left journey successfully" });
    } catch (error) {
      if (session && session.inTransaction && session.inTransaction()) {
        try { await session.abortTransaction(); } catch (e) {}
      }
      if (session) session.endSession();

      if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError') && attempt < maxRetries) {
        continue;
      }
      console.error("Error leaving journey:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
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

    const isOrganizerOrCoHost = journey.members.some(
      (m) => (m.user?._id || m.user).toString() === currentUserId.toString() &&
             (m.role === "Organizer" || m.role === "Co-Organizer")
    ) || (journey.creator && journey.creator.toString() === currentUserId.toString());

    if (!isOrganizerOrCoHost) {
      return res.status(403).json({ success: false, message: "Only organizers can remove members" });
    }

    const targetMember = journey.members.find((m) => (m.user?._id || m.user).toString() === targetUserId.toString());
    
    if (journey.creator && journey.creator.toString() === targetUserId.toString()) {
      return res.status(403).json({ success: false, message: "Cannot remove the journey creator" });
    }

    if (journey.creator.toString() !== currentUserId.toString()) {
      if (targetMember && (targetMember.role === "Organizer" || targetMember.role === "Co-Organizer")) {
         return res.status(403).json({ success: false, message: "Co-organizers cannot remove other organizers" });
      }
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

    if (journey.chatRoomId) {
      revokeSocketRoomAccess(req, targetUserId, journey.chatRoomId);
    }

    res.json({ success: true, message: "Member removed successfully", journey });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

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

exports.assignCoLeader = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const journeyId = req.params.journeyId || req.params.id;
    const targetUserId = req.params.targetUserId || req.params.userId;
    const requesterId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, code: "INVALID_JOURNEY_ID", message: "Invalid journey ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, code: "INVALID_TARGET_USER", message: "Invalid target user ID" });
    }

    let journey = await Journey.findById(journeyId).session(session);
    if (!journey) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });
    }

    journey = await syncJourneyStatus(journey);

    const eligibility = canAssignCoLeader(requesterId, journey, targetUserId);
    if (eligibility.allowed === false) {
      await session.abortTransaction();
      session.endSession();
      return res.status(eligibility.statusCode || 400).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason
      });
    }

    const memIndex = (journey.members || []).findIndex(
      (m) => (m.user?._id || m.user || m).toString() === targetUserId.toString()
    );

    if (memIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: "TARGET_NOT_MEMBER",
        message: "Target user is not a member of this journey"
      });
    }

    journey.members[memIndex].role = "Co-Organizer";
    await journey.save({ session });

    await JourneyMember.findOneAndUpdate(
      { journeyId, userId: targetUserId },
      { role: "Co-Organizer", status: "active" },
      { upsert: true, session }
    );

    try {
      await Notification.create(
        [{
          sender: requesterId,
          receiver: targetUserId,
          type: "journey_updated",
          journey: journey._id,
          journeyModel: "Journey",
          message: `You're now a co-leader of ${journey.title}.`
        }],
        { session }
      );
    } catch (notifErr) {
      console.error("[assignCoLeader] Notification creation error:", notifErr);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      code: "CO_LEADER_ASSIGNED",
      message: `Co-leader assigned successfully for "${journey.title}"`,
      journey
    });
  } catch (error) {
    if (session && session.inTransaction && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (e) {}
    }
    if (session) session.endSession();
    console.error("Error assigning co-leader:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.removeCoLeader = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const journeyId = req.params.journeyId || req.params.id;
    const targetUserId = req.params.targetUserId || req.params.userId;
    const requesterId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, code: "INVALID_JOURNEY_ID", message: "Invalid journey ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, code: "INVALID_TARGET_USER", message: "Invalid target user ID" });
    }

    let journey = await Journey.findById(journeyId).session(session);
    if (!journey) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });
    }

    journey = await syncJourneyStatus(journey);

    const eligibility = canRemoveCoLeader(requesterId, journey, targetUserId);
    if (eligibility.allowed === false) {
      await session.abortTransaction();
      session.endSession();
      return res.status(eligibility.statusCode || 400).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason
      });
    }

    const memIndex = (journey.members || []).findIndex(
      (m) => (m.user?._id || m.user || m).toString() === targetUserId.toString()
    );

    if (memIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        code: "TARGET_NOT_MEMBER",
        message: "Target user is not a member of this journey"
      });
    }

    journey.members[memIndex].role = "Member";
    await journey.save({ session });

    await JourneyMember.findOneAndUpdate(
      { journeyId, userId: targetUserId },
      { role: "Member" },
      { session }
    );

    try {
      await Notification.create(
        [{
          sender: requesterId,
          receiver: targetUserId,
          type: "journey_updated",
          journey: journey._id,
          journeyModel: "Journey",
          message: `Your co-leader role for ${journey.title} has been removed.`
        }],
        { session }
      );
    } catch (notifErr) {
      console.error("[removeCoLeader] Notification creation error:", notifErr);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      code: "CO_LEADER_REMOVED",
      message: `Your co-leader role for ${journey.title} has been removed.`,
      journey
    });
  } catch (error) {
    if (session && session.inTransaction && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (e) {}
    }
    if (session) session.endSession();
    console.error("Error removing co-leader:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.requestToJoinJourney = async (req, res) => {
  try {
    const journeyId = req.params.id;
    const userId = req.user._id || req.user.id;

    let journey = await Journey.findById(journeyId);
    if (!journey) return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });

    journey = await syncJourneyStatus(journey);

    const eligibility = await canJoinJourney(userId, journey);
    if (eligibility.allowed === false) {
      return res.status(400).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason
      });
    }

    const existingPendingInvite = await JourneyInvitation.findOne({ journeyId, inviteeId: userId, status: "pending" });
    if (existingPendingInvite) {
      return res.status(400).json({ success: false, message: "You already have a pending invitation" });
    }

    const newRequest = await JourneyJoinRequest.create({
      journeyId,
      userId,
      status: "pending",
      message: req.body.message || ""
    });

    await createAndSendNotification(req.app.get("io"), {
      sender: userId,
      receiver: journey.creator,
      type: "journey_join_request",
      journey: journeyId,
      journeyJoinRequest: newRequest._id,
      message: `${req.user.name || "A user"} requested to join your journey "${journey.title}"`
    });

    res.status(201).json({ success: true, message: "Request sent successfully", joinRequest: newRequest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You already have a pending join request" });
    }
    console.error("Error creating join request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getJourneyJoinRequests = async (req, res) => {
  try {
    const journeyId = req.params.id;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(journeyId);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view join requests" });
    }

    const requests = await JourneyJoinRequest.find({ journeyId }).populate("userId", "name profilePic username");
    res.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.cancelJourneyJoinRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user._id || req.user.id;

    const joinRequest = await JourneyJoinRequest.findById(requestId);
    if (!joinRequest) return res.status(404).json({ success: false, message: "Request not found" });

    if (joinRequest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this request" });
    }

    joinRequest.status = "cancelled";
    await joinRequest.save();

    res.json({ success: true, message: "Request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling join request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.acceptJourneyJoinRequest = async (req, res) => {
  const maxRetries = 6;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let session = null;
    try {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
      const sessionOpt = session ? { session } : {};

      const requestId = req.params.requestId;
      const hostId = req.user._id || req.user.id;

      const joinRequest = await JourneyJoinRequest.findById(requestId).session(session || null);
      if (!joinRequest) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ success: false, code: "REQUEST_NOT_FOUND", message: "Request not found" });
      }
      
      if (joinRequest.status !== "pending") {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({ success: false, code: "REQUEST_NOT_PENDING", message: "Request is not pending" });
      }

      // Atomically serialize join operations for this user across concurrent requests
      if (session) {
        await User.findByIdAndUpdate(joinRequest.userId, { $inc: { __v: 1 } }, sessionOpt);
      }

      let journey = await Journey.findById(joinRequest.journeyId).session(session || null);
      if (!journey) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });
      }

      if (journey.creator.toString() !== hostId.toString()) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(403).json({ success: false, code: "NOT_HOST", message: "Not authorized" });
      }

      journey = await syncJourneyStatus(journey);

      const eligibility = await canJoinJourney(joinRequest.userId, journey, { session: session || null });
      if (eligibility.allowed === false) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({
          success: false,
          code: eligibility.code,
          message: eligibility.reason
        });
      }

      const updatedJourney = await Journey.findOneAndUpdate(
        {
          _id: journey._id,
          status: { $in: ["Planning", "Upcoming"] },
          "members.user": { $ne: joinRequest.userId },
          $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }
        },
        {
          $push: { members: { user: joinRequest.userId, role: "Member", joinedAt: new Date() } },
          $inc: { memberCount: 1 }
        },
        { new: true, ...sessionOpt }
      );

      if (!updatedJourney) {
        const currentJourney = await Journey.findById(journey._id).session(session || null);
        if (currentJourney && currentJourney.members.length >= currentJourney.maxMembers) {
          joinRequest.status = "capacity_full";
          await joinRequest.save(sessionOpt);
          if (session) { await session.commitTransaction(); session.endSession(); }
          
          await Notification.create({
            sender: hostId,
            receiver: joinRequest.userId,
            type: "journey_join_request_rejected",
            journey: journey._id,
            message: `Your request to join "${journey.title}" was not accepted because the journey has reached its capacity.`
          });
          
          return res.status(400).json({ success: false, message: "Journey is at full capacity" });
        } else {
          throw new Error("Could not add member (might already be member or journey inactive)");
        }
      }

      joinRequest.status = "accepted";
      await joinRequest.save(sessionOpt);
      
      await JourneyMember.findOneAndUpdate(
        { journeyId: journey._id, userId: joinRequest.userId },
        { status: "active", role: "Member", joinedAt: new Date() },
        { upsert: true, ...sessionOpt }
      );

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      await Notification.create({
        sender: hostId,
        receiver: joinRequest.userId,
        type: "journey_join_request_accepted",
        journey: journey._id,
        message: `Your request to join "${journey.title}" was accepted!`
      });

      return res.json({ success: true, message: "Request accepted successfully", journey: updatedJourney });
    } catch (error) {
      if (session) {
        try { await session.abortTransaction(); session.endSession(); } catch (e) {}
      }
      if (
        (error.hasErrorLabel?.('TransientTransactionError') ||
          error.code === 112 ||
          error.codeName === 'WriteConflict' ||
          (error.errorLabels && error.errorLabels.has && error.errorLabels.has('TransientTransactionError'))) &&
        attempt < maxRetries
      ) {
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100)));
        continue;
      }
      console.error("Error accepting join request:", error);
      return res.status(error.message === "Not authorized" ? 403 : 400).json({ success: false, message: error.message || "Server Error" });
    }
  }
};

exports.rejectJourneyJoinRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const hostId = req.user._id || req.user.id;

    const joinRequest = await JourneyJoinRequest.findById(requestId);
    if (!joinRequest) return res.status(404).json({ success: false, message: "Request not found" });

    const journey = await Journey.findById(joinRequest.journeyId);
    if (!journey) return res.status(404).json({ success: false, message: "Journey not found" });

    if (journey.creator.toString() !== hostId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    joinRequest.status = "rejected";
    await joinRequest.save();

    await Notification.create({
      sender: hostId,
      receiver: joinRequest.userId,
      type: "journey_join_request_rejected",
      journey: journey._id,
      message: `Your request to join "${journey.title}" was rejected.`
    });

    res.json({ success: true, message: "Request rejected successfully" });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMyJoinRequest = async (req, res) => {
  try {
    const journeyId = req.params.id;
    const userId = req.user._id || req.user.id;
    const joinRequest = await JourneyJoinRequest.findOne({ journeyId, userId, status: "pending" });
    res.json({ success: true, joinRequest });
  } catch (error) {
    console.error("Error fetching my join request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.warnMember = async (req, res) => {
  try {
    const journeyId = req.params.id || req.params.journeyId;
    const targetUserId = req.params.userId || req.params.memberId || req.params.targetUserId;
    const requesterId = req.user._id || req.user.id;
    const { reason, message } = req.body;
    const warningReason = (reason || message || "").trim();

    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
      return res.status(400).json({ success: false, code: "INVALID_JOURNEY_ID", message: "Invalid journey ID." });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, code: "INVALID_TARGET_USER", message: "Invalid target user ID." });
    }

    let journey = await Journey.findById(journeyId).populate("creator", "name username");
    if (!journey) {
      return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found." });
    }

    journey = await syncJourneyStatus(journey);

    const eligibility = canWarnMember(requesterId, journey, targetUserId, warningReason);
    if (eligibility.allowed === false) {
      return res.status(eligibility.statusCode || 400).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason
      });
    }

    const targetUser = await User.findById(targetUserId).select("name username");
    const targetName = targetUser?.name || "Traveler";

    const hostIdStr = (journey.creator?._id || journey.creator).toString();
    const isHost = hostIdStr === requesterId.toString();

    const notification = await Notification.create({
      sender: requesterId,
      receiver: targetUserId,
      type: "warning",
      category: "Safety",
      journey: journey._id,
      journeyModel: "Journey",
      message: `Warning from ${isHost ? "journey host" : "journey co-leader"} of "${journey.title}": ${warningReason}`,
      metadata: {
        journeyId: journey._id,
        journeyTitle: journey.title,
        reason: warningReason,
        senderRole: isHost ? "Organizer" : "Co-Organizer"
      }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(targetUserId.toString()).emit("new_notification", notification);
      io.to(targetUserId.toString()).emit("journey_warning", {
        journeyId: journey._id,
        journeyTitle: journey.title,
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
    console.error("Error sending journey member warning:", error);
    return res.status(500).json({
      success: false,
      code: "WARNING_FAILED",
      message: error.message || "Failed to send warning."
    });
  }
};

exports.revokeSocketRoomAccess = revokeSocketRoomAccess;
