const express = require("express");
const {
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  allUsers,
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
const {
  registerUser,
  loginUser: authUser,
} = require("../controllers/authController");
const {
  verifyToken,
  verifyUser,
  verifyAdmin,
  protect,
} = require("../middleware/verifyToken");

const router = express.Router();

router.get("/profile-stats", verifyToken, getProfileStats);
router.get("/privacy-settings", verifyToken, getPrivacySettings);
router.patch("/privacy-settings", verifyToken, updatePrivacySettings);

router.get("/explore/suggestions", verifyToken, getTravelerSuggestions);
router.put("/follow/:id", verifyToken, followUser);
router.put("/unfollow/:id", verifyToken, unfollowUser);

// New Instagram-style endpoints
router.post("/:id/follow", verifyToken, followUser);
router.post("/:id/unfollow", verifyToken, unfollowUser);
router.post("/:id/follow-request/accept", verifyToken, acceptFollowRequest);
router.post("/:id/follow-request/reject", verifyToken, rejectFollowRequest);
router.get("/:id/followers", verifyToken, getFollowers);
router.get("/:id/following", verifyToken, getFollowing);
router.get("/suggestions", verifyToken, getTravelerSuggestions);
router.get("/search", verifyToken, searchUsers);
router.get("/blocked", verifyToken, getBlockedUsers);
router.post("/rate/:id", verifyToken, rateUser);
router.post("/block/:id", verifyToken, blockUser);
router.post("/unblock/:id", verifyToken, unblockUser);
router.post("/report/:id", verifyToken, reportUser);
router.post("/report-item", verifyToken, reportItem);

router.get("/checkauthentication", verifyToken, (req, res, next) => {
  res.status(200).json({ message: "Authenticated" });
});

router.get("/checkuser/:id", verifyUser, (req, res, next) => {
  res
    .status(200)
    .json({ message: "Hello user,You are logged in you can do this" });
});

router.get("/checkadmin/:id", verifyAdmin, (req, res, next) => {
  res
    .status(200)
    .json({ message: "Hello admin,You are logged in you can do this" });
});

//update
router.put("/:id", verifyUser, updateUser);
//delete
router.delete("/:id", verifyUser, deleteUser);
//get
router.get("/:id", verifyToken, getUser);
//get all
router.get("/", verifyAdmin, getAllUsers);

router.route("/").post(registerUser);

//search api
router.route("/").get(protect, allUsers);

router.route("/login").post(authUser);

module.exports = router;
