const mongoose = require("mongoose");

// Schema for collaborative travel workspace (strictly non-financial/non-booking)
const journeyWorkspaceSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: {
      type: String,
      default: "",
    },
    creatorPic: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Checklist",
        "Meeting Point",
        "Travel Tips",
        "Emergency Information",
        "Emergency Info",
        "Packing List",
        "Checklists / Packing",
        "Important Notes",
        "General Notes",
        "Squad Notes",
      ],
      default: "Squad Notes",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    
    items: [
      {
        text: { type: String, trim: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

journeyWorkspaceSchema.index({ journeyId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model("JourneyWorkspace", journeyWorkspaceSchema);
