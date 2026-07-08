const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");

// Helper to extract JWT token
const getToken = (req) => {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// Base Authentication Middleware
const userMiddleware = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    res.status(401);
    throw new Error("Authentication token not found");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
});

// Admin-Only Authorization (Reuses req.user)
const adminMiddleware = [
  userMiddleware,
  (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  },
];

// Event Organizer or Admin Authorization (Reuses req.user)
const organizerMiddleware = [
  userMiddleware,
  (req, res, next) => {
    if (req.user.type !== "eventOrganizer" && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Organizer access required",
      });
    }
    next();
  },
];

module.exports = {
  userMiddleware,
  adminMiddleware,
  organizerMiddleware,
};