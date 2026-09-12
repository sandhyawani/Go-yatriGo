const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyTimeline = require("../models/JourneyTimeline");
const Notification = require("../models/Notification");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");
exports.transferHost = async (req, res) => {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { id } = req.params;
      const { newHostId } = req.body;
      const currentUserId = req.user._id || req.user.id;

      if (!newHostId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Target user ID is required for host transfer" });
      }

      if (newHostId.toString() === currentUserId.toString()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "You are already the host of this journey" });
      }

      const journey = await Journey.findById(id).session(session);
      if (!journey) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Journey not found" });
      }

      if (journey.creator.toString() !== currentUserId.toString()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ success: false, message: "Only the current host can transfer ownership" });
      }

      if (String(journey.status || "").toLowerCase() === "cancelled") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Cannot transfer host of a cancelled journey" });
      }

      const newHostMemberIndex = journey.members.findIndex(
        (m) => (m.user?._id || m.user).toString() === newHostId.toString()
      );
      if (newHostMemberIndex === -1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Target user is not a member of this journey" });
      }

      const targetJourneyMember = await JourneyMember.findOne({ journeyId: id, userId: newHostId }).session(session);
      if (!targetJourneyMember || targetJourneyMember.status !== "active") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Target user is not an active member" });
      }

      journey.creator = newHostId;

      journey.members.forEach((m) => {
        const uId = (m.user?._id || m.user).toString();
        if (uId === currentUserId.toString()) {
          m.role = "Member";
        } else if (uId === newHostId.toString()) {
          m.role = "Organizer";
        }
      });

      await journey.save({ session });

      await JourneyMember.findOneAndUpdate(
        { journeyId: id, userId: currentUserId },
        { role: "Member", status: "active" },
        { session }
      );

      await JourneyMember.findOneAndUpdate(
        { journeyId: id, userId: newHostId },
        { role: "Organizer", status: "active" },
        { session }
      );

      if (journey.sourceId) {
        try {
          await TravelGroup.findByIdAndUpdate(journey.sourceId, { host: newHostId }).session(session);
        } catch (e) {}
      }

      await session.commitTransaction();
      session.endSession();

      const [oldHostUser, newHostUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(newHostId)
      ]);

      await JourneyTimeline.create([{
        journeyId: journey._id,
        userId: currentUserId,
        userName: oldHostUser?.name || "Previous Host",
        userPic: oldHostUser?.profilePic || "",
        eventType: "host_transferred",
        title: "Host Transferred",
        description: `${oldHostUser?.name || "Previous Host"} transferred hosting to ${newHostUser?.name || "New Host"}.`
      }]);

      const notificationService = require("../services/notificationService");
      const io = req.app.get("io");

      await notificationService.createNotification({
        sender: currentUserId,
        receiver: newHostId,
        type: "journey_host_transferred",
        category: "Journey",
        journey: journey._id,
        journeyModel: "Journey",
        entityId: journey._id,
        entityType: "Journey",
        title: "You are now Host",
        message: `You are now the host of "${journey.title}".`,
        link: `/social/journeys/${journey._id}`
      }, io).catch(() => {});

      (journey.members || []).forEach((m) => {
        const memId = (m.user?._id || m.user).toString();
        if (memId !== currentUserId.toString() && memId !== newHostId.toString()) {
          notificationService.createNotification({
            sender: currentUserId,
            receiver: memId,
            type: "journey_host_transferred",
            category: "Journey",
            journey: journey._id,
            journeyModel: "Journey",
            entityId: journey._id,
            entityType: "Journey",
            title: "Host Transferred",
            message: `${newHostUser?.name || "A member"} is now the host of "${journey.title}".`,
            link: `/social/journeys/${journey._id}`
          }, io).catch(() => {});
        }
      });

      try {
        if (io) {
          io.emit("host_transferred", {
            journeyId: journey._id.toString(),
            oldHostId: currentUserId.toString(),
            newHostId: newHostId.toString()
          });
        }
      } catch (e) {}

      return res.json({
        success: true,
        message: `Hosting transferred successfully to ${newHostUser?.name || "new host"}`,
        journey
      });
    } catch (error) {
      if (session && session.inTransaction && session.inTransaction()) {
        try { await session.abortTransaction(); } catch (e) {}
      }
      if (session) session.endSession();

      if (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError') && attempt < maxRetries) {
        continue;
      }
      console.error("Error transferring host:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  }
};
