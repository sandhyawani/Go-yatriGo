const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  senderName: {
    type: String,
    required: true,
    trim: true
  },

  senderPic: {
    type: String,
    default: ""
  },

  text: {
    type: String,
    trim: true,
    default: ""
  },

  content: {
    type: String,
    trim: true,
    default: ""
  },

  media: {
    type: String,
    default: ""
  },

  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
    default: null
  },

  unreadBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  seenBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  deliveredTo: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  deliveredAt: {
    type: Date,
    default: null
  },

  seenAt: {
    type: Date,
    default: null
  },

  reactions: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    emoji: {
      type: String,
      required: true,
      trim: true
    }
  }],


  deletedFor: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],


  isUnsent: {
    type: Boolean,
    default: false
  },

  unsentAt: {
    type: Date,
    default: null
  },

  replyTo: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    senderName: {
      type: String,
      default: ""
    },
    text: {
      type: String,
      default: ""
    }
  }
},
{
  timestamps: true
}
);

messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ storyId: 1 });

module.exports = mongoose.model("Message", messageSchema);