const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

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
    "Other"]

  },

  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },

  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open",
    index: true
  },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },

  attachments: [
  {
    type: String,
    trim: true
  }],


  trackingId: {
    type: String,
    unique: true,
    index: true
  },

  replies: [
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }]

},
{
  timestamps: true
}
);

supportTicketSchema.pre("save", function (next) {
  if (!this.trackingId) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingId = `TKT-${Date.now()}-${random}`;
  }

  next();
});

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);