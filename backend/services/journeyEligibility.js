const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");

// Normalize ObjectId, populated user object, or ID string to string.
const normalizeId = (val) => {
  if (!val) return "";
  if (typeof val === "object") {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    if (val.user) return normalizeId(val.user);
  }
  return String(val);
};

const isCreator = (userId, journey) => {
  const normUserId = normalizeId(userId);
  if (!normUserId || !journey) return false;
  const creatorId = normalizeId(journey.creator || journey.host || journey.userId);
  return creatorId === normUserId;
};

const getMember = (userId, journey) => {
  const normUserId = normalizeId(userId);
  if (!normUserId || !journey || !Array.isArray(journey.members)) return null;
  return (
    journey.members.find((m) => {
      const mId = normalizeId(m.user || m._id || m);
      return mId === normUserId;
    }) || null
  );
};

const isActiveMember = (userId, journey) => {
  const member = getMember(userId, journey);
  if (!member) return false;
  if (member.status && member.status !== "active") return false;
  return true;
};

const getOtherActiveMembers = (userId, journey) => {
  const normUserId = normalizeId(userId);
  if (!journey || !Array.isArray(journey.members)) return [];
  return journey.members.filter((m) => {
    const mId = normalizeId(m.user || m._id || m);
    return mId && mId !== normUserId && (!m.status || m.status === "active");
  });
};

const TravelGroup = require("../models/TravelGroup");

// Normalize a date to a calendar day string (YYYY-MM-DD)
const toCalendarDayString = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// Dynamic timestamp date/time overlap check: existingStart < newEnd AND existingEnd > newStart
const datesOverlap = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;

  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) {
    return false;
  }

  return s1 < e2 && e1 > s2;
};

const isActiveParticipant = (userId, journey, activeMemberJourneyIds = []) => {
  const normUserId = normalizeId(userId);
  if (!normUserId || !journey) return false;

  if (isCreator(normUserId, journey)) {
    return true;
  }

  if (isActiveMember(normUserId, journey)) {
    return true;
  }

  const jId = normalizeId(journey._id || journey.id);
  if (jId && activeMemberJourneyIds.some((id) => normalizeId(id) === jId)) {
    return true;
  }

  return false;
};

// Determine journey lifecycle status from dates and cancellation state without mutating the document.
const getJourneyLifecycle = (journey, referenceDate = new Date()) => {
  if (!journey) {
    return {
      status: "Unknown",
      isUpcoming: false,
      isOngoing: false,
      isCompleted: false,
      isCancelled: false
    };
  }

  const rawStatus = String(journey.status || "").trim().toLowerCase();
  const isCancelled =
    rawStatus === "cancelled" ||
    rawStatus === "canceled" ||
    rawStatus === "archived" ||
    journey.isCancelled === true ||
    Boolean(journey.cancelledAt);

  if (isCancelled) {
    return {
      status: "Cancelled",
      isUpcoming: false,
      isOngoing: false,
      isCompleted: false,
      isCancelled: true
    };
  }

  const now = new Date(referenceDate).getTime();
  const start = journey.startDate ? new Date(journey.startDate).getTime() : NaN;
  const end = journey.endDate ? new Date(journey.endDate).getTime() : NaN;

  if (isNaN(start) || isNaN(end)) {
    if (rawStatus === "completed") {
      return { status: "Completed", isUpcoming: false, isOngoing: false, isCompleted: true, isCancelled: false };
    }
    if (rawStatus === "ongoing") {
      return { status: "Ongoing", isUpcoming: false, isOngoing: true, isCompleted: false, isCancelled: false };
    }
    const current = journey.status || "Upcoming";
    return {
      status: current,
      isUpcoming: true,
      isOngoing: false,
      isCompleted: false,
      isCancelled: false
    };
  }

  if (now > end) {
    return {
      status: "Completed",
      isUpcoming: false,
      isOngoing: false,
      isCompleted: true,
      isCancelled: false
    };
  }

  if (now >= start && now <= end) {
    return {
      status: "Ongoing",
      isUpcoming: false,
      isOngoing: true,
      isCompleted: false,
      isCancelled: false
    };
  }

  const statusName = rawStatus === "planning" ? "Planning" : "Upcoming";
  return {
    status: statusName,
    isUpcoming: true,
    isOngoing: false,
    isCompleted: false,
    isCancelled: false
  };
};

