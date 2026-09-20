const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMemory = require("../models/JourneyMemory");
const JourneyTimeline = require("../models/JourneyTimeline");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");

const syncJourneyStatus = async (journey) => {
  try {
    if (!journey || !journey._id) return journey;
    const currentStat = String(journey.status || "").trim().toLowerCase();
    const isCancelled =
      currentStat === "cancelled" ||
      currentStat === "canceled" ||
      currentStat === "archived" ||
      journey.isCancelled === true ||
      Boolean(journey.cancelledAt);

    if (isCancelled) {
      if (journey.status !== "Cancelled" && currentStat !== "archived") {
        journey.status = "Cancelled";
        journey.isCancelled = true;
        try {
          await Journey.findByIdAndUpdate(journey._id, {
            $set: { status: "Cancelled", isCancelled: true }
          });
        } catch (e) {}
      }
      return journey;
    }

    if (!journey.startDate || !journey.endDate) {
      return journey;
    }

    const now = new Date();
    const start = new Date(journey.startDate);
    const end = new Date(journey.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return journey;
    }

    let expectedStatus = "Upcoming";
    if (now > end) {
      expectedStatus = "Completed";
    } else if (now >= start && now <= end) {
      expectedStatus = "Ongoing";
    }

    if (expectedStatus === "Ongoing") {
      try {
        await JourneyInvitation.updateMany(
          { journeyId: journey._id, status: "pending" },
          { $set: { status: "expired" } }
        );
        await JourneyJoinRequest.updateMany(
          { journeyId: journey._id, status: "pending" },
          { $set: { status: "expired" } }
        );
        journey.pendingInvitationCount = 0;
      } catch (expErr) {
        console.error("Error expiring pending recruitment on ongoing transition:", expErr);
      }
    }

    if (journey.status !== expectedStatus) {
      const oldStatus = journey.status;
      journey.status = expectedStatus;

      if (expectedStatus === "Completed" && !journey.completedAt) {
        journey.completedAt = now;

        try {
          const participants = (journey.members || [])
            .map((m) => {
              const uid = m?.user?._id || m?.user;
              if (!uid || !mongoose.isValidObjectId(uid)) return null;
              return {
                userId: uid,
                name: m?.user?.name || "Traveler",
                pic: m?.user?.profilePic || m?.user?.pic || m?.user?.avatar || "",
                role: m?.role || "Member"
              };
            })
            .filter(Boolean);

          await JourneyMemory.findOneAndUpdate(
            { journeyId: journey._id },
            {
              $setOnInsert: {
                journeyId: journey._id,
                title: journey.title || "Completed Journey",
                destination: journey.destination || "Destination",
                coverImage: journey.coverImage || "",
                durationDays: journey.durationDays || 1,
                participantsCount: participants.length || 1,
                participants,
                highlights: [
                  { title: "Journey Created", eventType: "journey_created", createdAt: journey.createdAt || now },
                  { title: "Journey Started", eventType: "journey_started", createdAt: journey.startDate || now },
                  { title: "Journey Completed Successfully", eventType: "journey_completed", createdAt: now }
                ]
              }
            },
            { upsert: true, new: true }
          );
        } catch (memErr) {
          console.error("Error creating auto journey memory on completion:", memErr);
        }

        try {
          const creatorId = journey.creator?._id || journey.creator;
          if (creatorId && mongoose.isValidObjectId(creatorId)) {
            await JourneyTimeline.create({
              journeyId: journey._id,
              userId: creatorId,
              userName: "System",
              eventType: "journey_completed",
              title: "Journey Completed",
              description: `Congratulations on completing ${journey.title || "the journey"}!`
            });
          }
        } catch (timeErr) {
          console.error("Error creating timeline event for journey completion:", timeErr);
        }
      } else if (expectedStatus === "Ongoing" && oldStatus === "Upcoming") {
        try {
          const creatorId = journey.creator?._id || journey.creator;
          if (creatorId && mongoose.isValidObjectId(creatorId)) {
            await JourneyTimeline.create({
              journeyId: journey._id,
              userId: creatorId,
              userName: "System",
              eventType: "journey_started",
              title: "Journey Started",
              description: `The journey to ${journey.destination || "destination"} has officially begun!`
            });
          }
        } catch (timeErr) {
          console.error("Error creating timeline event for journey start:", timeErr);
        }
      }

      try {
        await Journey.findByIdAndUpdate(journey._id, {
          $set: {
            status: journey.status,
            isCancelled: journey.isCancelled,
            completedAt: journey.completedAt
          }
        });
      } catch (saveErr) {
        console.error("Error persisting synced journey status:", saveErr);
      }
    }

    return journey;
  } catch (err) {
    console.error("Error in syncJourneyStatus:", err);
    return journey;
  }
};

const syncJourneyStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let journey = await Journey.findById(id);
    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }
    journey = await syncJourneyStatus(journey);
    return res.json({ success: true, journey });
  } catch (error) {
    console.error("Error in syncJourneyStatusHandler:", error);
    return res.status(500).json({ success: false, message: "Failed to sync journey status" });
  }
};

module.exports = {
  syncJourneyStatus,
  syncJourneyStatusHandler
};
