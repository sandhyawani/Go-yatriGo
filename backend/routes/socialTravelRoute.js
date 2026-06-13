const express = require("express");
const { verifyToken, checkSuspended } = require("../middleware/verifyToken");
const { uploadCloud } = require("../utils/cloudinary");
const {
  createTravelBuddyTrip,
  getExploreMetadata,
  getAllTravelBuddyTrips,
  getLikedBuddyTrips,
  getFeltVibesCollection,
  getTravelBuddyTripById,
  toggleLikeBuddyTrip,
  requestToJoinTrip,
  manageJoinRequest,
  leaveTravelBuddyTrip,
  deleteTravelBuddyTrip,
  cancelTravelBuddyTrip,
  createMemory,
  getAllMemories,
  toggleLikeMemory,
  commentOnMemory,
  deleteComment,
  savePost,
  unsavePost,
  getSavedPosts,
  deleteMemory,
  updateMemory,
  getLikedPosts,
  getFeltPostsByUserId,
  createStory,
  getActiveStories,
  getStoryById,
  viewStory,
  deleteStory,
  globalSocialSearch,
  replyToStory,
  updateStory,
  reactToStory,
  getBlockedUsers,
  unblockUser,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getMemoryComments
} = require("../controllers/socialTravelController");

const router = express.Router();

// Global Search
router.get("/search", verifyToken, globalSocialSearch);

// Unified Felt Vibes
router.get("/felt-vibes", verifyToken, getFeltVibesCollection);

// Travel Group routes
router.get("/explore-metadata", verifyToken, getExploreMetadata);
router.post("/buddy", verifyToken, checkSuspended, createTravelBuddyTrip);
router.get("/buddy", verifyToken, getAllTravelBuddyTrips);
router.get("/buddy/liked", verifyToken, getLikedBuddyTrips);
router.get("/buddy/:id", verifyToken, getTravelBuddyTripById);
router.post("/buddy/like/:id", verifyToken, toggleLikeBuddyTrip);
router.post("/buddy/join-request/:id", verifyToken, requestToJoinTrip);
router.post("/buddy/manage-request/:id", verifyToken, manageJoinRequest);
router.post("/buddy/leave/:id", verifyToken, leaveTravelBuddyTrip);
router.delete("/buddy/:id", verifyToken, deleteTravelBuddyTrip);
router.patch("/buddy/:id/cancel", verifyToken, cancelTravelBuddyTrip);

// Travel Post / Photo Feed routes
router.post("/memory", verifyToken, checkSuspended, createMemory);
router.get("/memory", verifyToken, getAllMemories);
router.post("/memory/like/:id", verifyToken, toggleLikeMemory);
router.get("/memory/:id/comments", verifyToken, getMemoryComments);
router.post("/memory/comment/:id", verifyToken, checkSuspended, commentOnMemory);
router.delete("/memory/:postId/comment/:commentId", verifyToken, deleteComment);
router.post("/memory/save/:id", verifyToken, savePost);
router.delete("/memory/save/:id", verifyToken, unsavePost);
router.get("/memory/save", verifyToken, getSavedPosts);
router.get("/memory/liked", verifyToken, getLikedPosts);
router.get("/memory/felt/:userId", verifyToken, getFeltPostsByUserId);
router.put("/memory/:id", verifyToken, updateMemory);
router.delete("/memory/:id", verifyToken, deleteMemory);

// Story routes
router.post("/story", verifyToken, checkSuspended, uploadCloud.single("media"), createStory);
router.get("/story", verifyToken, getActiveStories);
router.get("/story/:id", verifyToken, getStoryById);
router.post("/story/:storyId/view", verifyToken, viewStory);
// Keep existing for compatibility if needed, or replace
router.post("/story/view/:id", verifyToken, viewStory);
router.post("/story/reply/:storyUserId", verifyToken, checkSuspended, replyToStory);
router.post("/story/:id/react", verifyToken, reactToStory);
router.put("/story/:id", verifyToken, updateStory);
router.delete("/story/:id", verifyToken, deleteStory);

// Settings routes
router.get("/blocked-users", verifyToken, getBlockedUsers);
router.post("/unblock/:userId", verifyToken, unblockUser);
router.get("/emergency-contacts", verifyToken, getEmergencyContacts);
router.post("/emergency-contacts", verifyToken, addEmergencyContact);
router.put("/emergency-contacts/:id", verifyToken, updateEmergencyContact);
router.delete("/emergency-contacts/:id", verifyToken, deleteEmergencyContact);
// HOST MEMBER MANAGEMENT
const socialTravelController = require("../controllers/socialTravelController");

// HOST MEMBER MANAGEMENT
router.delete("/buddy-trips/:groupId/member/:memberId", verifyToken, socialTravelController.removeMember);
router.post("/buddy-trips/:groupId/ban/:memberId", verifyToken, socialTravelController.banMember);
router.post("/buddy-trips/:groupId/promote/:memberId", verifyToken, socialTravelController.promoteMember);
router.post("/buddy-trips/:groupId/warn/:memberId", verifyToken, socialTravelController.sendWarning);
router.get("/buddy-trips/:groupId/activity", verifyToken, socialTravelController.getActivityLogs);
module.exports = router;
