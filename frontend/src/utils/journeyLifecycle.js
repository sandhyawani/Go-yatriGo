export const JOURNEY_STATUS_VALUES = {
  ALL: "all",
  ACTIVE: "active",
  UPCOMING: "upcoming",
  COMPLETED: "completed"
};

export const STATUS_DISPLAY_LABELS = {
  all: "All Status",
  active: "Active Now",
  upcoming: "Upcoming",
  completed: "Completed"
};

export const STATUS_DROPDOWN_OPTIONS = [
  { id: "all", label: "All Status" },
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" }
];

export const normalizeJourneyStatus = (status, trip) => {
  const tripObj = typeof status === "object" && status !== null ? status : trip;
  const val = typeof status === "object" && status !== null
    ? (status.lifecycleStatus || status.status)
    : (status || trip?.lifecycleStatus || trip?.status);
  const s = String(val || "").trim().toLowerCase().replace(/[-_]/g, " ");

  // Cancelled is a distinct lifecycle state and must never be converted to completed
  if (s === "cancelled" || s === "canceled" || s === "archived" || tripObj?.isCancelled === true || Boolean(tripObj?.cancelledAt)) {
    return "cancelled";
  }
  if (s === "completed" || s === "finished" || s === "done") {
    return "completed";
  }
  if (s === "upcoming" || s === "scheduled" || s === "future" || s === "planning" || s === "starts soon" || s === "starting soon") {
    if (tripObj?.endDate && new Date(tripObj.endDate).getTime() < Date.now()) {
      return "completed";
    }
    return "upcoming";
  }
  if (s === "active" || s === "in progress" || s === "ongoing" || s === "started" || s === "active now" || s === "open") {
    if (tripObj?.endDate && new Date(tripObj.endDate).getTime() < Date.now()) {
      return "completed";
    }
    if (tripObj?.startDate && new Date(tripObj.startDate).getTime() > Date.now() && (s === "open" || s === "planning")) {
      return "upcoming";
    }
    return "active";
  }

  // Date fallbacks if available and not cancelled
  if (tripObj?.startDate && tripObj?.endDate) {
    const now = Date.now();
    const start = new Date(tripObj.startDate).getTime();
    const end = new Date(tripObj.endDate).getTime();
    if (!isNaN(end) && end < now) return "completed";
    if (!isNaN(start) && start > now) return "upcoming";
    return "active";
  }

  return "active";
};

export const normalizeFilterStatus = (status) => {
  if (!status) return "all";
  const s = String(status).trim().toLowerCase().replace(/[-_]/g, " ");
  if (s === "active" || s === "active now" || s === "ongoing" || s === "in progress") return "active";
  if (s === "upcoming" || s === "planning") return "upcoming";
  if (s === "completed" || s === "finished") return "completed";
  return "all";
};

export const datesOverlap = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return false;
  return s1 < e2 && e1 > s2;
};

export const getJourneyLifecycle = (journey, referenceDate = new Date()) => {
  if (!journey) {
    return {
      status: "Unknown",
      isPlanning: false,
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
      isPlanning: false,
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
      return {
        status: "Completed",
        isPlanning: false,
        isUpcoming: false,
        isOngoing: false,
        isCompleted: true,
        isCancelled: false
      };
    }
    if (rawStatus === "ongoing" || rawStatus === "active") {
      return {
        status: "Ongoing",
        isPlanning: false,
        isUpcoming: false,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false
      };
    }
    const isPlan = rawStatus === "planning";
    return {
      status: isPlan ? "Planning" : "Upcoming",
      isPlanning: isPlan,
      isUpcoming: true,
      isOngoing: false,
      isCompleted: false,
      isCancelled: false
    };
  }

  if (now > end) {
    return {
      status: "Completed",
      isPlanning: false,
      isUpcoming: false,
      isOngoing: false,
      isCompleted: true,
      isCancelled: false
    };
  }

  if (now >= start && now <= end) {
    return {
      status: "Ongoing",
      isPlanning: false,
      isUpcoming: false,
      isOngoing: true,
      isCompleted: false,
      isCancelled: false
    };
  }

  const isPlan = rawStatus === "planning";
  return {
    status: isPlan ? "Planning" : "Upcoming",
    isPlanning: isPlan,
    isUpcoming: true,
    isOngoing: false,
    isCompleted: false,
    isCancelled: false
  };
};

