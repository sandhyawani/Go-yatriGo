const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  userName: {
    type: String,
    required: true,
    trim: true
  },

  userPic: {
    type: String,
    default: ""
  },

  media: {
    type: String,
    required: true,
    trim: true
  },

  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: "image"
  },

  caption: {
    type: String,
    default: "",
    trim: true,
    maxlength: 500
  },

  captionPosition: {
    type: String,
    enum: ["top", "center", "bottom"],
    default: "center"
  },

  captionColor: {
    type: String,
    default: "white"
  },

  visibility: {
    type: String,
    enum: ["public", "private", "friends"],
    default: "public"
  },

  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    default: null,
    index: true
  },

  allowedUsers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  hiddenFrom: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  song: {
    songTitle: String,
    artistName: String,
    audioUrl: String,
    startTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    }
  },

  location: {
    type: String,
    default: "",
    trim: true
  },

  stickers: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  views: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  reactions: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  viewers: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],


  viewedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  storyReactions: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    emoji: {
      type: String,
      trim: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],


  comments: [
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    userName: String,
    userPic: String,
    text: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],


  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    expires: 0
  }
},
{
  timestamps: true
}
);

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ visibility: 1 });
storySchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Story", storySchema);