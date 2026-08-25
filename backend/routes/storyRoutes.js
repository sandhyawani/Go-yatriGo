const express = require("express");
const router = express.Router();
const { verifyToken, checkSuspended } = require("../middleware/verifyToken");
const { uploadCloud } = require("../utils/cloudinary");
const {
  createStory,
  getActiveStories,
  getStoryById,
  viewStory,
  reactToStory,
  replyToStory,
  updateStory,
  deleteStory
} = require("../controllers/storyController");

router.get("/feed", verifyToken, getActiveStories);
router.get("/", verifyToken, getActiveStories);
router.post("/", verifyToken, checkSuspended, uploadCloud.fields([{ name: "media", maxCount: 1 }, { name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]), createStory);
router.get("/:id", verifyToken, getStoryById);
router.post("/:id/view", verifyToken, viewStory);
router.post("/:id/like", verifyToken, reactToStory);
router.post("/:id/react", verifyToken, reactToStory);
router.post("/reply/:storyUserId", verifyToken, checkSuspended, replyToStory);
router.put("/:id", verifyToken, updateStory);
router.delete("/:id", verifyToken, deleteStory);

module.exports = router;