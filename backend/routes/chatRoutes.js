const express = require("express");
const { verifyToken, checkSuspended } = require("../middleware/verifyToken");
const {
  getOrCreateDirectRoom,
  getUserRooms,
  getRoomMessages,
  sendMessage,
  acceptMessageRequest,
  declineMessageRequest,
  blockMessageRequest,
  markMessagesSeen,
  deleteMessageForMe,
  unsendMessage,
  clearChatForMe
} = require("../controllers/chatController");

const router = express.Router();

router.get("/rooms", verifyToken, getUserRooms);
router.post("/room/direct/:targetUserId", verifyToken, checkSuspended, getOrCreateDirectRoom);
router.get("/room/:roomId/messages", verifyToken, getRoomMessages);
router.post("/room/:roomId/message", verifyToken, checkSuspended, sendMessage);

router.put("/room/:roomId/accept", verifyToken, acceptMessageRequest);
router.put("/room/:roomId/decline", verifyToken, declineMessageRequest);
router.put("/room/:roomId/block", verifyToken, blockMessageRequest);

router.put("/room/:roomId/seen", verifyToken, markMessagesSeen);

router.delete("/room/:roomId/messages/:messageId/delete-for-me", verifyToken, deleteMessageForMe);
router.delete("/room/:roomId/messages/:messageId/unsend", verifyToken, unsendMessage);
router.delete("/room/:roomId/clear", verifyToken, clearChatForMe);

module.exports = router;
