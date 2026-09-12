const { isActuallyVerified } = require("../utils/verificationHelper");

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
