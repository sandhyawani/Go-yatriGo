const { isActuallyVerified } = require("../utils/verificationHelper");

/**
 * Middleware requiring that the authenticated user is a verified traveler
 * (or platform administrator).
 *
 * Gated actions:
 * - Creating journeys / trips
 * - Joining journeys / requesting to join
 * - Accepting journey invitations
 * - Creating Travel Buddy trips
 * - Requesting to join Travel Buddy trips
 * - Starting direct chats
 * - Sending messages in chat rooms
 *
 * Rejection response:
 * HTTP 403 Forbidden with code: "VERIFICATION_REQUIRED"
 * and current actual verificationStatus (e.g. "unverified", "pending", "rejected").
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (isActuallyVerified(req.user)) {
    return next();
  }

  const currentStatus = req.user.verificationStatus || "unverified";

  return res.status(403).json({
    success: false,
    code: "VERIFICATION_REQUIRED",
    message: "Government ID verification is required to perform this action. Please verify your identity in profile settings.",
    verificationStatus: currentStatus
  });
};

module.exports = requireVerified;
