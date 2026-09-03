// Verified only if admin approved: isVerified === true && verificationStatus === 'verified'
export const isActuallyVerified = (user) => {
  if (!user) return false;
  return Boolean(user.isVerified === true && user.verificationStatus === "verified");
};

export const getVerificationStatus = (user) => {
  if (!user) return "unverified";
  if (isActuallyVerified(user)) return "verified";
  if (user.verificationStatus === "pending") return "pending";
  if (user.verificationStatus === "rejected") return "rejected";
  return "unverified";
};
