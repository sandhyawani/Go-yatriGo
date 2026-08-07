const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
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

  title: {
    type: String,
    trim: true,
    default: ""
  },

  caption: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },

  location: {
    type: String,
    trim: true,
    default: ""
  },

  tags: [
  {
    type: String,
    trim: true
  }],


  image: {
    type: String,
    default: ""
  },

  mediaUrl: {
    type: String,
    default: ""
  },

  mediaUrls: [
  {
    type: String
  }],


  mediaType: {
    type: String,
    enum: ["image", "video", "carousel"],
    default: "image"
  },

  postType: {
    type: String,
    enum: [
    "travel_memory",
    "travel_photo",
    "travel_video",
    "document",
    "profile_update",
    "general"],

    default: "travel_memory"
  },

  music: {
    title: {
      type: String,
      default: ""
    },
    artist: {
      type: String,
      default: ""
    },
    cover: {
      type: String,
      default: ""
    },
    preview: {
      type: String,
      default: ""
    }
  },

  taggedUsers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journey",
    default: null,
    index: true
  },

  disableComments: {
    type: Boolean,
    default: false
  },

  hideLikes: {
    type: Boolean,
    default: false
  },

  likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  comments: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }]

},
{
  timestamps: true
}
);

postSchema.index({ userId: 1, createdAt: -1 });

postSchema.index({ createdAt: -1 });

postSchema.index({ location: "text", caption: "text", tags: "text" });

module.exports = mongoose.model("Post", postSchema);