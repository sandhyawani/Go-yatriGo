
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");

// Helper to extract JWT token
const getToken = (req) => {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

// Authenticate User
const userMiddleware = async (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Admin Only
const adminMiddleware = async (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Admin Authentication Error:", error.message);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Event Organizer or Admin
const organizerMiddleware = async (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.type !== "eventOrganizer" && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Organizer access required",
      });
    }

    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Organizer Authentication Error:", error.message);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  userMiddleware,
  adminMiddleware,
  organizerMiddleware,
};