const getLifecycleStatus = (journey) => getJourneyLifecycle(journey).status;

// Check if a user belongs to an active (ongoing) journey.
const getUserActiveJourney = async (userId, excludeJourneyId = null, referenceDate = new Date(), session = null) => {
  const normUserId = normalizeId(userId);
  if (!normUserId) return null;

  try {
    let memberJourneyIds = [];
    try {
      const q = JourneyMember.find({
        userId: normUserId,
        status: "active"
      }).select("journeyId");
      if (session) q.session(session);
      const memberRecords = await q.lean();
      memberJourneyIds = memberRecords.map((r) => normalizeId(r.journeyId)).filter(Boolean);
    } catch (err) {
      memberJourneyIds = [];
    }

    const excludeId = excludeJourneyId ? normalizeId(excludeJourneyId) : null;
    const query = {
      status: { $nin: ["Completed", "completed", "Cancelled", "cancelled", "Archived", "archived"] },
      isCancelled: { $ne: true },
      cancelledAt: null,
      $or: [
        { creator: normUserId },
        { host: normUserId },
        { userId: normUserId },
        { "members.user": normUserId },
        ...(memberJourneyIds.length > 0 ? [{ _id: { $in: memberJourneyIds } }] : [])
      ]
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const jQ = Journey.find(query);
    if (session) jQ.session(session);
    const candidateJourneys = await jQ.lean();

    for (const j of candidateJourneys) {
      const lifecycle = getJourneyLifecycle(j, referenceDate);
      if (lifecycle.isOngoing && isActiveParticipant(normUserId, j, memberJourneyIds)) {
        return j;
      }
    }

    try {
      const tgQ = TravelGroup.find({
        status: { $nin: ["Completed", "completed", "Cancelled", "cancelled", "Archived", "archived"] },
        isCancelled: { $ne: true },
        cancelledAt: null,
        $or: [
          { host: normUserId },
          { "members.user": normUserId }
        ]
      });
      if (session) tgQ.session(session);
      const tgCandidates = await tgQ.lean();

      for (const tg of tgCandidates) {
        const tgId = normalizeId(tg._id || tg.id);
        if (excludeId && tgId === excludeId) continue;
        const isHost = tg.host && normalizeId(tg.host) === normUserId;
        const isMem = Array.isArray(tg.members) && tg.members.some((m) => {
          const mId = normalizeId(m.user || m._id || m);
          return mId === normUserId && (!m.status || m.status === "active");
        });
        if (!isHost && !isMem) continue;

        const lifecycle = getJourneyLifecycle(tg, referenceDate);
        if (lifecycle.isOngoing) {
          return tg;
        }
      }
    } catch (e) {}

    return null;
  } catch (error) {
    console.error("[journeyEligibility] Error checking active journeys:", error);
    return null;
  }
};

// Retrieve conflicting active/upcoming commitment for user, if any
const getOverlappingCommitment = async (userId, startDate, endDate, excludeJourneyId = null, referenceDate = new Date(), session = null) => {
  const normUserId = normalizeId(userId);
  if (!normUserId || !startDate || !endDate) return null;

  const targetStart = new Date(startDate).getTime();
  const targetEnd = new Date(endDate).getTime();
  if (isNaN(targetStart) || isNaN(targetEnd)) return null;

  try {
    let memberJourneyIds = [];
    try {
      const q = JourneyMember.find({
        userId: normUserId,
        status: "active"
      }).select("journeyId");
      if (session) q.session(session);
      const memberRecords = await q.lean();
      memberJourneyIds = memberRecords.map((r) => normalizeId(r.journeyId)).filter(Boolean);
    } catch (err) {
      memberJourneyIds = [];
    }

    const normExcludeId = excludeJourneyId ? normalizeId(excludeJourneyId) : null;

    // 1. Check candidate Journeys
    const query = {
      status: { $nin: ["Completed", "completed", "Cancelled", "cancelled", "Archived", "archived"] },
      isCancelled: { $ne: true },
      cancelledAt: null,
      $or: [
        { creator: normUserId },
        { host: normUserId },
        { userId: normUserId },
        { "members.user": normUserId },
        ...(memberJourneyIds.length > 0 ? [{ _id: { $in: memberJourneyIds } }] : [])
      ]
    };

    if (normExcludeId && mongoose.Types.ObjectId.isValid(normExcludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(normExcludeId) };
    }

    const jQ = Journey.find(query);
    if (session) jQ.session(session);
    const candidateJourneys = await jQ.lean();

    for (const j of candidateJourneys) {
      const jId = normalizeId(j._id || j.id);
      if (normExcludeId && jId === normExcludeId) continue;
      if (normExcludeId && j.sourceId && normalizeId(j.sourceId) === normExcludeId) continue;

      const lifecycle = getJourneyLifecycle(j, referenceDate);
      if (lifecycle.isCancelled || lifecycle.isCompleted) {
        continue;
      }

      if (!isActiveParticipant(normUserId, j, memberJourneyIds)) {
        continue;
      }

      if (datesOverlap(j.startDate, j.endDate, targetStart, targetEnd)) {
        return j;
      }
    }

    // 2. Check candidate TravelGroups (if not already represented as Journey)
    try {
      const tgQuery = {
        status: { $nin: ["Completed", "completed", "Cancelled", "cancelled", "Archived", "archived"] },
        isCancelled: { $ne: true },
        cancelledAt: null,
        $or: [
          { host: normUserId },
          { "members.user": normUserId }
        ]
      };

      if (normExcludeId && mongoose.Types.ObjectId.isValid(normExcludeId)) {
        tgQuery._id = { $ne: new mongoose.Types.ObjectId(normExcludeId) };
      }

      const tgQ = TravelGroup.find(tgQuery);
      if (session) tgQ.session(session);
      const candidateGroups = await tgQ.lean();

      for (const tg of candidateGroups) {
        const tgId = normalizeId(tg._id || tg.id);
        if (normExcludeId && tgId === normExcludeId) continue;
        if (normExcludeId && tg.journeyId && normalizeId(tg.journeyId) === normExcludeId) continue;

        const isHost = tg.host && normalizeId(tg.host) === normUserId;
        const isMem = Array.isArray(tg.members) && tg.members.some((m) => {
          const mId = normalizeId(m.user || m._id || m);
          return mId === normUserId && (!m.status || m.status === "active");
        });

        if (!isHost && !isMem) continue;

        const lifecycle = getJourneyLifecycle(tg, referenceDate);
        if (lifecycle.isCancelled || lifecycle.isCompleted) {
          continue;
        }

        if (datesOverlap(tg.startDate, tg.endDate, targetStart, targetEnd)) {
          return tg;
        }
      }
    } catch (tgErr) {
      // Safe fallback if TravelGroup collection has schema divergence
    }

    return null;
  } catch (error) {
    console.error("[journeyEligibility] Error checking overlapping commitments:", error);
    return null;
  }
};

// Check user's active/upcoming journeys for conflicting overlapping dates.
const hasOverlappingJourney = async (userId, startDate, endDate, excludeJourneyId = null, referenceDate = new Date()) => {
  const conflict = await getOverlappingCommitment(userId, startDate, endDate, excludeJourneyId, referenceDate);
  return Boolean(conflict);
};

// Check whether a user can join a journey.
const canJoinJourney = async (userId, journey, options = {}) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      reason: "Valid user ID is required."
    };
  }

  const refDate = options.referenceDate || new Date();
  const lifecycle = getJourneyLifecycle(journey, refDate);

  if (isCreator(normUserId, journey)) {
    return {
      allowed: false,
      code: "CREATOR_CANNOT_JOIN",
      reason: "You are the creator of this journey."
    };
  }

  if (isActiveMember(normUserId, journey)) {
    return {
      allowed: false,
      code: "ALREADY_MEMBER",
      reason: "You are already an active member of this journey."
    };
  }

  if (lifecycle.isCancelled) {
    return {
      allowed: false,
      code: "JOURNEY_CANCELLED",
      reason: "Cannot join a cancelled journey."
    };
  }

  if (lifecycle.isCompleted) {
    return {
      allowed: false,
      code: "JOURNEY_COMPLETED",
      reason: "Cannot join a completed journey."
    };
  }

  if (lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "ROSTER_LOCKED",
      reason: "This journey has started and is no longer accepting new travelers."
    };
  }

  const memberCount = Array.isArray(journey.members)
    ? journey.members.length
    : (journey.memberCount || 0);
  const maxMembers = typeof journey.maxMembers === "number" ? journey.maxMembers : 50;

  if (memberCount >= maxMembers) {
    return {
      allowed: false,
      code: "CAPACITY_FULL",
      reason: "Journey has reached its maximum member capacity."
    };
  }

  // Dynamic Date-Time Overlap Check
  // Note: A user with 0 commitments (e.g. new user) or whose commitments do not overlap (s1 < e2 && e1 > s2)
  // automatically passes the overlap check and proceeds to standard eligibility.
  if (!options.skipOverlapCheck && journey.startDate && journey.endDate) {
    const conflictingCommitment = await getOverlappingCommitment(
      normUserId,
      journey.startDate,
      journey.endDate,
      journey._id || journey.id,
      refDate,
      options.session || null
    );

    if (conflictingCommitment) {
      const conflictLifecycle = getJourneyLifecycle(conflictingCommitment, refDate);
      if (conflictLifecycle.isOngoing) {
        return {
          allowed: false,
          code: "ACTIVE_JOURNEY_CONFLICT",
          conflictingJourney: conflictingCommitment,
          reason: "You're currently on an active journey that overlaps with this trip. Complete your current trip before joining this journey."
        };
      }
      return {
        allowed: false,
        code: "OVERLAPPING_JOURNEY",
        conflictingJourney: conflictingCommitment,
        reason: "You already have another journey during these dates."
      };
    }
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    reason: "You are eligible to join this journey."
  };
};

