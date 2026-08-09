const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");
const Notification = require("../models/Notification");
const Story = require("../models/Story");
const TravelGroup = require("../models/TravelGroup");
const ChatRoom = require("../models/ChatRoom");
const JourneyMember = require("../models/JourneyMember");

const MANIFEST_PATH = path.join(__dirname, "testDataManifest.json");

const loadManifest = () => {
  if (fs.existsSync(MANIFEST_PATH)) {
    const raw = fs.readFileSync(MANIFEST_PATH);
    return JSON.parse(raw);
  }
  return null;
};

const runReset = async () => {
  await connectDB();
  
  if (mongoose.connection.name === "production" || process.env.NODE_ENV === "production") {
    console.error("Safety Abort: Connected to a production database!");
    process.exit(1);
  }

  const manifest = loadManifest();
  if (!manifest) {
    console.log("No testDataManifest.json found. Nothing to reset.");
    process.exit(0);
  }

  try {
    console.log("Starting test data reset...");

    // Delete dependents first to avoid orphaned data
    if (manifest.stories && manifest.stories.length > 0) {
      const res = await Story.deleteMany({ _id: { $in: manifest.stories } });
      console.log(`Deleted ${res.deletedCount} Stories`);
    }

    if (manifest.notifications && manifest.notifications.length > 0) {
      const res = await Notification.deleteMany({ _id: { $in: manifest.notifications } });
      console.log(`Deleted ${res.deletedCount} Notifications`);
    }

    if (manifest.invitations && manifest.invitations.length > 0) {
      const res = await JourneyInvitation.deleteMany({ _id: { $in: manifest.invitations } });
      console.log(`Deleted ${res.deletedCount} Invitations`);
    }

    if (manifest.joinRequests && manifest.joinRequests.length > 0) {
      const res = await JourneyJoinRequest.deleteMany({ _id: { $in: manifest.joinRequests } });
      console.log(`Deleted ${res.deletedCount} JoinRequests`);
    }

    if (manifest.chatRooms && manifest.chatRooms.length > 0) {
      const res = await ChatRoom.deleteMany({ _id: { $in: manifest.chatRooms } });
      console.log(`Deleted ${res.deletedCount} ChatRooms`);
    }

    if (manifest.journeyMembers && manifest.journeyMembers.length > 0) {
      const res = await JourneyMember.deleteMany({ _id: { $in: manifest.journeyMembers } });
      console.log(`Deleted ${res.deletedCount} JourneyMembers`);
    }

    if (manifest.travelGroups && manifest.travelGroups.length > 0) {
      const res = await TravelGroup.deleteMany({ _id: { $in: manifest.travelGroups } });
      console.log(`Deleted ${res.deletedCount} TravelGroups`);
    }

    if (manifest.journeys && manifest.journeys.length > 0) {
      const res = await Journey.deleteMany({ _id: { $in: manifest.journeys } });
      console.log(`Deleted ${res.deletedCount} Journeys`);
    }

    // Delete users last
    if (manifest.users && manifest.users.length > 0) {
      const res = await User.deleteMany({ _id: { $in: manifest.users } });
      console.log(`Deleted ${res.deletedCount} Users`);
    }

    // Reset manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
      users: [], journeys: [], travelGroups: [], joinRequests: [], invitations: [], notifications: [], stories: [], chatRooms: [], journeyMembers: []
    }, null, 2));

    console.log("Test data reset successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting test data:", error);
    process.exit(1);
  }
};

runReset();
