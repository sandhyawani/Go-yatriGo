

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const asyncHandler = require("express-async-handler");
const { getJwtSecret } = require("../config/jwt");

const markSessionActive = (token) => {
  Session.updateOne(
  { token, status: "active" },
  { $set: { lastActive: new Date() } }
  ).catch((error) => {
    console.error("[Session] Failed to update activity:", error.message);
  });
};

const getToken = (req) => {
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const userId = decoded.id || decoded._id;

    const [user, session] = await Promise.all([
    User.findById(userId),
    Session.findOne({ token, user: userId, status: "active" }).select("_id")]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found."
      });
    }

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Session is no longer active."
      });
    }

    if (user.isDeleted || user.isDeactivated) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Account is not active."
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Access denied."
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
      message: "Not authorized. Invalid or expired token."
    });
  }
});

const verifyToken = protect;

const verifyAdmin = [
protect,
(req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  next();
}];


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
    message: "You are not authorized to perform this action."
  });
}];


const checkSuspended = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. User context missing."
    });
  }

  if (req.user.isSuspended) {
    return res.status(403).json({
      success: false,
      message: "Your account is suspended. Access denied."
    });
  }

  next();
});

const optionalVerifyToken = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const userId = decoded.id || decoded._id;
      const [user, session] = await Promise.all([
      User.findById(userId),
      Session.findOne({ token, user: userId, status: "active" }).select("_id")]
      );
      if (user && session && !user.isSuspended && !user.isDeleted && !user.isDeactivated) {
        req.user = user;
        req.token = token;
        markSessionActive(token);
      }
    } catch (error) {
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
  verifyUser
};
