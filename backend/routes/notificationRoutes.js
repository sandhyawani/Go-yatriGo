const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.put("/read-all", verifyToken, markAllAsRead);
router.delete("/clear-all", verifyToken, clearAllNotifications);
router.put("/:id/read", verifyToken, markAsRead);
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;