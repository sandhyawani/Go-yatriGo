const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { 
      type: String, 
      enum: ["user", "post", "group", "story", "comment"], 
      required: true 
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the post, comment, group, story, user
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "resolved", "dismissed", "Pending", "Resolved"], default: "pending" },
    adminNote: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
