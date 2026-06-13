require("../config/nodeCompatibility");

const User = require("../models/User");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { createError } = require("../middleware/error");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { getJwtSecret } = require("../config/jwt");
const sendEmail = require("../utils/sendEmail");

const generateToken = (payload) => {
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch (err) {
    throw new Error("Invalid token");
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, img, username, acceptedPolicies } = req.body;

    if (!acceptedPolicies) {
      return res.status(400).json({ message: "You must accept the Privacy Policy and Terms of Service." });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    let finalUsername = username?.trim().toLowerCase();
    if (!finalUsername && name) {
      const baseUser = name.replace(/\s+/g, "").toLowerCase();
      const randomSuffix = Math.floor(Math.random() * 10000);
      finalUsername = `${baseUser}${randomSuffix}`;
    }

    // Verify username is unique
    if (finalUsername) {
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        return res.status(409).json({ message: "Username is already taken" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      ...req.body,
      username: finalUsername,
      password: hash,
      pic: img || "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg",
      followers: [],
      following: [],
      policiesAcceptedAt: new Date()
    });

    await newUser.save();

    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    email = email?.trim();
    console.log(`Login attempt for: "${email}" with password length: ${password?.length}`);
    
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Explicit check for database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database connection is not ready. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({ 
        message: "The database is currently offline.",
        isDbDown: true
      });
    }

    let user;
    try {
      user = await User.findOne({ email }).maxTimeMS(5000); // Set a shorter timeout for the query
    } catch (dbError) {
      console.error("Database Connection Error during login:", dbError.message);
      return res.status(503).json({ 
        message: "Database connection failed.",
        isDbDown: true
      });
    }

    if (!user) {
      console.log(`User not found for email: "${email}"`);
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: "This account has been deleted" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //create the token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, type: user.type },
      getJwtSecret(),
      { expiresIn: "30d" }
    );

    const session = new Session({
      user: user._id,
      token,
      browser: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown',
      deviceType: /mobile/i.test(req.headers['user-agent']) ? 'Mobile' : 'Desktop'
    });
    await session.save();

    const { password: userPassword, ...otherDetails } = user._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin: user.isAdmin, token });
  } catch (error) {
    console.error("Login Error:", error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/logout
// @access  Private
const logoutUser = async (req, res) => {
  const token = req.cookies.access_token;
  if (token) {
    try {
      await Session.deleteOne({ token });
    } catch(err) {
      console.error(err);
    }
  }
  res.clearCookie("access_token", { path: "/" });
  res.status(200).send("Logged out successfully");
};

//rest password request
const resetpasswordrequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "There is no user with that email" });
    }

    // Generate random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Set expire (Exactly 15 minutes)
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken, resetPasswordExpire } }
    );

    // Create reset url
    const resetUrl = `http://localhost:3000/reset-password`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password.\n\nYour OTP for password reset is: ${otp}\n\nPlease enter this OTP on the password reset page: ${resetUrl}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password reset OTP",
        text: message,
      });

      res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      console.error(err);
      await User.updateOne(
        { _id: user._id },
        { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } }
      );

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//rest password
const resetpassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);

    // Clear reset token fields and set new password
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { password: hash },
        $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 }
      }
    );

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkEmailExists = async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(200).json({ message: "Email is available" });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    user.password = hash;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  resetpasswordrequest,
  resetpassword,
  checkEmailExists,
  changePassword,
};
