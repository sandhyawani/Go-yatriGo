/**
 * Shared helper to evaluate if the current user can start or access a direct 1-on-1 chat with a target user.
 * Direct chat requires authentication and absence of block/privacy restrictions.
 * Following, mutual follow, and verification are NOT required.
 *
 * @param {Object} currentUser
 * @param {Object} targetUser
 * @param {boolean} [isTripMate=false]
 * @returns {boolean}
 */
export const canStartDirectChat = (currentUser, targetUser, isTripMate = false) => {
  if (!currentUser || !targetUser) return false;

  const currentId = (currentUser._id || currentUser.id)?.toString();
  const targetId = (targetUser._id || targetUser.id)?.toString();

  if (!currentId || !targetId) return false;
  if (currentId === targetId) return false;

  // Block checks
  const isBlockedByMe = currentUser?.blockedUsers?.some(
    (id) => (id._id || id)?.toString() === targetId
  );
  if (
    isBlockedByMe ||
    targetUser.isBlocked ||
    targetUser.isBlockedByThem
  ) {
    return false;
  }

  // Privacy settings
  const whoCanMessage = targetUser.privacySettings?.whoCanMessage || "everyone";
  if (whoCanMessage === "none") return false;
  if (whoCanMessage === "mates_only" && !isTripMate) return false;

  return true;
};
