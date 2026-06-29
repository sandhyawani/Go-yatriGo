const express = require("express");
const router = express.Router();
const journeyController = require("../controllers/journeyController");
const { userMiddleware } = require("../middleware/authMiddleware");

// Journey Core CRUD
router.post("/", userMiddleware, journeyController.createJourney);
router.get("/my", userMiddleware, journeyController.getMyJourneys);
router.get(
  "/invitations/my",
  userMiddleware,
  journeyController.getMyInvitations,
);
router.get(
  "/previous-companions",
  userMiddleware,
  journeyController.getPreviousCompanions,
);
router.get("/:id", userMiddleware, journeyController.getJourneyById);
router.put("/:id", userMiddleware, journeyController.updateJourney);
router.delete("/:id", userMiddleware, journeyController.deleteJourney);

// Lifecycle Status Actions
router.post("/:id/cancel", userMiddleware, journeyController.cancelJourney);

// Member Invitations & Join Requests
router.get(
  "/:id/invitations",
  userMiddleware,
  journeyController.getJourneyInvitations,
);
router.post("/:id/invite", userMiddleware, journeyController.inviteMembers);
router.post(
  "/invitations/:invitationId/accept",
  userMiddleware,
  journeyController.acceptInvitation,
);
router.post(
  "/invitations/:invitationId/reject",
  userMiddleware,
  journeyController.rejectInvitation,
);
router.post(
  "/invitations/:invitationId/resend",
  userMiddleware,
  journeyController.resendInvitation,
);
router.post(
  "/invitations/:invitationId/cancel",
  userMiddleware,
  journeyController.cancelInvitation,
);
router.put(
  "/:id/members/:userId/role",
  userMiddleware,
  journeyController.updateMemberRole,
);
router.post("/:id/leave", userMiddleware, journeyController.leaveJourney);
router.delete(
  "/:id/members/:userId",
  userMiddleware,
  journeyController.removeMember,
);

// Workspace Notes
router.get(
  "/:id/workspace",
  userMiddleware,
  journeyController.getWorkspaceItems,
);
router.post(
  "/:id/workspace",
  userMiddleware,
  journeyController.addWorkspaceItem,
);
router.put(
  "/:id/workspace/:itemId",
  userMiddleware,
  journeyController.updateWorkspaceItem,
);
router.delete(
  "/:id/workspace/:itemId",
  userMiddleware,
  journeyController.deleteWorkspaceItem,
);

// Timeline & Safe Check-in
router.get("/:id/timeline", userMiddleware, journeyController.getTimeline);
router.post("/:id/checkin", userMiddleware, journeyController.safeCheckIn);

// Gallery & Memories
router.get("/:id/gallery", userMiddleware, journeyController.getGallery);
router.post("/:id/gallery", userMiddleware, journeyController.addGalleryItem);
router.get("/:id/memories", userMiddleware, journeyController.getMemories);
router.post(
  "/:id/memories/comment",
  userMiddleware,
  journeyController.addMemoryComment,
);
router.post(
  "/:id/memories/react",
  userMiddleware,
  journeyController.reactToMemory,
);

// Travel Passport Statistics
router.get(
  "/stats/user/:userId",
  userMiddleware,
  journeyController.getUserStatistics,
);
router.get("/stats/me", userMiddleware, (req, res) => {
  req.params.userId = req.user._id;
  return journeyController.getUserStatistics(req, res);
});

module.exports = router;
