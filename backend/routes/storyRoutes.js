const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Story = require("../models/Story");
const { protect } = require("../middleware/verifyToken");

router.get("/feed", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const userIdsToFetch = [...(req.user.following || []), currentUserId];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.aggregate([
      {
        $match: {
          userId: { $in: userIdsToFetch },
          createdAt: { $gte: oneDayAgo },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$userId",
          stories: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          userName: "$author.name",
          userPic: { $ifNull: ["$author.pic", "$author.avatar"] },
          isVerified: { $ifNull: ["$author.isVerified", false] },
          stories: 1,
        },
      },
    ]);

    const myGroupIndex = stories.findIndex((g) => g.userId.toString() === currentUserId.toString());
    if (myGroupIndex > 0) {
      const [myGroup] = stories.splice(myGroupIndex, 1);
      stories.unshift(myGroup);
    }

    res.status(200).json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching stories" });
  }
});

router.post("/:id/view", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    const hasViewer = story.viewers.some((v) => v.userId && v.userId.toString() === userId.toString());
    if (!hasViewer) {
      story.viewers.push({ userId, viewedAt: new Date() });
      if (story.views && !story.views.includes(userId)) story.views.push(userId);
      await story.save();
    }

    res.status(200).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating views" });
  }
});

router.post("/:id/like", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    if (!story.reactions) story.reactions = [];
    const likeIndex = story.reactions.findIndex((id) => id.toString() === userId.toString());

    if (likeIndex === -1) {
      story.reactions.push(userId);
    } else {
      story.reactions.splice(likeIndex, 1);
    }

    await story.save();
    res.status(200).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating likes" });
  }
});

router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    story.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      userPic: req.user.pic || req.user.avatar,
      text: text,
      createdAt: new Date(),
    });

    await story.save();
    res.status(200).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error adding comment" });
  }
});

module.exports = router;