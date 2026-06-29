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

// ======================================================
// Dashboard
// ======================================================

// Get admin dashboard statistics
router.get("/stats", verifyAdmin, getStats);

// ======================================================
// Reports Management
// ======================================================

// Get all reported content
router.get("/reports", verifyAdmin, getAllReports);

// Resolve a report
router.put("/report/:id/resolve", verifyAdmin, resolveReport);

// Delete a reported post
router.delete("/post/:postId", verifyAdmin, deleteReportedPost);

// Delete a reported travel group
router.delete("/group/:groupId", verifyAdmin, deleteReportedGroup);

// ======================================================
// User Management
// ======================================================

// Suspend a user account
router.put("/user/:id/suspend", verifyAdmin, suspendUser);

// Remove user suspension
router.put("/user/:id/unsuspend", verifyAdmin, unsuspendUser);

// Send a warning to a user
router.post("/user/:id/warn", verifyAdmin, warnUser);

// ======================================================
// Verification Management
// ======================================================

// Get all pending verification requests
router.get("/verifications", verifyAdmin, getPendingVerifications);

// Approve user verification
router.put(
  "/user/:id/verify/approve",
  verifyAdmin,
  approveVerification
);

// Reject user verification
router.put(
  "/user/:id/verify/reject",
  verifyAdmin,
  rejectVerification
);

module.exports = router;