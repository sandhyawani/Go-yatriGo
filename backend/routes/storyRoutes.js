const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const User = require("../models/User");
const { userMiddleware } = require("../middleware/authMiddleware");
const { checkSuspended } = require("../middleware/verifyToken");

// GET /api/stories/feed
// Returns active stories from current user and followed users within the last 24 hours, grouped by user.
router.get("/feed", userMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const userIdsToFetch = [...(currentUser.following || []), currentUser._id];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const flatStories = await Story.find({
      userId: { $in: userIdsToFetch },
      createdAt: { $gte: oneDayAgo }
    })
      .sort({ createdAt: 1 }) // sort ascending so oldest story is first in the group array, or descending depending on UI.
      .populate("userId", "name username pic avatar isVerified");

    // Group stories by user
    const groupedMap = new Map();

    for (const story of flatStories) {
      if (!story.userId) continue;
      const uId = story.userId._id.toString();
      if (!groupedMap.has(uId)) {
        groupedMap.set(uId, {
          userId: uId,
          userName: story.userId.name,
          userPic: story.userId.pic || story.userId.avatar,
          isVerified: story.userId.isVerified || false,
          stories: []
        });
      }
      groupedMap.get(uId).stories.push(story);
    }

    const stories = Array.from(groupedMap.values());
    
    // Move current user's story group to the front
    const myGroupIndex = stories.findIndex(g => g.userId === currentUser._id.toString());
    if (myGroupIndex > 0) {
      const myGroup = stories.splice(myGroupIndex, 1)[0];
      stories.unshift(myGroup);
    }

    res.status(200).json({ success: true, stories });
  } catch (error) {
    console.error("Story feed error:", error);
    res.status(500).json({ success: false, message: "Server error fetching stories" });
  }
});

// POST /api/stories/:id/view
router.post("/:id/view", userMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    if (!story.views.includes(req.user)) {
      story.views.push(req.user);
      await story.save();
    }
    res.status(200).json({ success: true, story });
  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({ success: false, message: "Server error updating views" });
  }
});

// POST /api/stories/:id/like
router.post("/:id/like", userMiddleware, checkSuspended, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    const likeIndex = story.likes.indexOf(req.user);
    if (likeIndex === -1) {
      story.likes.push(req.user);
    } else {
      story.likes.splice(likeIndex, 1);
    }
    await story.save();
    res.status(200).json({ success: true, story });
  } catch (error) {
    console.error("Like story error:", error);
    res.status(500).json({ success: false, message: "Server error updating likes" });
  }
});

// POST /api/stories/:id/comment
router.post("/:id/comment", userMiddleware, checkSuspended, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    const currentUser = await User.findById(req.user);
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    story.comments.push({
      userId: currentUser._id,
      userName: currentUser.name,
      userPic: currentUser.pic || currentUser.avatar,
      text: text,
      createdAt: new Date()
    });

    await story.save();
    res.status(200).json({ success: true, story });
  } catch (error) {
    console.error("Comment story error:", error);
    res.status(500).json({ success: false, message: "Server error adding comment" });
  }
});

module.exports = router;
