const travelBuddyController = require("./travelBuddyController");
const memoryController = require("./memoryController");
const storyController = require("./storyController");
const socialSearchController = require("./socialSearchController");
const socialSafetyController = require("./socialSafetyController");

module.exports = {
  ...travelBuddyController,
  ...memoryController,
  ...storyController,
  ...socialSearchController,
  ...socialSafetyController
};