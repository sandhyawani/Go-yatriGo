const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");

const runCleanup = async () => {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;

  console.log(`Starting Inconsistency Cleanup... [Mode: ${isApply ? "APPLY (Destructive)" : "DRY-RUN (Safe)"}]`);

  await connectDB();
  
  if (isApply && (mongoose.connection.name === "production" || process.env.NODE_ENV === "production")) {
    console.error("Safety Abort: Connected to a production database! Will not run destructive operations.");
    process.exit(1);
  }

  try {
    const allUsers = await User.find({}, "_id").lean();
    const validUserIds = new Set(allUsers.map(u => u._id.toString()));

    const allJourneys = await Journey.find({}).lean();
    const validJourneyIds = new Set(allJourneys.map(j => j._id.toString()));

    const actions = {
      deleteJourneys: new Set(),
      deleteJoinRequests: new Set(),
      deleteInvitations: new Set(),
      ambiguousReports: []
    };

    // Scan Journeys
    for (let journey of allJourneys) {
      let isDemonstrablyInconsistent = false;
      let reason = "";

      // Creator checks - Demonstrably inconsistent if missing or invalid creator
      if (!journey.creator || !validUserIds.has(journey.creator.toString())) {
        isDemonstrablyInconsistent = true;
        reason = "Missing or invalid Creator";
      }
      
      if (!journey.title || !journey.destination) {
        isDemonstrablyInconsistent = true;
        reason = "Missing title or destination";
      }

      // If clearly invalid, schedule deletion
      if (isDemonstrablyInconsistent) {
        actions.deleteJourneys.add(journey._id.toString());
      } else {
        // Ambiguous checks (do not delete, just report)
        if (journey.members && journey.members.length > journey.maxMembers) {
          actions.ambiguousReports.push(`Journey ${journey._id} has too many members. Please repair manually.`);
        }
      }
    }

    // Scan JoinRequests
    const allJoinRequests = await JourneyJoinRequest.find({}).lean();
    for (let req of allJoinRequests) {
      const jId = req.journeyId ? req.journeyId.toString() : null;
      if (!jId || !validJourneyIds.has(jId) || actions.deleteJourneys.has(jId)) {
        actions.deleteJoinRequests.add(req._id.toString());
      }
    }

    // Scan Invitations
    const allInvitations = await JourneyInvitation.find({}).lean();
    for (let inv of allInvitations) {
      const jId = inv.journeyId ? inv.journeyId.toString() : null;
      if (!jId || !validJourneyIds.has(jId) || actions.deleteJourneys.has(jId)) {
        actions.deleteInvitations.add(inv._id.toString());
      }
    }

    // Summary
    console.log("\n=== CLEANUP SUMMARY ===");
    console.log(`Journeys scheduled for deletion: ${actions.deleteJourneys.size}`);
    console.log(`JoinRequests scheduled for deletion: ${actions.deleteJoinRequests.size}`);
    console.log(`Invitations scheduled for deletion: ${actions.deleteInvitations.size}`);
    console.log(`Ambiguous records found (ignored): ${actions.ambiguousReports.length}`);

    if (actions.ambiguousReports.length > 0) {
      console.log("\nAmbiguous Records (Needs Manual Repair):");
      actions.ambiguousReports.forEach(r => console.log(`- ${r}`));
    }

    if (isDryRun) {
      console.log("\n[DRY RUN] No database changes were made. Use --apply to execute.");
      process.exit(0);
    }

    console.log("\nExecuting deletions...");
    if (actions.deleteJourneys.size > 0) {
      const jRes = await Journey.deleteMany({ _id: { $in: Array.from(actions.deleteJourneys) } });
      console.log(`Deleted ${jRes.deletedCount} Journeys.`);
    }
    
    if (actions.deleteJoinRequests.size > 0) {
      const jreqRes = await JourneyJoinRequest.deleteMany({ _id: { $in: Array.from(actions.deleteJoinRequests) } });
      console.log(`Deleted ${jreqRes.deletedCount} JoinRequests.`);
    }
    
    if (actions.deleteInvitations.size > 0) {
      const invRes = await JourneyInvitation.deleteMany({ _id: { $in: Array.from(actions.deleteInvitations) } });
      console.log(`Deleted ${invRes.deletedCount} Invitations.`);
    }
    
    console.log("Cleanup complete.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup encountered an error:", error);
    process.exit(1);
  }
};

runCleanup();