export const getEligibilityErrorMessage = (err, fallback = "An unexpected error occurred.") => {
  const code = err?.response?.data?.code;
  const backendMessage = err?.response?.data?.message;

  switch (code) {
    case "OVERLAPPING_JOURNEY":
      return "You already have another trip during these dates.";
    case "JOURNEY_ACTIVE":
      return "You cannot leave an active journey after it has started.";
    case "JOURNEY_COMPLETED":
      return "This journey has already been completed.";
    case "JOURNEY_CANCELLED":
      return "This journey has been cancelled.";
    case "CAPACITY_FULL":
      return "This journey has reached maximum member capacity.";
    case "CREATOR_CANNOT_JOIN":
      return "You are the organizer of this journey.";
    case "ALREADY_MEMBER":
      return "You are already a member of this journey.";
    case "NOT_MEMBER":
      return "You are not an active member of this journey.";
    case "HOST_TRANSFER_REQUIRED":
      return "You are the host. Transfer hosting to another member before leaving.";
    case "CANCELLATION_REQUIRED":
      return "You are the host and there are no other members. Please cancel the journey instead.";
    case "NOT_HOST":
      return "Only the journey host can perform this action.";
    case "CO_LEADER_ALREADY_ASSIGNED":
      return "A co-leader is already assigned to this journey.";
    case "TARGET_IS_HOST":
      return "The target user is already the journey host.";
    case "TARGET_NOT_MEMBER":
      return "The target user is not an active member.";
    case "TARGET_NOT_CO_LEADER":
      return "The target user is not currently a co-leader.";
    case "ACTIVE_JOURNEY_CONFLICT":
      return "You're currently on an active trip that overlaps with this trip.";
    case "ROSTER_LOCKED":
      return "This journey has started and is no longer accepting new travelers.";
    case "JOIN_AFTER_START_DISABLED":
      return "This journey has started and is no longer accepting new travelers.";
    default:
      return backendMessage || fallback;
  }
};

export const checkTripOverlapConflict = (myJourneys = [], targetTrip = null, currentUserId = null) => {
  if (!Array.isArray(myJourneys) || !targetTrip || !targetTrip.startDate || !targetTrip.endDate) {
    return { hasConflict: false, conflictType: null, conflictingTrip: null, message: "" };
  }

  const currentUserIdStr = (currentUserId?._id || currentUserId?.id || currentUserId || "").toString();
  const targetIdStr = (targetTrip?._id || targetTrip?.id || "").toString();
  const targetSourceIdStr = (targetTrip?.sourceId || targetTrip?.source_id || "").toString();

  for (const j of myJourneys) {
    const jIdStr = (j?._id || j?.id || "").toString();
    const jSourceIdStr = (j?.sourceId || j?.source_id || "").toString();

    // Skip the target journey itself
    if (jIdStr && targetIdStr && jIdStr === targetIdStr) continue;
    if (jSourceIdStr && targetSourceIdStr && jSourceIdStr === targetSourceIdStr) continue;

    const jLifecycle = getJourneyLifecycle(j);
    // Ignore cancelled or completed commitments
    if (jLifecycle.isCancelled || jLifecycle.isCompleted) continue;

    // Check if user is an active participant in this commitment
    const isHost = (j.creator?._id || j.creator || j.host?._id || j.host)?.toString() === currentUserIdStr;
    const isMember = Array.isArray(j.members) && j.members.some((m) => {
      const uId = (m.user?._id || m.user || m._id || m)?.toString();
      return uId === currentUserIdStr && (!m.status || m.status === "active");
    });

    if (!isHost && !isMember) continue;

    // Evaluate exact timestamp overlap: s1 < e2 && e1 > s2
    if (datesOverlap(j.startDate, j.endDate, targetTrip.startDate, targetTrip.endDate)) {
      if (jLifecycle.isOngoing || j.status === "Ongoing") {
        return {
          hasConflict: true,
          conflictType: "ACTIVE_JOURNEY_CONFLICT",
          conflictingTrip: j,
          message: "You're currently on an active trip that overlaps with this trip."
        };
      }
      return {
        hasConflict: true,
        conflictType: "OVERLAPPING_JOURNEY",
        conflictingTrip: j,
        message: "You already have another trip during these dates."
      };
    }
  }

  return { hasConflict: false, conflictType: null, conflictingTrip: null, message: "" };
};

