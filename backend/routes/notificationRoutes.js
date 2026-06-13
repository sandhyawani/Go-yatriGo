const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.put("/read-all", verifyToken, markAllAsRead);
router.put("/:id/read", verifyToken, markAsRead);

module.exports = router;
