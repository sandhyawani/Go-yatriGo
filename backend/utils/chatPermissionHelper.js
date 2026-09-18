const { isBlockedPair } = require("./blockHelper");

/**
 * Evaluates whether an authenticated user can start or access a direct 1-on-1 chat with a target user.
 * Direct chat requires authentication and absence of block/privacy restrictions.
 * Following, mutual follow, and verification are NOT required.
 *
 * @param {Object|string} currentUser
 * @param {Object|string} targetUser
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const canStartDirectChat = async (currentUser, targetUser) => {
  const currentId = (currentUser?._id || currentUser?.id || currentUser)?.toString();
  const targetId = (targetUser?._id || targetUser?.id || targetUser)?.toString();

  if (!currentId) {
    return { allowed: false, reason: "Authentication required to start chat" };
  }
  if (!targetId) {
    return { allowed: false, reason: "Target user not specified" };
  }
  if (currentId === targetId) {
    return { allowed: false, reason: "You cannot chat with yourself" };
  }

  const isBlocked = await isBlockedPair(currentId, targetId);
  if (isBlocked) {
    return { allowed: false, reason: "Cannot chat with a blocked user" };
  }

  const targetDoc = typeof targetUser === "object" ? targetUser : null;
  const whoCanMsg = targetDoc?.privacySettings?.whoCanMessage || "everyone";

  if (whoCanMsg === "none") {
    return { allowed: false, reason: "This user does not accept direct messages." };
  }

  if (whoCanMsg === "mates_only") {
    const { getValidTripMates } = require("../controllers/tripMateController");
    const validMates = await getValidTripMates(currentId);
    const isMate = validMates.some((m) => (m._id || m)?.toString() === targetId);
    if (!isMate) {
      return { allowed: false, reason: "Only approved Trip Mates can message this user." };
    }
  }

  return { allowed: true };
};

module.exports = { canStartDirectChat };
