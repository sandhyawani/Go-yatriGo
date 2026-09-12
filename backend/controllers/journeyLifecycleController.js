const Journey = require("../models/Journey");
const JourneyMemory = require("../models/JourneyMemory");
const JourneyTimeline = require("../models/JourneyTimeline");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");

const syncJourneyStatus = async (journey) => {
  if (!journey) return journey;
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
      if (typeof journey.save === "function") {
        try {
          await journey.save();
        } catch (e) {}
      }
    }
    return journey;
  }

  const now = new Date();
  const start = new Date(journey.startDate);
  const end = new Date(journey.endDate);

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
            if (!uid) return null;
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
              title: journey.title,
              destination: journey.destination,
              coverImage: journey.coverImage,
              durationDays: journey.durationDays,
              participantsCount: participants.length || 1,
              participants,
              highlights: [
                { title: "Journey Created", eventType: "journey_created", createdAt: journey.createdAt },
                { title: "Journey Started", eventType: "journey_started", createdAt: journey.startDate },
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
        if (creatorId) {
          await JourneyTimeline.create({
            journeyId: journey._id,
            userId: creatorId,
            userName: "System",
            eventType: "journey_completed",
            title: "Journey Completed",
            description: `Congratulations on completing ${journey.title}!`
          });
        }
      } catch (timeErr) {
        console.error("Error creating timeline event for journey completion:", timeErr);
      }
    } else if (expectedStatus === "Ongoing" && oldStatus === "Upcoming") {
      try {
        const creatorId = journey.creator?._id || journey.creator;
        if (creatorId) {
          await JourneyTimeline.create({
            journeyId: journey._id,
            userId: creatorId,
            userName: "System",
            eventType: "journey_started",
            title: "Journey Started",
            description: `The journey to ${journey.destination} has officially begun!`
          });
        }
      } catch (timeErr) {
        console.error("Error creating timeline event for journey start:", timeErr);
      }
    }

    try {
      if (typeof journey.save === "function") {
        await journey.save();
      } else {
        await Journey.findByIdAndUpdate(journey._id, {
          $set: {
            status: journey.status,
            isCancelled: journey.isCancelled,
            completedAt: journey.completedAt
          }
        });
      }
    } catch (saveErr) {
      try {
        await Journey.findByIdAndUpdate(journey._id, {
          $set: {
            status: journey.status,
            isCancelled: journey.isCancelled,
            completedAt: journey.completedAt
          }
        });
      } catch (fallbackErr) {
        console.error("Error persisting synced journey status:", fallbackErr);
      }
    }
  }

  return journey;
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
