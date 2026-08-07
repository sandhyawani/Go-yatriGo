const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

const { verifyToken, checkSuspended } = require("../middleware/verifyToken");
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const followingIds = currentUser.following || [];

    const posts = await Post.find({ userId: { $in: followingIds } }).
    sort({ createdAt: -1 }).
    populate("userId", "name username pic avatar").
    populate({
      path: "comments",
      populate: { path: "userId", select: "name pic avatar username" }
    });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ success: false, message: "Server error fetching feed" });
  }
});

router.get("/global", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const followerIds = currentUser.followers || [];

    const posts = await Post.find({ userId: { $in: followerIds } }).
    sort({ createdAt: -1 }).
    populate("userId", "name username pic avatar").
    limit(50);

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Global feed error:", error);
    res.status(500).json({ success: false, message: "Server error fetching global feed" });
  }
});

router.post("/like/:id", verifyToken, checkSuspended, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const { canInteractWithContent } = require("../utils/privacyHelper");
    const isAllowed = await canInteractWithContent(post.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot interact with this post." });
    }

    const userId = req.user._id.toString();
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ success: true, isLiked: !hasLiked });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/comment/:id", verifyToken, checkSuspended, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const { canInteractWithContent } = require("../utils/privacyHelper");
    const isAllowed = await canInteractWithContent(post.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot interact with this post." });
    }

    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const Comment = require("../models/Comment");
    const comment = new Comment({
      postId: post._id,
      userId: currentUser._id,
      userName: currentUser.name,
      userPic: currentUser.pic || currentUser.avatar || "",
      text: text
    });
    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    res.status(200).json({
      success: true,
      comment: {
        ...comment.toObject(),
        userId: { name: currentUser.name, pic: currentUser.pic || currentUser.avatar }
      }
    });
  } catch (error) {
    console.error("Comment post error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;