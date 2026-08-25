const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyTimeline = require("../models/JourneyTimeline");
const Notification = require("../models/Notification");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");
const { syncJourneyStatus } = require("./journeyLifecycleController");
const { canCancelJourney } = require("../services/journeyEligibility");

// Evaluate cancellation rules via journeyEligibility service.
const evaluateCancellationRules = (journey, userId) => {
  const result = canCancelJourney(userId, journey);
  return {
    canCancel: result.allowed || result.isAlreadyCancelled || false,
    isAlreadyCancelled: Boolean(result.isAlreadyCancelled),
    statusCode: result.statusCode || (result.code === "NOT_HOST" ? 403 : result.code === "JOURNEY_NOT_FOUND" ? 404 : 400),
    code: result.code,
    message: result.reason
  };
};

exports.cancelJourney = async (req, res) => {
  let session = null;
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid journey ID format" });
    }

    let journey = await Journey.findById(id);
    if (!journey) {
      return res.status(404).json({ success: false, code: "JOURNEY_NOT_FOUND", message: "Journey not found" });
    }

    journey = await syncJourneyStatus(journey);

    const eligibility = canCancelJourney(userId, journey);

    if (eligibility.isAlreadyCancelled || eligibility.code === "ALREADY_CANCELLED") {
      if (journey.status !== "Cancelled" || !journey.isCancelled) {
        journey.status = "Cancelled";
        journey.isCancelled = true;
        await journey.save();
      }
      return res.json({ success: true, message: "Journey is already cancelled", journey });
    }

    if (eligibility.allowed === false) {
      return res.status(eligibility.statusCode || 400).json({
        success: false,
        code: eligibility.code,
        message: eligibility.reason
      });
    }

    let useTransaction = true;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
      session = null;
    }

    const queryOpts = useTransaction ? { session, new: true } : { new: true };
    const journeyObjectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const updatedJourney = await Journey.findOneAndUpdate(
      { _id: journeyObjectId, creator: userObjectId, status: { $nin: ["Cancelled", "cancelled", "Completed", "completed"] } },
      {
        $set: {
          status: "Cancelled",
          isCancelled: true,
          cancelledAt: journey.cancelledAt || new Date(),
          cancelledBy: userObjectId,
          cancellationReason: typeof reason === "string" ? reason.trim() : (journey.cancellationReason || "")
        }
      },
      queryOpts
    );

    if (!updatedJourney) {
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      const refreshed = await Journey.findById(id);
      return res.json({ success: true, message: "Journey is already cancelled", journey: refreshed });
    }

    // Update TravelGroup if linked
    const travelGroupFilter = updatedJourney.sourceId
      ? { $or: [{ _id: updatedJourney.sourceId }, { journeyId: updatedJourney._id }] }
      : { journeyId: updatedJourney._id };

    await TravelGroup.updateMany(
      travelGroupFilter,
      {
        $set: {
          status: "cancelled",
          isCancelled: true,
          cancelledAt: new Date(),
          cancelledBy: userId
        }
      },
      useTransaction ? { session } : {}
    );

    // Create Timeline event if not exists
    const existingTimeline = await JourneyTimeline.findOne(
      { journeyId: updatedJourney._id, eventType: "journey_cancelled" },
      null,
      useTransaction ? { session } : {}
    );

    if (!existingTimeline) {
      const user = await User.findById(userId).session(useTransaction ? session : null);
      await JourneyTimeline.create(
        [{
          journeyId: updatedJourney._id,
          userId,
          userName: user?.name || "Host",
          userPic: user?.profilePic || "",
          eventType: "journey_cancelled",
          title: "Journey Cancelled",
          description: `${updatedJourney.title} has been cancelled by the host.`
        }],
        useTransaction ? { session } : {}
      );
    }

    // Target Members Notifications
    const rawMembers = updatedJourney.members || [];
    const targetMembersSet = new Set();
    rawMembers.forEach((m) => {
      const memId = (m.user?._id || m.user || m)?.toString();
      if (memId && memId !== userId.toString()) {
        targetMembersSet.add(memId);
      }
    });

    if (targetMembersSet.size > 0) {
      const targetMembers = Array.from(targetMembersSet);
      for (const memId of targetMembers) {
        const notifExists = await Notification.findOne(
          { journey: updatedJourney._id, receiver: memId, type: "journey_cancelled" },
          null,
          useTransaction ? { session } : {}
        );
        if (!notifExists) {
          await Notification.create(
            [{
              sender: userId,
              receiver: memId,
              type: "journey_cancelled",
              journey: updatedJourney._id,
              journeyModel: "Journey",
              message: `The journey "${updatedJourney.title}" has been cancelled by the host.`
            }],
            useTransaction ? { session } : {}
          );
        }
      }
    }

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("journey_cancelled", { journeyId: updatedJourney._id.toString() });
      }
    } catch (e) {}

    return res.json({ success: true, message: "Journey cancelled successfully", journey: updatedJourney });

  } catch (error) {
    if (session) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch (e) {}
      try {
        session.endSession();
      } catch (e) {}
    }
    console.error("Error cancelling journey:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

exports.evaluateCancellationRules = evaluateCancellationRules;
