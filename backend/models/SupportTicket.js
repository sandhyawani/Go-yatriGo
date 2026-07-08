const mongoose = require("mongoose");

// Schema for customer support tickets
const supportTicketSchema = new mongoose.Schema(
  {
    // User who created the ticket
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Category of the issue
    issueType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Bug",
        "Safety",
        "Account",
        "Payment",
        "Travel",
        "Other",
      ],
    },

    // Ticket subject
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Detailed issue description
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    // Current ticket status
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    // Uploaded screenshots or documents
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],

    // Unique tracking number
    trackingId: {
      type: String,
      unique: true,
      index: true,
    },

    // Conversation between user and support team
    replies: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        message: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate tracking ID
supportTicketSchema.pre("save", function (next) {
  if (!this.trackingId) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingId = `TKT-${Date.now()}-${random}`;
  }

  next();
});

// Database Indexes
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);