const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");

// Load Models
const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");
const Notification = require("../models/Notification");
const Story = require("../models/Story");
const JourneyGallery = require("../models/JourneyGallery");
const JourneyMemory = require("../models/JourneyMemory");
const JourneyTimeline = require("../models/JourneyTimeline");
const JourneyWorkspace = require("../models/JourneyWorkspace");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

const MANIFEST_PATH = path.join(__dirname, "testDataManifest.json");

const loadManifest = () => {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH));
  }
  return { journeys: [] };
};

const confirmDeletion = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("Type DELETE to continue: ", (answer) => {
      rl.close();
      resolve(answer === "DELETE");
    });
  });
};

const runCleanup = async () => {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;
  
  let manualIds = [];
  const idsArg = args.find(a => a.startsWith("--ids="));
  if (idsArg) {
    manualIds = idsArg.split("=")[1].split(",").map(id => id.trim()).filter(Boolean);
  }

  console.log(`\nStarting Advanced Inconsistent Journey Cleanup...`);
  console.log(`Mode: ${isApply ? "APPLY (Destructive)" : "DRY-RUN (Safe)"}`);
  if (manualIds.length > 0) {
    console.log(`Targeting Manual IDs: ${manualIds.join(", ")}`);
  }

  await connectDB();
  if (isApply && (mongoose.connection.name === "production" || process.env.NODE_ENV === "production")) {
    console.error("Safety Abort: Connected to a production database! Will not run destructive operations.");
    process.exit(1);
  }

  try {
    const manifest = loadManifest();
    const protectedJourneyIds = new Set((manifest.journeys || []).map(id => id.toString()));

    const allUsers = await User.find({}, "_id").lean();
    const validUserIds = new Set(allUsers.map(u => u._id.toString()));

    let query = {};
    if (manualIds.length > 0) {
      query = { _id: { $in: manualIds } };
    }
    const allJourneys = await Journey.find(query).lean();

    const deletionCandidates = [];

    for (let journey of allJourneys) {
      const jId = journey._id.toString();

      if (protectedJourneyIds.has(jId)) {
        if (manualIds.includes(jId)) {
          console.log(`Skipping ${jId} - It is protected in testDataManifest.json`);
        }
        continue;
      }

      let reason = null;

      // If manually targeted, we bypass automatic criteria
      if (manualIds.includes(jId)) {
        reason = "Manually targeted via --ids";
      } else {
        // Automatic criteria
        if (!journey.creator) {
          reason = "Creator missing";
        } else if (!validUserIds.has(journey.creator.toString())) {
          reason = "Creator does not exist";
        } else if (!journey.title || journey.title.trim() === "") {
          reason = "Title missing";
        } else if (!journey.destination || journey.destination.trim() === "") {
          reason = "Destination missing";
        } else if (!journey.startDate) {
          reason = "startDate missing";
        } else if (journey.startDate && journey.endDate && new Date(journey.startDate) > new Date(journey.endDate)) {
          reason = "startDate > endDate";
        } else if (journey.members && journey.members.length > journey.maxMembers) {
          reason = `members.length (${journey.members.length}) > maxMembers (${journey.maxMembers})`;
        }
      }

      if (reason) {
        deletionCandidates.push({ journeyId: jId, reason });
      }
    }

    if (deletionCandidates.length === 0) {
      console.log("\nNo inconsistent journeys found based on criteria. Exiting.");
      process.exit(0);
    }

    console.log("\n=== DELETION CANDIDATES ===");
    for (let candidate of deletionCandidates) {
      console.log(`- ${candidate.journeyId} [Reason: ${candidate.reason}]`);
    }

    const journeyIdsToDelete = deletionCandidates.map(c => c.journeyId);
    
    // Find ChatRooms first so we can delete their messages
    const chatRooms = await ChatRoom.find({ journeyId: { $in: journeyIdsToDelete } }).lean();
    const chatRoomIds = chatRooms.map(cr => cr._id.toString());

    // Gather counts
    const counts = {
      journeys: journeyIdsToDelete.length,
      joinRequests: await JourneyJoinRequest.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      invitations: await JourneyInvitation.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      notifications: await Notification.countDocuments({ journey: { $in: journeyIdsToDelete } }),
      stories: await Story.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      galleries: await JourneyGallery.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      memories: await JourneyMemory.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      timelines: await JourneyTimeline.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      workspaces: await JourneyWorkspace.countDocuments({ journeyId: { $in: journeyIdsToDelete } }),
      chatRooms: chatRoomIds.length,
      messages: chatRoomIds.length > 0 ? await Message.countDocuments({ roomId: { $in: chatRoomIds } }) : 0
    };

    console.log("\n=== DEPENDENCY IMPACT SUMMARY ===");
    console.log(`Journeys: ${counts.journeys}`);
    console.log(`JourneyJoinRequests: ${counts.joinRequests}`);
    console.log(`JourneyInvitations: ${counts.invitations}`);
    console.log(`Notifications: ${counts.notifications}`);
    console.log(`Stories: ${counts.stories}`);
    console.log(`JourneyGalleries: ${counts.galleries}`);
    console.log(`JourneyMemories: ${counts.memories}`);
    console.log(`JourneyTimelines: ${counts.timelines}`);
    console.log(`JourneyWorkspaces: ${counts.workspaces}`);
    console.log(`ChatRooms: ${counts.chatRooms}`);
    console.log(`Messages: ${counts.messages}`);

    if (isDryRun) {
      console.log("\n[DRY RUN] No database changes were made. Use --apply to execute.");
      process.exit(0);
    }

    // If we're applying, and this was triggered manually via --ids, require confirmation
    if (manualIds.length > 0) {
      const totalDependent = Object.values(counts).reduce((a, b) => a + b, 0) - counts.journeys;
      console.log(`\nYou are about to permanently delete Journey(s) and ${totalDependent} dependent records.`);
      const isConfirmed = await confirmDeletion();
      if (!isConfirmed) {
        console.log("Deletion aborted by user.");
        process.exit(0);
      }
    }

    console.log("\nExecuting cascaded deletions...");
    
    // Delete in order to avoid orphaned data constraints if any exist
    if (counts.joinRequests > 0) await JourneyJoinRequest.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.invitations > 0) await JourneyInvitation.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.notifications > 0) await Notification.deleteMany({ journey: { $in: journeyIdsToDelete } });
    if (counts.stories > 0) await Story.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.galleries > 0) await JourneyGallery.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.memories > 0) await JourneyMemory.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.timelines > 0) await JourneyTimeline.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    if (counts.workspaces > 0) await JourneyWorkspace.deleteMany({ journeyId: { $in: journeyIdsToDelete } });
    
    if (counts.messages > 0) await Message.deleteMany({ roomId: { $in: chatRoomIds } });
    if (counts.chatRooms > 0) await ChatRoom.deleteMany({ journeyId: { $in: journeyIdsToDelete } });

    if (counts.journeys > 0) await Journey.deleteMany({ _id: { $in: journeyIdsToDelete } });

    console.log("Cleanup complete!");
    process.exit(0);

  } catch (error) {
    console.error("Cleanup encountered an error:", error);
    process.exit(1);
  }
};

runCleanup();
