const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const { userMiddleware } = require("../middleware/authMiddleware");
const { checkSuspended } = require("../middleware/verifyToken");

// GET /api/posts/feed
// Returns posts created by users whom the current user is following, sorted by most recent.
router.get("/feed", userMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const followingIds = currentUser.following || [];

    const posts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "name username pic avatar")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name pic avatar username" }
      });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ success: false, message: "Server error fetching feed" });
  }
});

// GET /api/posts/global
// Returns posts created by users who are following the current user (followers), sorted by most recent.
router.get("/global", userMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const followerIds = currentUser.followers || [];

    const posts = await Post.find({ userId: { $in: followerIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "name username pic avatar")
      .limit(50); // Optionally limit to recent 50 posts

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Global feed error:", error);
    res.status(500).json({ success: false, message: "Server error fetching global feed" });
  }
});

// POST /api/posts/like/:id
router.post("/like/:id", userMiddleware, checkSuspended, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user.toString();
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
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

// POST /api/posts/comment/:id
router.post("/comment/:id", userMiddleware, checkSuspended, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

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

    res.status(200).json({ success: true, comment: { ...comment.toObject(), userId: { name: currentUser.name, pic: currentUser.pic || currentUser.avatar } } });
  } catch (error) {
    console.error("Comment post error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
