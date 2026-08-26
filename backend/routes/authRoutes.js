const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  resetpasswordrequest,
  resetpassword,
  checkEmailExists,
  changePassword,
  getCurrentUser
} = require("../controllers/authController");
const { verifyToken, optionalVerifyToken } = require("../middleware/verifyToken");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", optionalVerifyToken, getCurrentUser);
router.post("/forgot-password", resetpasswordrequest);
router.post("/reset-password/:token", resetpassword);
router.get("/check-email", checkEmailExists);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
