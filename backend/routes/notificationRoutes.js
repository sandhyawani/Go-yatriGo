const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  getNotifications,
  getSentRequests,
  cancelSentRequest,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/sent", verifyToken, getSentRequests);
router.get("/sent-requests", verifyToken, getSentRequests);
router.delete("/sent/:id", verifyToken, cancelSentRequest);
router.post("/sent/cancel", verifyToken, cancelSentRequest);
router.get("/", verifyToken, getNotifications);
router.put("/read-all", verifyToken, markAllAsRead);
router.delete("/clear-all", verifyToken, clearAllNotifications);
router.put("/:id/read", verifyToken, markAsRead);
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;