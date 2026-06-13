require("../config/nodeCompatibility");

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

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const token = req.cookies.access_token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user;
    req.token = token;
    markSessionActive(token);
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that" });
    }
  });
};



const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.access_token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = await User.findById(decoded.id).select("-password");
      req.token = token;

      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      markSessionActive(token);
      next();
    } catch (error) {
      console.log("Error verifying token:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
});

const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ message: "You are not authorized!" });
    }
  });
};


const verifyTrainOwner = (req, res, next) => {
  verifyToken(req, res, () => {
    // Assuming Train Admin role name based on pattern
    if (req.user.type === "trainAdmin" || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not authorized as a Train Admin!" });
    }
  });
};


const verifyFinanceManager = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.type === "financeManager" || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not authorized as a Finance Manager!" });
    }
  });
};


const checkSuspended = asyncHandler(async (req, res, next) => {
  let userId = null;
  if (req.user) {
    userId = req.user.id || req.user._id;
  }
  if (!userId) return res.status(401).json({ message: "Not authorized" });
  
  const user = await User.findById(userId);
  if (user && user.isSuspended) {
    return res.status(403).json({ message: "Your account is suspended. You cannot perform this action." });
  }
  next();
});

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyUser,
  verifyTrainOwner,
  verifyFinanceManager,
  protect,
  checkSuspended,
};
