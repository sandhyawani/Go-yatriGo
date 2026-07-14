const express = require("express");

const {
  getStats,
  getAllReports,
  resolveReport,
  deleteReportedPost,
  deleteReportedGroup,
  suspendUser,
  unsuspendUser,
  warnUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} = require("../controllers/adminController");

const { verifyAdmin } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/stats", verifyAdmin, getStats);

router.get("/reports", verifyAdmin, getAllReports);
router.put("/reports/:id/resolve", verifyAdmin, resolveReport);
router.delete("/posts/:postId", verifyAdmin, deleteReportedPost);
router.delete("/groups/:groupId", verifyAdmin, deleteReportedGroup);

router.put("/users/:id/suspend", verifyAdmin, suspendUser);
router.put("/user/:id/suspend", verifyAdmin, suspendUser);

router.put("/users/:id/unsuspend", verifyAdmin, unsuspendUser);
router.put("/user/:id/unsuspend", verifyAdmin, unsuspendUser);

router.post("/users/:id/warn", verifyAdmin, warnUser);
router.post("/user/:id/warn", verifyAdmin, warnUser);

router.get("/verifications", verifyAdmin, getPendingVerifications);

router.put("/users/:id/verify/approve", verifyAdmin, approveVerification);
router.put("/user/:id/verify/approve", verifyAdmin, approveVerification);

router.put("/users/:id/verify/reject", verifyAdmin, rejectVerification);
router.put("/user/:id/verify/reject", verifyAdmin, rejectVerification);

module.exports = router;