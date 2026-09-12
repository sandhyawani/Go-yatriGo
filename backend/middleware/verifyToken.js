
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

const getTokens = (req) => {
  const tokens = [];

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const headerToken = req.headers.authorization.split(" ")[1]?.trim();
    if (headerToken && headerToken !== "null" && headerToken !== "undefined") {
      tokens.push(headerToken);
    }
  }

  if (req.cookies?.access_token) {
    const cookieToken = req.cookies.access_token.trim();
    if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined" && !tokens.includes(cookieToken)) {
      tokens.push(cookieToken);
    }
  }

  return tokens;
};

const getToken = (req) => {
  const tokens = getTokens(req);
  return tokens.length > 0 ? tokens[0] : null;
};

const protect = asyncHandler(async (req, res, next) => {
  const tokens = getTokens(req);

  if (tokens.length === 0) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided."
    });
  }

  let lastError = null;

  for (const token of tokens) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const userId = decoded.id || decoded._id;

      let [user, session] = await Promise.all([
        User.findById(userId),
        Session.findOne({ token, user: userId, status: "active" }).select("_id")
      ]);

      if (!user) {
        lastError = { status: 401, message: "User not found." };
        continue;
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

      if (!session) {
        const revokedSession = await Session.findOne({
          token,
          user: userId,
          status: { $in: ["revoked", "expired"] }
        }).select("_id status");

        if (revokedSession) {
          lastError = { status: 401, message: "Not authorized. Session is no longer active." };
          continue;
        }

        try {
          session = await Session.create({
            user: user._id,
            token,
            browser: req.headers["user-agent"] || "Unknown",
            ipAddress: req.ip || "Unknown",
            status: "active"
          });
        } catch (sessErr) {
          session = await Session.findOne({ token, user: userId, status: "active" }).select("_id");
        }
      }

      req.user = user;
      req.token = token;

      markSessionActive(token);
      return next();
    } catch (error) {
      console.warn("[Auth Middleware] Token candidate failed:", error.message);
      lastError = { status: 401, message: "Not authorized. Invalid or expired token." };
    }
  }

  return res.status(lastError?.status || 401).json({
    success: false,
    message: lastError?.message || "Not authorized. Invalid or expired token."
  });
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
  const tokens = getTokens(req);

  for (const token of tokens) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const userId = decoded.id || decoded._id;
      const [user, session] = await Promise.all([
        User.findById(userId),
        Session.findOne({ token, user: userId, status: "active" }).select("_id")
      ]);
      if (user && session && !user.isSuspended && !user.isDeleted && !user.isDeactivated) {
        req.user = user;
        req.token = token;
        markSessionActive(token);
        break;
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
