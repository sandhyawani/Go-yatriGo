const express = require("express");
const {
  getStats,
  getAllReports,
  resolveReport,
  deleteReportedPost,
  deleteReportedGroup,
  suspendUser,
  unsuspendUser,
  warnUser
} = require("../controllers/adminController");
const { verifyAdmin } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/stats", verifyAdmin, getStats);
router.get("/reports", verifyAdmin, getAllReports);
router.put("/report/:id/resolve", verifyAdmin, resolveReport);
router.delete("/post/:postId", verifyAdmin, deleteReportedPost);
router.delete("/group/:groupId", verifyAdmin, deleteReportedGroup);
router.put("/user/:id/suspend", verifyAdmin, suspendUser);
router.put("/user/:id/unsuspend", verifyAdmin, unsuspendUser);
router.post("/user/:id/warn", verifyAdmin, warnUser);

module.exports = router;