// Check whether invitations can be sent for a journey (Host-only, Planning/Upcoming only).
const canInviteMembers = (userId, journey) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      statusCode: 404,
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      statusCode: 400,
      reason: "Valid user ID is required."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);

  if (lifecycle.isCancelled) {
    return {
      allowed: false,
      code: "JOURNEY_CANCELLED",
      statusCode: 400,
      reason: "Cannot send invitations for a cancelled journey."
    };
  }

  if (lifecycle.isCompleted) {
    return {
      allowed: false,
      code: "JOURNEY_COMPLETED",
      statusCode: 400,
      reason: "Cannot send invitations for a completed journey."
    };
  }

  if (lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "ROSTER_LOCKED",
      statusCode: 400,
      reason: "This journey has started and is no longer accepting new travelers."
    };
  }

  // Host-only: Planning/Upcoming allows Host to invite. Co-Leaders & regular members cannot invite.
  if (!isCreator(normUserId, journey)) {
    return {
      allowed: false,
      code: "NOT_HOST",
      statusCode: 403,
      reason: "Only the journey host/creator can send invitations."
    };
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    statusCode: 200,
    reason: "Invitations can be sent."
  };
};

// Check whether a user can leave a journey.
const canLeaveJourney = (userId, journey) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      reason: "Valid user ID is required."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);

  if (lifecycle.isCancelled) {
    return {
      allowed: false,
      code: "JOURNEY_CANCELLED",
      reason: "Cannot leave a cancelled journey."
    };
  }

  if (lifecycle.isCompleted) {
    return {
      allowed: false,
      code: "JOURNEY_COMPLETED",
      reason: "Cannot leave a completed journey."
    };
  }

  const isHost = isCreator(normUserId, journey);
  const isMember = isActiveMember(normUserId, journey);

  if (!isHost && !isMember) {
    return {
      allowed: false,
      code: "NOT_MEMBER",
      reason: "You are not an active member of this journey."
    };
  }

  if (lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "JOURNEY_ACTIVE",
      reason: "You cannot leave an active journey after it has started."
    };
  }

  // Planning / Upcoming phase
  if (isHost) {
    const otherMembers = getOtherActiveMembers(normUserId, journey);
    if (otherMembers.length > 0) {
      return {
        allowed: false,
        code: "HOST_TRANSFER_REQUIRED",
        hasEligibleMembers: true,
        requiresHostTransfer: true,
        reason: "You are the host. Transfer hosting to another member before leaving."
      };
    } else {
      return {
        allowed: false,
        code: "CANCELLATION_REQUIRED",
        hasEligibleMembers: false,
        requiresCancellation: true,
        reason: "You are the host and there are no other active members in this journey. Please cancel the journey instead of leaving."
      };
    }
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    reason: "You can leave this journey."
  };
};

