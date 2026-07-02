require("../config/nodeCompatibility");

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const asyncHandler = require("express-async-handler");
const { getJwtSecret } = require("../config/jwt");

/**
 * Update the last active time of the current session.
 * This runs in the background and does not block the request.
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
 * Verify JWT token.
 * Supports authentication using either:
 * 1. Cookie (access_token)
 * 2. Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    // Read token from Authorization header
    const authHeader = req.headers.authorization;

    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    // Prefer cookie token, otherwise use Bearer token
    const token = req.cookies.access_token || bearerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, getJwtSecret());

    // Attach user information to request
    req.user = decoded;
    req.token = token;

    // Update session activity
    markSessionActive(token);

    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error.message);

    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};
/**
 * Allow access only to admin users.
 */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  });
};

/**
 * Authenticate user and load complete user details.
 * Used for protected routes that require full user information.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.access_token;

  // Support Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, getJwtSecret());

    // Fetch authenticated user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    req.user = user;
    req.token = token;

    // Update session activity
    markSessionActive(token);

    next();
  } catch (error) {
    console.error("[Protect Middleware]", error.message);

    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
});

/**
 * Allow access only to the requested user or an admin.
 */
const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (
      req.user.id === req.params.id ||
      req.user._id?.toString() === req.params.id ||
      req.user.isAdmin
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action.",
    });
  });
};

/**
 * Allow access only to Train Admins or System Admins.
 */
const verifyTrainOwner = (req, res, next) => {
  verifyToken(req, res, () => {
    const isTrainAdmin =
      req.user.type === "trainAdmin" || req.user.isAdmin;

    if (!isTrainAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Train Admin privileges required.",
      });
    }

    next();
  });
};
/**
 * Allow access only to Finance Managers or System Admins.
 */
const verifyFinanceManager = (req, res, next) => {
  verifyToken(req, res, () => {
    const isFinanceManager =
      req.user.type === "financeManager" || req.user.isAdmin;

    if (!isFinanceManager) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Finance Manager privileges required.",
      });
    }

    next();
  });
};

/**
 * Prevent suspended users from accessing protected resources.
 */
const checkSuspended = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authorized.",
    });
  }

  const user = await User.findById(userId).select("isSuspended");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  if (user.isSuspended) {
    return res.status(403).json({
      success: false,
      message: "Your account is suspended. You cannot perform this action.",
    });
  }

  next();
});

/**
 * Optionally verify JWT token if present. Does not return error if token is missing or invalid.
 */
const optionalVerifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = req.cookies.access_token || bearerToken;

    if (token) {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
      req.token = token;
      markSessionActive(token);
    }
  } catch (error) {
    // Ignore invalid token on optional auth routes
  }
  next();
};

module.exports = {
  protect,
  verifyToken,
  optionalVerifyToken,
  verifyAdmin,
  verifyUser,
  verifyTrainOwner,
  verifyFinanceManager,
  checkSuspended,
};