/**
 * Authoritative platform-wide helper to check if a user is considered verified.
 *
 * Rules:
 * 1. Admin users (isAdmin === true or role === "admin") are exempt and always considered verified.
 * 2. Regular travelers are verified IF AND ONLY IF isVerified === true AND verificationStatus === "verified".
 *
 * @param {Object} user - User document or authenticated request user object
 * @returns {boolean}
 */
const isActuallyVerified = (user) => {
  if (!user) return false;
  if (user.isAdmin === true || user.role === "admin") {
    return true;
  }
  return Boolean(user.isVerified === true && user.verificationStatus === "verified");
};

module.exports = {
  isActuallyVerified
};
