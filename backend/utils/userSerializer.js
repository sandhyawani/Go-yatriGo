const mongoose = require("mongoose");

// Serializes user profile data according to viewer authorization and privacy rules
const serializePublicUser = (userDoc, options = {}) => {
  if (!userDoc) return null;

  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

  const viewerId = options.viewerId ? options.viewerId.toString() : null;
  const targetId = (user._id || user.id || "").toString();

  const isOwner = Boolean(
    options.isOwner ||
    (viewerId && targetId && viewerId === targetId)
  );
  const isAdmin = Boolean(options.isAdmin);
  const isTripMate = Boolean(options.isTripMate);
  const isFollower = Boolean(options.isFollower);

  const isTrulyVerified = Boolean(
    user.isVerified === true && user.verificationStatus === "verified"
  );

  const serialized = {
    _id: user._id,
    name: user.name || "",
    username: user.username || "",
    pic: user.pic || user.avatar || user.profilePic || user.profilePicture || user.img || "",
    avatar: user.avatar || user.pic || "",
    profilePic: user.profilePic || user.pic || "",
    profilePicture: user.profilePicture || user.pic || "",
    img: user.img || user.pic || "",
    userPic: user.userPic || user.pic || "",
    coverImage: user.coverImage || user.coverPic || "",
    coverPic: user.coverPic || user.coverImage || "",
    bio: user.bio || "",
    role: user.role || "Traveler",
    type: user.type || "traveler",
    interests: Array.isArray(user.interests) ? user.interests : [],
    preferredTravelStyle: user.preferredTravelStyle || "",
    favoriteDestinations: Array.isArray(user.favoriteDestinations) ? user.favoriteDestinations : [],
    rating: typeof user.rating === "number" ? user.rating : 0,
    reviewsCount: typeof user.reviewsCount === "number" ? user.reviewsCount : 0,
    completedTrips: typeof user.completedTrips === "number" ? user.completedTrips : 0,
    hostResponseRate: typeof user.hostResponseRate === "number" ? user.hostResponseRate : 100,
    privateAccount: Boolean(user.privateAccount),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  serialized.isVerified = isTrulyVerified;

  if (isOwner || isAdmin) {
    // Owner & Admin can view verification audit details for their own account
    serialized.verificationStatus = user.verificationStatus || "unverified";
    serialized.verificationNote = user.verificationNote || "";
    serialized.govIdType = user.govIdType || "";
    serialized.email = user.email || "";
    serialized.mobile = user.mobile || "";
    serialized.twoFactorEnabled = Boolean(user.twoFactorEnabled);
    serialized.verifiedEmail = Boolean(user.verifiedEmail);
    serialized.verifiedPhone = Boolean(user.verifiedPhone);
    serialized.blockedUsers = user.blockedUsers || [];
    serialized.privacySettings = user.privacySettings || {};
  } else {
    // External viewer: do not leak audit notes or pending/rejected status
    serialized.verificationStatus = isTrulyVerified ? "verified" : "unverified";
    // Never expose private fields to external viewers
    delete serialized.verificationNote;
    delete serialized.govIdType;
    delete serialized.govId;
    delete serialized.email;
    delete serialized.mobile;
    delete serialized.twoFactorEnabled;
    delete serialized.blockedUsers;
    delete serialized.reportedBy;

    // Provide sanitized public privacy flags for UI behavior
    const privacy = user.privacySettings || {};
    serialized.privacySettings = {
      whoCanMessage: privacy.whoCanMessage || "everyone",
      connectionRequests: privacy.connectionRequests || "everyone",
      profileLocationVisibility: privacy.profileLocationVisibility || "mates_only",
    };
  }

  // Location Privacy enforcement:
  const locationVisibility = user.privacySettings?.profileLocationVisibility || "mates_only";

  if (isOwner || isAdmin) {
    serialized.city = user.city || "";
    serialized.state = user.state || "";
    serialized.country = user.country || "India";
  } else {
    if (locationVisibility === "everyone") {
      serialized.city = user.city || "";
      serialized.state = user.state || "";
      serialized.country = user.country || "India";
    } else if (locationVisibility === "mates_only" && isTripMate) {
      serialized.city = user.city || "";
      serialized.state = user.state || "";
      serialized.country = user.country || "India";
    } else {
      // Omit / Redact location
      delete serialized.city;
      delete serialized.state;
      delete serialized.country;
    }
  }

  // Preserve relationship / content visibility fields passed in options or user
  if (typeof options.canViewContent === "boolean") {
    serialized.canViewContent = options.canViewContent;
  }
  if (typeof options.isBlockedByMe === "boolean") {
    serialized.isBlockedByMe = options.isBlockedByMe;
  }
  if (typeof options.isBlockedByThem === "boolean") {
    serialized.isBlockedByThem = options.isBlockedByThem;
  }
  if (typeof options.isTripMate === "boolean") {
    serialized.isTripMate = options.isTripMate;
  }
  if (typeof options.hasSharedCompletedJourney === "boolean") {
    serialized.hasSharedCompletedJourney = options.hasSharedCompletedJourney;
  }
  if (typeof options.canReview === "boolean") {
    serialized.canReview = options.canReview;
  }
  if (typeof options.tripMatesCount === "number") {
    serialized.tripMatesCount = options.tripMatesCount;
  }
  if (typeof options.mutualsCount === "number") {
    serialized.mutualsCount = options.mutualsCount;
  }
  if (typeof options.followersCount === "number") {
    serialized.followersCount = options.followersCount;
  }
  if (typeof options.followingCount === "number") {
    serialized.followingCount = options.followingCount;
  }
  if (Array.isArray(options.followers)) {
    serialized.followers = options.followers;
  }
  if (Array.isArray(options.following)) {
    serialized.following = options.following;
  }
  if (Array.isArray(options.followRequests)) {
    serialized.followRequests = options.followRequests;
  }

  return serialized;
};

// Minimal serializer for reviewers in companion reviews
const serializeReviewer = (reviewerDoc) => {
  if (!reviewerDoc) return null;
  const rev = reviewerDoc.toObject ? reviewerDoc.toObject() : { ...reviewerDoc };

  return {
    _id: rev._id,
    name: rev.name || "Traveler",
    username: rev.username || "",
    pic: rev.pic || rev.avatar || rev.profilePic || rev.img || "",
    avatar: rev.avatar || rev.pic || "",
    isVerified: Boolean(rev.isVerified === true && rev.verificationStatus === "verified"),
  };
};

module.exports = {
  serializePublicUser,
  serializeReviewer,
};
