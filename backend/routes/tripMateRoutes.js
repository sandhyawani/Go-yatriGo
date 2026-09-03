const express = require("express");
const router = express.Router();

const {
  getTripMates,
  addTripMate,
  removeTripMate,
  getAllConnections
} = require("../controllers/tripMateController");

const { verifyToken, optionalVerifyToken } = require("../middleware/verifyToken");

router.get("/connections", verifyToken, getAllConnections);
router.get("/:userId", optionalVerifyToken, getTripMates);
router.post("/add/:targetUserId", verifyToken, addTripMate);
router.delete("/:targetUserId", verifyToken, removeTripMate);

module.exports = router;
