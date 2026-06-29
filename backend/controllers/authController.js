const User = require("../models/User");
const Session = require("../models/Session");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getJwtSecret } = require("../config/jwt");
const sendEmail = require("../utils/sendEmail");

// Register User
const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, img, username, acceptedPolicies } = req.body;

    if (!acceptedPolicies) {
      return res.status(400).json({
        message: "Please accept Privacy Policy and Terms of Service",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    let finalUsername = username?.trim().toLowerCase();

    if (!finalUsername && name) {
      const randomNumber = Math.floor(Math.random() * 10000);
      finalUsername = `${name.replace(/\s+/g, "").toLowerCase()}${randomNumber}`;
    }

    const usernameExists = await User.findOne({
      username: finalUsername,
    });

    if (usernameExists) {
      return res.status(409).json({
        message: "Username already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      ...req.body,
      username: finalUsername,
      password: hashedPassword,
      pic:
        img ||
        "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg",
      followers: [],
      following: [],
      policiesAcceptedAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        message: "Account has been deleted",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.isDeactivated) {
      user.isDeactivated = false;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      getJwtSecret(),
      {
        expiresIn: "30d",
      },
    );

    await Session.create({
      user: user._id,
      token,
      browser: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    const { password: userPassword, ...userData } = user._doc;

    res
      .cookie("access_token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      })
      .status(200)
      .json({
        details: userData,
        isAdmin: user.isAdmin,
        token,
      });
  } catch (error) {
    next(error);
  }
};

// Logout User
const logoutUser = async (req, res) => {
  const token = req.cookies.access_token;

  if (token) {
    await Session.deleteOne({ token });
  }

  res.clearCookie("access_token");

  res.status(200).json({
    message: "Logged out successfully",
  });
};

// Request password reset OTP
const resetpasswordrequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "There is no user with that email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken, resetPasswordExpire } },
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
        text: message,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent to email",
      });
    } catch (error) {
      console.error(error);

      await User.updateOne(
        { _id: user._id },
        { $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 } },
      );

      return res.status(500).json({
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Reset password with OTP
const resetpassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Check Email Availability
const checkEmailExists = async (req, res, next) => {
  try {
    const { email } = req.query;

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    res.status(200).json({
      message: "Email is available",
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect old password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
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
