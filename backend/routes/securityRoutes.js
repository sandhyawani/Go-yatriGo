const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/verifyToken");
const {
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  toggle2FA,
  getPreferences,
  updatePreferences,
  deleteAccount,
} = require("../controllers/securityController");

router.use(protect); // All security routes are private

router.get("/sessions", getSessions);
router.delete("/sessions/all-others", revokeAllOtherSessions);
router.delete("/sessions/:id", revokeSession);

router.put("/2fa", toggle2FA);

router.route("/preferences")
  .get(getPreferences)
  .put(updatePreferences);

router.delete("/account", deleteAccount);

module.exports = router;
