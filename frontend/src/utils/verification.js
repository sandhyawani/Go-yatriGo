// Verified only if admin approved: isVerified === true && verificationStatus === 'verified' (or admin)
export const isActuallyVerified = (user) => {
  if (!user) return false;
  if (user.isAdmin === true || user.role === "admin") return true;
  return Boolean(user.isVerified === true && user.verificationStatus === "verified");
};

export const getVerificationStatus = (user) => {
  if (!user) return "unverified";
  if (isActuallyVerified(user)) return "verified";
  if (user.verificationStatus === "pending") return "pending";
  if (user.verificationStatus === "rejected") return "rejected";
  return "unverified";
};