// Check whether the host can cancel this journey.
const canCancelJourney = (userId, journey) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      statusCode: 404,
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      statusCode: 400,
      reason: "Valid user ID is required."
    };
  }

  if (!isCreator(normUserId, journey)) {
    return {
      allowed: false,
      code: "NOT_HOST",
      statusCode: 403,
      reason: "Only the journey host/creator can cancel this journey."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);

  if (lifecycle.isCancelled) {
    return {
      allowed: false,
      code: "ALREADY_CANCELLED",
      statusCode: 200,
      isAlreadyCancelled: true,
      reason: "Journey is already cancelled."
    };
  }

  if (lifecycle.isCompleted) {
    return {
      allowed: false,
      code: "JOURNEY_COMPLETED",
      statusCode: 400,
      reason: "Completed journeys cannot be cancelled."
    };
  }

  if (lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "JOURNEY_ACTIVE",
      statusCode: 400,
      reason: "An active journey cannot be cancelled after it has started."
    };
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    statusCode: 200,
    reason: "Journey can be cancelled."
  };
};

// Check whether a host can assign a co-leader (Co-Organizer) during an ongoing journey.
const canAssignCoLeader = (userId, journey, targetUserId) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      statusCode: 404,
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  const normTargetUserId = normalizeId(targetUserId);

  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      statusCode: 400,
      reason: "Valid requester user ID is required."
    };
  }

  if (!normTargetUserId) {
    return {
      allowed: false,
      code: "INVALID_TARGET_USER",
      statusCode: 400,
      reason: "Valid target user ID is required."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);

  if (!lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_ACTIVE",
      statusCode: 400,
      reason: "Co-leader can only be assigned during an active (ongoing) journey."
    };
  }

  if (!isCreator(normUserId, journey)) {
    return {
      allowed: false,
      code: "NOT_HOST",
      statusCode: 403,
      reason: "Only the journey creator/host can assign a co-leader."
    };
  }

  if (normTargetUserId === normUserId || isCreator(normTargetUserId, journey)) {
    return {
      allowed: false,
      code: "TARGET_IS_HOST",
      statusCode: 400,
      reason: "The target user is already the host/creator."
    };
  }

  const targetMember = getMember(normTargetUserId, journey);
  if (!targetMember || (targetMember.status && targetMember.status !== "active")) {
    return {
      allowed: false,
      code: "TARGET_NOT_MEMBER",
      statusCode: 400,
      reason: "Target user is not an active member of this journey."
    };
  }

  const existingCoLeader = (journey.members || []).find((m) => {
    const mId = normalizeId(m.user || m._id || m);
    return (
      mId &&
      mId !== normTargetUserId &&
      m.role === "Co-Organizer" &&
      (!m.status || m.status === "active")
    );
  });

  if (existingCoLeader) {
    return {
      allowed: false,
      code: "CO_LEADER_ALREADY_ASSIGNED",
      statusCode: 400,
      reason: "A co-leader is already assigned to this journey."
    };
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    statusCode: 200,
    reason: "Target user is eligible to be assigned as co-leader."
  };
};

