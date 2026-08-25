const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");

const journeyController = require("../controllers/journeyController");
const journeyMembershipController = require("../controllers/journeyMembershipController");
const journeyHostController = require("../controllers/journeyHostController");
const journeyCancellationController = require("../controllers/journeyCancellationController");
const journeyLifecycleController = require("../controllers/journeyLifecycleController");

router.use(protect);

router.route("/auto-cover-preview").
get(journeyController.getAutoCoverPreview);

router.route("/").
post(journeyController.createJourney);

router.route("/my").
get(journeyController.getMyJourneys);

router.route("/invitations/my").
get(journeyMembershipController.getMyInvitations);

router.route("/previous-companions").
get(journeyController.getPreviousCompanions);

router.route("/stats/me").
get(journeyController.getUserStatistics);

router.route("/stats/user/:id").
get(journeyController.getUserStatistics);

router.route("/:id").
get(journeyController.getJourneyById).
put(journeyController.updateJourney).
delete(journeyController.deleteJourney);

router.route("/:id/cancel").
post(journeyCancellationController.cancelJourney);

router.route("/:id/transfer-host").
post(journeyHostController.transferHost);

router.route("/:id/sync-status").
post(journeyLifecycleController.syncJourneyStatusHandler);

router.route("/:id/invite").
post(journeyMembershipController.inviteMembers);

router.route("/:id/leave").
post(journeyMembershipController.leaveJourney);

router.route("/:id/members/:userId").
delete(journeyMembershipController.removeMember);

router.route("/:id/members/:userId/warn").
post(journeyMembershipController.warnMember);

router.route("/:id/warn/:userId").
post(journeyMembershipController.warnMember);

router.route("/:id/members/:userId/role").
put(journeyMembershipController.updateMemberRole);

router.route("/:id/co-leader/:targetUserId").
post(journeyMembershipController.assignCoLeader).
delete(journeyMembershipController.removeCoLeader);

router.route("/:id/workspace").
get(journeyController.getWorkspaceItems).
post(journeyController.addWorkspaceItem);

router.route("/:id/workspace/:itemId").
put(journeyController.updateWorkspaceItem).
delete(journeyController.deleteWorkspaceItem);

router.route("/:id/timeline").
get(journeyController.getTimeline);

router.route("/:id/checkin").
post(journeyController.safeCheckIn);

router.route("/:id/gallery").
get(journeyController.getGallery).
post(journeyController.addGalleryItem);

router.route("/:id/memories").
get(journeyController.getMemories);

router.route("/:id/memories/comment").
post(journeyController.addMemoryComment);

router.route("/:id/memories/react").
post(journeyController.reactToMemory);

router.route("/:id/invitations").
get(journeyMembershipController.getJourneyInvitations);

router.route("/invitations/:id/accept").
post(journeyMembershipController.acceptInvitation);

router.route("/invitations/:id/reject").
post(journeyMembershipController.rejectInvitation);

router.route("/invitations/:id/resend").
post(journeyMembershipController.resendInvitation);

router.route("/invitations/:id/cancel").
delete(journeyMembershipController.cancelInvitation);

router.route("/:id/join-requests").
get(journeyMembershipController.getJourneyJoinRequests).
post(journeyMembershipController.requestToJoinJourney);

router.route("/:id/my-join-request").
get(journeyMembershipController.getMyJoinRequest);

router.route("/join-requests/:requestId").
delete(journeyMembershipController.cancelJourneyJoinRequest);

router.route("/join-requests/:requestId/accept").
post(journeyMembershipController.acceptJourneyJoinRequest);

router.route("/join-requests/:requestId/reject").
post(journeyMembershipController.rejectJourneyJoinRequest);

module.exports = router;