const express = require("express");
const router = express.Router();

const {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  rateUser,
  blockUser,
  unblockUser,
  reportUser,
  reportItem,
  getTravelerSuggestions,
  getBlockedUsers,
  searchUsers,
  getProfileStats,
  getPrivacySettings,
  updatePrivacySettings
} = require("../controllers/userController");

const { registerUser, loginUser: authUser } = require("../controllers/authController");
const { verifyToken, verifyUser, verifyAdmin, protect, optionalVerifyToken } = require("../middleware/verifyToken");

router.get("/profile-stats", verifyToken, getProfileStats);
router.get("/privacy-settings", verifyToken, getPrivacySettings);
router.patch("/privacy-settings", verifyToken, updatePrivacySettings);
router.get("/explore/suggestions", verifyToken, getTravelerSuggestions);
router.get("/suggestions", verifyToken, getTravelerSuggestions);
router.get("/search", verifyToken, searchUsers);
router.get("/blocked", verifyToken, getBlockedUsers);

router.put("/follow/:id", verifyToken, followUser);
router.put("/unfollow/:id", verifyToken, unfollowUser);

router.post("/:id/follow", verifyToken, followUser);
router.post("/:id/unfollow", verifyToken, unfollowUser);
router.post("/:id/follow-request/accept", verifyToken, acceptFollowRequest);
router.post("/:id/follow-request/reject", verifyToken, rejectFollowRequest);
router.get("/:id/followers", verifyToken, getFollowers);
router.get("/:id/following", verifyToken, getFollowing);

router.post("/rate/:id", verifyToken, rateUser);
router.post("/block/:id", verifyToken, blockUser);
router.post("/unblock/:id", verifyToken, unblockUser);
router.post("/report/:id", verifyToken, reportUser);
router.post("/report-item", verifyToken, reportItem);

router.get("/checkauthentication", verifyToken, (req, res) => {
  res.status(200).json({ message: "Authenticated" });
});

router.get("/checkuser/:id", verifyUser, (req, res) => {
  res.status(200).json({ message: "Hello user,You are logged in you can do this" });
});

router.get("/checkadmin/:id", verifyAdmin, (req, res) => {
  res.status(200).json({ message: "Hello admin,You are logged in you can do this" });
});

router.put("/:id", verifyUser, updateUser);
router.delete("/:id", verifyUser, deleteUser);
router.get("/:id", optionalVerifyToken, getUser);

router.route("/")
  .post(registerUser)
  .get(protect, getAllUsers); // Fixed to use getAllUsers instead of allUsers

router.get("/admin/all", verifyAdmin, getAllUsers);
router.post("/login", authUser);

module.exports = router;