// Check whether a host can remove a co-leader (sets role back to "Member").
const canRemoveCoLeader = (userId, journey, targetUserId) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      statusCode: 404,
      reason: "Journey does not exist."
    };
  }

  const normUserId = normalizeId(userId);
  const normTargetUserId = normalizeId(targetUserId);

  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      statusCode: 400,
      reason: "Valid requester user ID is required."
    };
  }

  if (!normTargetUserId) {
    return {
      allowed: false,
      code: "INVALID_TARGET_USER",
      statusCode: 400,
      reason: "Valid target user ID is required."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);
  if (!lifecycle.isOngoing) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_ACTIVE",
      statusCode: 400,
      reason: "Co-leader can only be managed during an active (ongoing) journey."
    };
  }

  if (!isCreator(normUserId, journey)) {
    return {
      allowed: false,
      code: "NOT_HOST",
      statusCode: 403,
      reason: "Only the journey creator/host can remove a co-leader."
    };
  }

  const targetMember = getMember(normTargetUserId, journey);
  if (!targetMember || (targetMember.status && targetMember.status !== "active")) {
    return {
      allowed: false,
      code: "TARGET_NOT_MEMBER",
      statusCode: 400,
      reason: "Target user is not an active member of this journey."
    };
  }

  if (targetMember.role !== "Co-Organizer") {
    return {
      allowed: false,
      code: "TARGET_NOT_CO_LEADER",
      statusCode: 400,
      reason: "Target user is not currently assigned as a co-leader."
    };
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    statusCode: 200,
    reason: "Co-leader can be removed."
  };
};

