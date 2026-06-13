const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");

router.get("/search", musicController.searchMusic);
router.get("/trending", musicController.getTrendingMusic);

module.exports = router;
