const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");
const journeyController = require("../controllers/journeyController");

// All journey routes require authentication
router.use(protect);

router.route("/")
  .post(journeyController.createJourney);

router.route("/my")
  .get(journeyController.getMyJourneys);

router.route("/invitations/my")
  .get(journeyController.getMyInvitations);

router.route("/previous-companions")
  .get(journeyController.getPreviousCompanions);

router.route("/stats/me")
  .get(journeyController.getUserStatistics);

router.route("/stats/user/:id")
  .get(journeyController.getUserStatistics);

router.route("/:id")
  .get(journeyController.getJourneyById)
  .put(journeyController.updateJourney)
  .delete(journeyController.deleteJourney);

router.route("/:id/cancel")
  .post(journeyController.cancelJourney);

router.route("/:id/invite")
  .post(journeyController.inviteMembers);

router.route("/:id/leave")
  .post(journeyController.leaveJourney);

router.route("/:id/members/:memberId")
  .delete(journeyController.removeMember);

router.route("/:id/members/:memberId/role")
  .put(journeyController.updateMemberRole);

router.route("/:id/workspace")
  .get(journeyController.getWorkspaceItems)
  .post(journeyController.addWorkspaceItem);

router.route("/:id/workspace/:itemId")
  .put(journeyController.updateWorkspaceItem)
  .delete(journeyController.deleteWorkspaceItem);

router.route("/:id/timeline")
  .get(journeyController.getTimeline);

router.route("/:id/checkin")
  .post(journeyController.safeCheckIn);

router.route("/:id/gallery")
  .get(journeyController.getGallery)
  .post(journeyController.addGalleryItem);

router.route("/:id/memories")
  .get(journeyController.getMemories);

router.route("/:id/memories/comment")
  .post(journeyController.addMemoryComment);

router.route("/:id/memories/react")
  .post(journeyController.reactToMemory);

router.route("/:id/invitations")
  .get(journeyController.getJourneyInvitations);

router.route("/invitations/:id/accept")
  .post(journeyController.acceptInvitation);

router.route("/invitations/:id/reject")
  .post(journeyController.rejectInvitation);

router.route("/invitations/:id/resend")
  .post(journeyController.resendInvitation);

router.route("/invitations/:id/cancel")
  .delete(journeyController.cancelInvitation);

module.exports = router;