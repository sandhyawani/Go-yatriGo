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
