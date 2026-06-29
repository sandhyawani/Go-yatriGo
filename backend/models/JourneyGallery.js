const mongoose = require("mongoose");

// Schema for deduplicated gallery items collected across posts, stories, and direct uploads
const journeyGallerySchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploaderName: {
      type: String,
      default: "",
    },
    uploaderPic: {
      type: String,
      default: "",
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    itemType: {
      type: String,
      enum: ["photo", "video", "story", "post"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index to ensure deduplicated queries
journeyGallerySchema.index({ journeyId: 1, createdAt: -1 });
journeyGallerySchema.index({ journeyId: 1, referenceId: 1 });

module.exports = mongoose.model("JourneyGallery", journeyGallerySchema);
