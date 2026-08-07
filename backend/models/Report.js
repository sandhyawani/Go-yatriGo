const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
{
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  targetType: {
    type: String,
    enum: ["user", "post", "group", "story", "comment"],
    required: true
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed"],
    default: "pending"
  },

  adminNote: {
    type: String,
    trim: true,
    default: "",
    maxlength: 1000
  }
},
{
  timestamps: true
}
);

reportSchema.index({ reporter: 1 });

reportSchema.index({ reportedUser: 1 });

reportSchema.index({ targetType: 1, targetId: 1 });

reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);