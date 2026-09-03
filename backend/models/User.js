const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    default: function () {
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
    lowercase: true,
    trim: true
  },
  country: {
    type: String,
    default: "India"
  },
  city: {
    type: String,
    trim: true,
    default: ""
  },
  state: {
    type: String,
    trim: true,
    default: ""
  },
  img: {
    type: String
  },
  govId: {
    type: String,
    default: ""
  },
  govIdType: {
    type: String,
    enum: ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', ''],
    default: ''
  },
  mobile: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: "Traveler"
  },
  type: {
    type: String,
    required: true,
    default: "traveler"
  },
  avatar: {
    type: String,
    default: ""
  },
  pic: {
    type: String,
    required: false,
    default: ""
  },
  profilePic: {
    type: String,
    default: ""
  },
  profilePicture: {
    type: String,
    default: ""
  },
  coverImage: {
    type: String,
    default: ""
  },
  coverPic: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: "Hey there! I’m using YatriGo. What about you?"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationNote: {
    type: String,
    default: ""
  },
  completedTrips: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  hostResponseRate: {
    type: Number,
    default: 100
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  interests: {
    type: [String],
    default: ["Weekendss", "Backpacking", "Photography"]
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
    showOnlineStatus: { type: Boolean, default: true },
    connectionRequests: { type: String, enum: ["everyone", "mates_only"], default: "everyone" },
    journeyInvites: { type: String, enum: ["everyone", "mates_only", "none"], default: "everyone" },
    whoCanMessage: { type: String, enum: ["everyone", "mates_only", "none"], default: "everyone" },
    profileLocationVisibility: { type: String, enum: ["everyone", "mates_only", "none"], default: "mates_only" }
  },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reportedBy: [
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  emergencyContacts: [
  {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false }
  }],

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  verifiedEmail: {
    type: Boolean,
    default: false
  },
  verifiedPhone: {
    type: Boolean,
    default: false
  },
  sosActive: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isDeactivated: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  policiesAcceptedAt: {
    type: Date,
    default: null
  }
},
{ timestamps: true }
);

UserSchema.index({ privateAccount: 1 });
UserSchema.index({ city: 1 });
UserSchema.index({ state: 1 });
UserSchema.index({ city: 1, state: 1 });
UserSchema.index({ blockedUsers: 1 });

const stripSensitiveFields = (_doc, ret) => {
  delete ret.password;
  delete ret.resetPasswordToken;
  delete ret.resetPasswordExpire;
  return ret;
};

UserSchema.set("toJSON", {
  transform: stripSensitiveFields
});

UserSchema.set("toObject", {
  transform: stripSensitiveFields
});

module.exports = mongoose.model("User", UserSchema);