export const getStandardRole = (role, isHost = false) => {
  if (isHost) return "Host";
  const r = String(role || "").trim().toLowerCase();
  if (r === "host" || r === "organizer" || r === "lead") return "Host";
  if (r === "co-leader" || r === "coleader" || r === "cohost" || r === "co-organizer" || r === "co_leader") return "Co-Leader";
  return "Member";
};

export const getNormalizedMembers = (journeyOrTrip) => {
  if (!journeyOrTrip) return [];

  const hostObj = journeyOrTrip.host || journeyOrTrip.creator;
  const hostId = (hostObj?._id || hostObj?.id || hostObj || "").toString();

  const rawMembers = Array.isArray(journeyOrTrip.members) && journeyOrTrip.members.length > 0
    ? journeyOrTrip.members
    : Array.isArray(journeyOrTrip.companions) && journeyOrTrip.companions.length > 0
    ? journeyOrTrip.companions.map((c) => ({ user: c, role: "Member" }))
    : [];

  const seenUserIds = new Set();
  const normalized = [];

  // If host exists, add host first or verify host presence
  if (hostId) {
    seenUserIds.add(hostId);
    const existingHostEntry = rawMembers.find((m) => {
      const u = m?.user || m;
      const uId = (u?._id || u?.id || u || "").toString();
      return uId === hostId;
    });

    normalized.push({
      _id: existingHostEntry?._id || hostId,
      user: (existingHostEntry?.user && typeof existingHostEntry.user === "object") ? existingHostEntry.user : (typeof hostObj === "object" ? hostObj : { _id: hostId, name: "Host" }),
      role: "Organizer",
      standardRole: "Host",
      joinedAt: existingHostEntry?.joinedAt || journeyOrTrip.createdAt || new Date()
    });
  }

  rawMembers.forEach((m) => {
    const u = m?.user || m;
    const uId = (u?._id || u?.id || u || "").toString();
    if (!uId || seenUserIds.has(uId)) return;
    seenUserIds.add(uId);

    const isThisHost = hostId && uId === hostId;
    const stdRole = getStandardRole(m?.role || (isThisHost ? "Host" : "Member"), isThisHost);

    normalized.push({
      _id: m?._id || uId,
      user: typeof u === "object" ? u : { _id: uId, name: "Traveler" },
      role: m?.role || (isThisHost ? "Organizer" : "Member"),
      standardRole: stdRole,
      joinedAt: m?.joinedAt || new Date()
    });
  });

  return normalized;
};

export const checkIsJourneyMember = (journeyOrTrip, userId) => {
  if (!journeyOrTrip || !userId) return false;
  const uid = (userId?._id || userId?.id || userId || "").toString();
  if (!uid) return false;

  const hostObj = journeyOrTrip.host || journeyOrTrip.creator;
  const hostId = (hostObj?._id || hostObj?.id || hostObj || "").toString();
  if (hostId && hostId === uid) return true;

  const members = journeyOrTrip.members || [];
  const inMembers = members.some((m) => {
    const u = m?.user || m;
    const mId = (u?._id || u?.id || u || "").toString();
    return mId === uid;
  });
  if (inMembers) return true;

  const companions = journeyOrTrip.companions || [];
  const inCompanions = companions.some((c) => {
    const cId = (c?._id || c?.id || c || "").toString();
    return cId === uid;
  });
  return inCompanions;
};

