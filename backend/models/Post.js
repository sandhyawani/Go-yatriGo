const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userPic: { type: String },
    title: { type: String, default: "" },
    caption: { type: String, required: true },
    location: { type: String, default: "" },
    tags: [{ type: String }],
    image: { type: String }, // Legacy field for existing posts
    mediaUrl: { type: String }, // Legacy single media
    mediaUrls: [{ type: String }], // New field for carousel
    mediaType: { type: String, enum: ["image", "video", "carousel"], default: "image" },
    postType: {
      type: String,
      enum: [
        "travel_memory",
        "travel_photo",
        "travel_video",
        "document",
        "profile_update",
        "general"
      ],
      default: "travel_memory"
    },
    music: {
      title: String,
      artist: String,
      cover: String,
      preview: String
    },
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    disableComments: { type: Boolean, default: false },
    hideLikes: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
  },
  { timestamps: true }
);

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);
