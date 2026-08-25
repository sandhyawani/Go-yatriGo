const Journey = require("../models/Journey");
const TravelGroup = require("../models/TravelGroup");
const { getBlockedUserIds } = require("../utils/blockHelper");

const TRIP_MATE_JOURNEY_STATUSES = ["upcoming", "ongoing"];
const TRIP_MATE_GROUP_STATUSES = ["upcoming", "ongoing", "open", "active"];

const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

const getUserId = (user) => {
  if (!user) return null;
  return String(user._id || user.id || "");
};

const getParticipants = (item, isGroup) => {
  const participants = [];

  const owner = isGroup ? item.host : item.creator;

  if (owner) {
    participants.push(owner);
  }

  if (Array.isArray(item.members)) {
    item.members.forEach((member) => {
      if (member?.user) {
        participants.push(member.user);
      }
    });
  }

  return participants;
};

const isValidJourneyStatus = (journey) => {
  if (!journey || journey.isCancelled === true) {
    return false;
  }

  const status = normalizeStatus(journey.status);
  return TRIP_MATE_JOURNEY_STATUSES.includes(status);
};

const isValidGroupStatus = (group) => {
  if (!group || group.isCancelled === true) {
    return false;
  }

  const status = normalizeStatus(group.status);
  return TRIP_MATE_GROUP_STATUSES.includes(status);
};

const getJourneyPriority = (status) => {
  if (status === "ongoing") return 1;
  if (status === "upcoming") return 2;
  return 3;
};

const buildSharedJourney = (item, isGroup) => ({
  _id: item._id,
  title: isGroup ? item.groupName || item.title : item.title,
  destination: item.destination,
  from: item.from,
  startDate: item.startDate,
  endDate: item.endDate,
  status: item.status,
});

exports.getValidTripMates = async (userId) => {
  if (!userId) {
    return [];
  }

  const userIdString = String(userId);
  const now = new Date();

  const { idSet: blockedIdSet } = await getBlockedUserIds(userId);

  const [journeys, groups] = await Promise.all([
    Journey.find({
      status: {
        $in: ["Upcoming", "upcoming", "Ongoing", "ongoing"],
      },
      isCancelled: { $ne: true },
      $or: [
        { creator: userId },
        { "members.user": userId },
      ],
    })
      .populate(
        "creator",
        "name username bio pic avatar profilePic isVerified verificationStatus"
      )
      .populate(
        "members.user",
        "name username bio pic avatar profilePic isVerified verificationStatus"
      )
      .lean(),

    TravelGroup.find({
      status: {
        $in: [
          "Upcoming",
          "upcoming",
          "Ongoing",
          "ongoing",
          "open",
          "active",
        ],
      },
      isCancelled: { $ne: true },
      $or: [
        { host: userId },
        { "members.user": userId },
      ],
    })
      .populate(
        "host",
        "name username bio pic avatar profilePic isVerified verificationStatus"
      )
      .populate(
        "members.user",
        "name username bio pic avatar profilePic isVerified verificationStatus"
      )
      .lean(),
  ]);

  const tripMates = new Map();

  const processItem = (item, isGroup) => {
    if (!item) return;

    const valid = isGroup
      ? isValidGroupStatus(item)
      : isValidJourneyStatus(item);

    if (!valid) return;

    const status = normalizeStatus(item.status);

    if (!isGroup && !TRIP_MATE_JOURNEY_STATUSES.includes(status)) {
      return;
    }

    const participants = getParticipants(item, isGroup);
    const sharedJourney = buildSharedJourney(item, isGroup);

    const startDate = item.startDate
      ? new Date(item.startDate)
      : null;

    const dateDiff =
      startDate && !Number.isNaN(startDate.getTime())
        ? Math.abs(now.getTime() - startDate.getTime())
        : Number.MAX_SAFE_INTEGER;

    const priority = getJourneyPriority(
      status === "ongoing" ? "ongoing" : "upcoming"
    );

    participants.forEach((participant) => {
      const participantId = getUserId(participant);

      if (!participantId || participantId === userIdString || blockedIdSet.has(participantId)) {
        return;
      }

      const existing = tripMates.get(participantId);

      if (!existing) {
        tripMates.set(participantId, {
          user: participant,
          priority,
          dateDiff,
          sharedJourney,
        });

        return;
      }

      const shouldReplace =
        priority < existing.priority ||
        (priority === existing.priority &&
          dateDiff < existing.dateDiff);

      if (shouldReplace) {
        tripMates.set(participantId, {
          user: participant,
          priority,
          dateDiff,
          sharedJourney,
        });
      }
    });
  };

  journeys.forEach((journey) => {
    processItem(journey, false);
  });

  groups.forEach((group) => {
    processItem(group, true);
  });

  return Array.from(tripMates.values()).map((item) => ({
    ...item.user,
    sharedJourney: item.sharedJourney,
  }));
};

exports.getTripMates = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const User = require("../models/User");
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (targetUser.privateAccount) {
      const isOwner = currentUserId && targetUser._id.toString() === currentUserId.toString();
      const isFollower = currentUserId && targetUser.followers?.some((f) => (f._id || f).toString() === currentUserId.toString());
      const isAdmin = req.user?.isAdmin === true;
      if (!isOwner && !isFollower && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Account is private",
        });
      }
    }

    const tripMates = await exports.getValidTripMates(targetUser._id);

    return res.status(200).json({
      success: true,
      trip_mates: tripMates,
      count: tripMates.length,
    });
  } catch (error) {
    console.error("Error fetching Trip Mates:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Trip Mates.",
    });
  }
};

exports.getAllConnections = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const tripMates = await exports.getValidTripMates(userId);

    const connectionStates = {};

    tripMates.forEach((user) => {
      const userIdString = getUserId(user);

      if (userIdString) {
        connectionStates[userIdString] = "connected";
      }
    });

    return res.status(200).json({
      success: true,
      connectionStates,
    });
  } catch (error) {
    console.error("Error fetching Trip Mate states:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Trip Mate states.",
    });
  }
};

exports.addTripMate = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Trip Mates are created automatically from shared active journeys.",
  });
};

exports.removeTripMate = async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Trip Mates are removed automatically when the shared journey is no longer active.",
  });
};