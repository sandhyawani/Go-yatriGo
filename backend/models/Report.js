const mongoose = require("mongoose");

// Schema for reporting users and content
const reportSchema = new mongoose.Schema(
  {
    // User who submitted the report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User being reported
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Type of reported content
    targetType: {
      type: String,
      enum: ["user", "post", "group", "story", "comment"],
      required: true,
    },

    // ID of the reported item
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Reason for reporting
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Report review status
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },

    // Optional note added by an administrator
    adminNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ----------------------
// Database Indexes
// ----------------------

// Reports submitted by a user
reportSchema.index({ reporter: 1 });

// Reports against a user
reportSchema.index({ reportedUser: 1 });

// Find reports for a specific item
reportSchema.index({ targetType: 1, targetId: 1 });

// Filter reports by status
reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);