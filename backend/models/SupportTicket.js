const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueType: {
      type: String, // e.g., 'Bug', 'Safety', 'Account', 'Other'
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    attachments: [
      {
        type: String, // URLs to images/files
      },
    ],
    trackingId: {
      type: String,
      unique: true,
    },
    replies: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Pre-save to generate a tracking ID if not provided
supportTicketSchema.pre("save", function (next) {
  if (!this.trackingId) {
    this.trackingId = "TKT-" + Math.floor(10000 + Math.random() * 90000);
  }
  next();
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
