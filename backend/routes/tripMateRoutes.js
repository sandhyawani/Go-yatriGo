const express = require("express");
const router = express.Router();

const {
  getTripMates,
  addTripMate,
  removeTripMate,
  getAllConnections
} = require("../controllers/tripMateController");

const { verifyToken, optionalVerifyToken } = require("../middleware/verifyToken");

// Get all trip mate connections for the logged in user
router.get("/connections", verifyToken, getAllConnections);

// Get all trip mates for a user
router.get("/:userId", optionalVerifyToken, getTripMates);

// Add a trip mate
router.post("/add/:targetUserId", verifyToken, addTripMate);

// Remove a trip mate or cancel/decline an invitation
router.delete("/:targetUserId", verifyToken, removeTripMate);

module.exports = router;
