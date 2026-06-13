const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      default: function() {
        return this.name;
      }
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    img: {
      type: String,
    },
    mobile: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "Traveler",
    },
    type: {
      type: String,
      required: true,
      default: "traveler"
    },
    avatar: {
      type: String,
      default: "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg",
    },
    pic: {
      type: String,
      required: true,
      default: "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg",
    },
    bio: {
      type: String,
      default: "Hey there! I am using Go Go YatriGo.",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    completedTrips: {
      type: Number,
      default: 3,
    },
    rating: {
      type: Number,
      default: 4.6,
    },
    hostResponseRate: {
      type: Number,
      default: 100, // percentage
    },
    reviewsCount: {
      type: Number,
      default: 5,
    },
    interests: {
      type: [String],
      default: ["Weekendss", "Backpacking", "Photography"],
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    messageRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    privateAccount: { type: Boolean, default: false },
    privacySettings: {
      privateAccount: { type: Boolean, default: false },
      allowStoryReplies: { type: Boolean, default: true },
      allowTravelGroupInvites: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true }
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportedBy: [
      {
        reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    emergencyContacts: [
      {
        name: { type: String, required: true },
        relation: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      }
    ],
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    verifiedEmail: {
      type: Boolean,
      default: false,
    },
    verifiedPhone: {
      type: Boolean,
      default: false,
    },
    sosActive: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    policiesAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

UserSchema.index({ privateAccount: 1 });

module.exports = mongoose.model("User", UserSchema);
