

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const asyncHandler = require("express-async-handler");
const { getJwtSecret } = require("../config/jwt");

/**
 * Update the last active time of the current session in the background.
 */
const markSessionActive = (token) => {
  Session.updateOne(
    { token, status: "active" },
    { $set: { lastActive: new Date() } }
  ).catch((error) => {
    console.error("[Session] Failed to update activity:", error.message);
  });
};

/**
 * Helper to extract JWT token from cookies or authorization headers
 */
const getToken = (req) => {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

/**
 * Securely authenticates a user and handles token state checks.
 * Ensures fresh database record context is available downstream.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Fetch live user status to ensure fresh flags and state
    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Access denied.",
      });
    }

    req.user = user;
    req.token = token;

    markSessionActive(token);
    next();
  } catch (error) {
    console.error("[Auth Middleware Error]:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
});

/**
 * Legacy support placeholder pointing to core verified protection logic
 */
const verifyToken = protect;

/**
 * Limit access to administrative personnel
 */
const verifyAdmin = [
  protect,
  (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
    next();
  },
];

/**
 * Verify resource target belongs to the active user or administrative viewer
 */
const verifyUser = [
  protect,
  (req, res, next) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id || req.user.id;

    if (currentUserId.toString() === targetUserId?.toString() || req.user.isAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action.",
    });
  },
];

/**
 * Limit access to Train Admins or System Admins
 */
const verifyTrainOwner = [
  protect,
  (req, res, next) => {
    if (req.user.type !== "trainAdmin" && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Train Admin privileges required.",
      });
    }
    next();
  },
];

/**
 * Limit access to Finance Managers or System Admins
 */
const verifyFinanceManager = [
  protect,
  (req, res, next) => {
    if (req.user.type !== "financeManager" && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Finance Manager privileges required.",
      });
    }
    next();
  },
];

/**
 * Prevent suspended users from accessing protected routes.
 */
const checkSuspended = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. User context missing.",
    });
  }

  if (req.user.isSuspended) {
    return res.status(403).json({
      success: false,
      message: "Your account is suspended. Access denied.",
    });
  }

  next();
});

/**
 * Optional identification verification loop (Does not fail if credentials missing)
 */
const optionalVerifyToken = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id || decoded._id).select("-password");
      if (user && !user.isSuspended) {
        req.user = user;
        req.token = token;
        markSessionActive(token);
      }
    } catch (error) {
      // Intentionally absorb validation errors for anonymous fallback paths
    }
  }
  next();
});

module.exports = {
  protect,
  verifyToken,
  checkSuspended,
  optionalVerifyToken,
  verifyAdmin,
  verifyUser,
  verifyTrainOwner,
  verifyFinanceManager,
};