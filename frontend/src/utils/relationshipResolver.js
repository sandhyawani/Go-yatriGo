const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

const containsId = (list, id) => {
  if (!Array.isArray(list) || !id) return false;
  return list.some((item) => getId(item) === id);
};

const emptyRelationship = {
  isSelf: false,
  isFollowing: false,
  isFollower: false,
  requestSent: false,
  requestReceived: false,
  isPrivate: false,
  isTripMate: false,
  isBlocked: false,
  isBlockedByMe: false,
  isBlockedByThem: false,
  socialState: "none",
  tripMateState: "none",
};

export const resolveRelationship = (
  currentUser,
  targetUser,
  tripMateStatus
) => {
  if (!currentUser || !targetUser) {
    return { ...emptyRelationship };
  }

  const currentId = getId(currentUser);
  const targetId = getId(targetUser);

  if (!currentId || !targetId) {
    return { ...emptyRelationship };
  }

  const isSelf = currentId === targetId;

  if (isSelf) {
    return {
      ...emptyRelationship,
      isSelf: true,
      socialState: "self",
    };
  }

  const isBlockedByMe = Boolean(
    targetUser.isBlockedByMe ||
    containsId(currentUser.blockedUsers, targetId)
  );

  const isBlockedByThem = Boolean(
    targetUser.isBlockedByThem ||
    containsId(targetUser.blockedUsers, currentId)
  );

  const isBlocked = isBlockedByMe || isBlockedByThem;

  const isFollowing = !isBlocked && containsId(
    currentUser.following,
    targetId
  );

  const isFollower = !isBlocked && containsId(
    currentUser.followers,
    targetId
  );

  const requestSent = !isBlocked && containsId(
    targetUser.followRequests,
    currentId
  );

  const requestReceived = !isBlocked && containsId(
    currentUser.followRequests,
    targetId
  );

  const isPrivate = targetUser.privateAccount === true;

  let socialState = "none";

  if (isBlockedByMe) {
    socialState = "blocked_by_me";
  } else if (isBlockedByThem) {
    socialState = "blocked_by_them";
  } else if (isFollowing && isFollower) {
    socialState = "mutual";
  } else if (requestReceived) {
    socialState = "incoming_request";
  } else if (isFollowing) {
    socialState = "following";
  } else if (requestSent) {
    socialState = "requested";
  }

  const isTripMate =
    !isBlocked && String(tripMateStatus || "").trim().toLowerCase() === "connected";

  return {
    isSelf,
    isFollowing,
    isFollower,
    requestSent,
    requestReceived,
    isPrivate,
    isTripMate,
    isBlocked,
    isBlockedByMe,
    isBlockedByThem,
    socialState,
    tripMateState: isTripMate ? "trip_mate" : "none",
  };
};

export const getActionButtons = (
  relationship,
  handlers = {}
) => {
  if (
    !relationship ||
    relationship.isSelf ||
    relationship.socialState === "self" ||
    relationship.isBlocked ||
    relationship.socialState === "blocked_by_me" ||
    relationship.socialState === "blocked_by_them"
  ) {
    return [];
  }

  const {
    onFollow,
    onUnfollow,
    onCancelRequest,
    onAcceptRequest,
    onDeclineRequest,
    onRemoveFollower,
  } = handlers;

  const buttons = [];

  if (
    relationship.socialState === "mutual" ||
    relationship.socialState === "following"
  ) {
    if (onUnfollow) {
      buttons.push({
        label: "Following",
        action: onUnfollow,
        variant: "following",
      });
    }
  } else if (relationship.socialState === "requested") {
    if (onCancelRequest) {
      buttons.push({
        label: "Cancel Request",
        action: onCancelRequest,
        variant: "requested",
      });
    }
  } else if (relationship.socialState === "incoming_request") {
    if (onAcceptRequest) {
      buttons.push({
        label: "Accept",
        action: onAcceptRequest,
        variant: "primary",
      });
    }

    if (onDeclineRequest) {
      buttons.push({
        label: "Decline",
        action: onDeclineRequest,
        variant: "danger",
      });
    }
  } else if (onFollow) {
    buttons.push({
      label: "Follow",
      action: onFollow,
      variant: "primary",
    });
  }

  if (relationship.isFollower && onRemoveFollower) {
    buttons.push({
      label: "Remove Follower",
      action: onRemoveFollower,
      variant: "danger",
    });
  }

  return buttons;
};

export const resolveReviewEligibility = (
  currentUser,
  targetUser,
  journeys = []
) => {
  if (!currentUser || !targetUser) {
    return false;
  }

  const currentId = getId(currentUser);
  const targetId = getId(targetUser);

  if (!currentId || !targetId || currentId === targetId) {
    return false;
  }

  // Authoritative backend flag for unreviewed eligibility
  if (typeof targetUser.canReview === "boolean") {
    return targetUser.canReview;
  }

  const isParticipant = (journey, userId) => {
    if (!journey || !userId) {
      return false;
    }

    const ownerIds = [
      getId(journey.host),
      getId(journey.creator),
      getId(journey.userId),
    ];

    if (ownerIds.includes(userId)) {
      return true;
    }

    if (Array.isArray(journey.members)) {
      if (
        journey.members.some(
          (member) =>
            getId(member) === userId ||
            getId(member.user) === userId
        )
      ) {
        return true;
      }
    }

    if (Array.isArray(journey.companions)) {
      return journey.companions.some(
        (companion) =>
          getId(companion) === userId ||
          getId(companion.userId) === userId
      );
    }

    return false;
  };

  const hasCompletedInJourneys = Array.isArray(journeys) && journeys.some((journey) => {
    if (!journey) {
      return false;
    }

    const status = String(
      journey.status || journey.lifecycleStatus || ""
    ).trim().toLowerCase();

    if (status !== "completed") {
      return false;
    }

    if (
      journey.isCancelled === true ||
      status === "cancelled" ||
      status === "canceled"
    ) {
      return false;
    }

    return (
      isParticipant(journey, currentId) &&
      isParticipant(journey, targetId)
    );
  });

  return hasCompletedInJourneys || targetUser.hasSharedCompletedJourney === true;
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    resolveRelationship,
    getActionButtons,
    resolveReviewEligibility,
  };
}