// Check whether a host or co-leader can send a warning to a member.
const canWarnMember = (userId, journey, targetUserId, reason) => {
  if (!journey) {
    return {
      allowed: false,
      code: "JOURNEY_NOT_FOUND",
      statusCode: 404,
      reason: "Journey not found."
    };
  }

  const normUserId = normalizeId(userId);
  const normTargetUserId = normalizeId(targetUserId);

  if (!normUserId) {
    return {
      allowed: false,
      code: "INVALID_USER",
      statusCode: 400,
      reason: "Valid requester user ID is required."
    };
  }

  if (!normTargetUserId) {
    return {
      allowed: false,
      code: "INVALID_TARGET_USER",
      statusCode: 400,
      reason: "Valid target user ID is required."
    };
  }

  if (normUserId === normTargetUserId) {
    return {
      allowed: false,
      code: "INVALID_WARNING",
      statusCode: 400,
      reason: "You cannot send a warning to yourself."
    };
  }

  const isHost = isCreator(normUserId, journey);
  const requesterMember = getMember(normUserId, journey);
  const isCoLeader = requesterMember?.role === "Co-Organizer";

  if (!isHost && !isCoLeader) {
    return {
      allowed: false,
      code: "UNAUTHORIZED_WARNING",
      statusCode: 403,
      reason: "Only the journey host or co-leader can send warnings."
    };
  }

  const lifecycle = getJourneyLifecycle(journey);
  if (lifecycle.isCompleted || lifecycle.isCancelled) {
    return {
      allowed: false,
      code: "INVALID_WARNING",
      statusCode: 400,
      reason: "Cannot send warnings on completed or cancelled journeys."
    };
  }

  if (isCreator(normTargetUserId, journey)) {
    return {
      allowed: false,
      code: "INVALID_WARNING",
      statusCode: 400,
      reason: "Cannot send a warning to the journey host."
    };
  }

  const targetMember = getMember(normTargetUserId, journey);
  if (!targetMember || (targetMember.status && targetMember.status !== "active")) {
    return {
      allowed: false,
      code: "MEMBER_NOT_FOUND",
      statusCode: 404,
      reason: "Target user is not an active member of this journey."
    };
  }

  const trimmedReason = (reason || "").trim();
  if (!trimmedReason || trimmedReason.length < 3) {
    return {
      allowed: false,
      code: "INVALID_WARNING",
      statusCode: 400,
      reason: "Please provide a meaningful warning reason (at least 3 characters)."
    };
  }

  return {
    allowed: true,
    code: "ELIGIBLE",
    statusCode: 200,
    reason: "Warning can be sent."
  };
};

module.exports = {
  getJourneyLifecycle,
  canJoinJourney,
  canInviteMembers,
  canLeaveJourney,
  canCancelJourney,
  canAssignCoLeader,
  canRemoveCoLeader,
  canWarnMember,
  getUserActiveJourney,
  getOverlappingCommitment,
  hasOverlappingJourney,
  datesOverlap,
  getLifecycleStatus,
  normalizeId,
  isCreator,
  isActiveMember,
  getMember,
  getOtherActiveMembers
};
