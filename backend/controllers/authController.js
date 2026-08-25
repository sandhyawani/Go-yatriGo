const User = require("../models/User");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getJwtSecret } = require("../config/jwt");
const sendEmail = require("../utils/sendEmail");
const { INDIAN_STATES_AND_CITIES } = require("../utils/locationData");

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_AVATAR = "";
const SAFE_RESET_MESSAGE = "If an account exists for that email, a password reset OTP has been sent.";

const normalizeEmail = (email) =>
typeof email === "string" ? email.trim().toLowerCase() : "";

const normalizeText = (value) =>
typeof value === "string" ? value.trim() : "";

const isValidEmail = (email) => EMAIL_REGEX.test(email);

const createUsernameFromName = (name) => {
  const base = normalizeText(name).replace(/[^a-z0-9]/gi, "").toLowerCase() || "traveler";
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${base}${randomNumber}`;
};

const serializeUser = (user) => {
  const data = user?.toObject ? user.toObject() : { ...(user || {}) };
  delete data.password;
  delete data.resetPasswordToken;
  delete data.resetPasswordExpire;
  return data;
};

const buildTokenPayload = (user) => ({
  id: user._id,
  isAdmin: Boolean(user.isAdmin)
});

const signAuthToken = (user) =>
jwt.sign(buildTokenPayload(user), getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN });

const getTokenExpiresAt = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? decoded.exp * 1000 : Date.now() + TOKEN_TTL_MS;
};

const getRequestToken = (req) =>
req.cookies?.access_token || req.headers.authorization?.split(" ")[1] || null;

const handleDuplicateUserError = (error, res) => {
  if (error?.code !== 11000) return false;

  const duplicatedField = Object.keys(error.keyPattern || error.keyValue || {})[0];
  const message = duplicatedField === "username" ?
  "Username already taken" :
  "Email already registered";

  res.status(409).json({
    success: false,
    message
  });
  return true;
};

const handleValidationError = (error, res) => {
  if (error?.name !== "ValidationError") return false;

  const firstError = Object.values(error.errors || {})[0];
  res.status(400).json({
    success: false,
    message: firstError?.message || "Invalid user details"
  });
  return true;
};

const registerUser = async (req, res, next) => {
  try {
    const {
      email: rawEmail,
      password,
      name,
      img,
      username,
      acceptedPolicies,
      city,
      state,
      mobile,
      govId,
      govIdType
    } = req.body;

    const email = normalizeEmail(rawEmail);
    const trimmedName = normalizeText(name);

    if (!acceptedPolicies) {
      return res.status(400).json({
        success: false,
        message: "Please accept Privacy Policy and Terms of Service"
      });
    }

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: "State is required"
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required"
      });
    }

    const trimmedState = state.trim();
    const trimmedCity = city.trim();

    const validCities = INDIAN_STATES_AND_CITIES[trimmedState];
    if (!validCities) {
      return res.status(400).json({
        success: false,
        message: `Invalid state selected: ${trimmedState}`
      });
    }

    if (!validCities.includes(trimmedCity)) {
      return res.status(400).json({
        success: false,
        message: `City ${trimmedCity} does not belong to ${trimmedState}`
      });
    }

    const existingUser = await User.findOne({ email }).select("_id");
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    let finalUsername = username?.trim().toLowerCase();
    if (!finalUsername) {
      finalUsername = createUsernameFromName(trimmedName);
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(finalUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username can contain only letters, numbers, dots, underscores, and hyphens"
      });
    }

    const usernameExists = await User.findOne({ username: finalUsername }).select("_id");
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already taken"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: trimmedName,
      fullname: trimmedName,
      email,
      username: finalUsername,
      password: hashedPassword,
      mobile: normalizeText(mobile),
      govId: normalizeText(govId),
      govIdType: normalizeText(govIdType),
      img: img || DEFAULT_AVATAR,
      avatar: img || DEFAULT_AVATAR,
      profilePic: img || "",
      pic: img || DEFAULT_AVATAR,
      city: trimmedCity,
      state: trimmedState,
      followers: [],
      following: [],
      policiesAcceptedAt: new Date(),
      isAdmin: false,
      isVerified: false,
      verificationStatus: "unverified"
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully"
    });
  } catch (error) {
    if (handleDuplicateUserError(error, res)) return;
    if (handleValidationError(error, res)) return;
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.isDeleted || user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "This account is not available. Please contact support."
      });
    }

    if (user.isDeactivated) {
      user.isDeactivated = false;
      await user.save();
    }

    const token = signAuthToken(user);
    const tokenExpiresAt = getTokenExpiresAt(token);

    await Session.create({
      user: user._id,
      token,
      browser: req.headers["user-agent"],
      ipAddress: req.ip
    });

    const { getValidTripMates } = require("./tripMateController");
    const validTripMates = await getValidTripMates(user._id);
    const tripMatesCount = validTripMates.length;

    const userData = serializeUser(user);
    userData.tripMatesCount = tripMatesCount;

    res.
    cookie("access_token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }).
    status(200).
    json({
      success: true,
      details: userData,
      isAdmin: user.isAdmin,
      token,
      tokenExpiresAt
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const token = getRequestToken(req);

    if (token) {
      const session = await Session.findOne({ token });
      if (session) {
        const userIdStr = session.user.toString();
        const io = req.app.get("io");
        if (io && io.sockets && io.sockets.sockets) {
          for (const socket of io.sockets.sockets.values()) {
            if (socket.userId === userIdStr) {
              socket.disconnect(true);
            }
          }
        }
      }
      await Session.deleteOne({ token });
    }

    res.clearCookie("access_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

const resetpasswordrequest = async (req, res) => {
  const email = normalizeEmail(req.body.email);

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    const user = await User.findOne({ email });
    if (!user || user.isDeleted || user.isSuspended) {
      return res.status(200).json({
        success: true,
        message: SAFE_RESET_MESSAGE
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordToken = crypto.
    createHash("sha256").
    update(otp).
    digest("hex");
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await User.updateOne(
    { _id: user._id },
    { $set: { resetPasswordToken, resetPasswordExpire } }
    );

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password`;
    const message =
    "You are receiving this email because a password reset was requested.\n\n" +
    `Your OTP for password reset is: ${otp}\n\n` +
    `Please enter this OTP on the password reset page: ${resetUrl}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password reset OTP",
        text: message
      });

      return res.status(200).json({
        success: true,
        message: SAFE_RESET_MESSAGE
      });
    } catch (error) {
      console.error(error);
      await User.updateOne(
      { _id: user._id },
      { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } }
      );

      return res.status(500).json({
        success: false,
        message: "Email could not be sent"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const resetpassword = async (req, res) => {
  try {
    const submittedToken = normalizeText(req.params.token);
    if (!submittedToken) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required"
      });
    }

    const resetPasswordToken = crypto.
    createHash("sha256").
    update(submittedToken).
    digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    if (!req.body.password || req.body.password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const checkEmailExists = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) return res.status(400).json({ success: false, message: "Email parameter is required" });

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email }).select("_id");
    if (user) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    res.status(200).json({
      success: true,
      message: "Email is available"
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must differ from current password"
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  const token = getRequestToken(req);

  res.status(200).json({
    success: true,
    details: serializeUser(req.user),
    isAdmin: Boolean(req.user?.isAdmin),
    token,
    tokenExpiresAt: token ? getTokenExpiresAt(token) : null
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  resetpasswordrequest,
  resetpassword,
  checkEmailExists,
  changePassword,
  getCurrentUser
};
