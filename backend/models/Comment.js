const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userPic: { type: String },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
