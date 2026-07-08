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
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/verifyToken");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", resetpasswordrequest);
router.post("/reset-password/:token", resetpassword);
router.get("/check-email", checkEmailExists);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;