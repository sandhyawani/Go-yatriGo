const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");

const runScanner = async () => {
  await connectDB();

  console.log("Starting Inconsistency Scanner...");
  const report = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  try {
    const allUsers = await User.find({}, "_id").lean();
    const validUserIds = new Set(allUsers.map(u => u._id.toString()));

    const allJourneys = await Journey.find({}).lean();
    const validJourneyIds = new Set(allJourneys.map(j => j._id.toString()));

    for (let journey of allJourneys) {
      let issues = [];

      // Required fields missing
      if (!journey.title || !journey.destination || !journey.startDate || !journey.endDate) {
        issues.push({ level: "high", msg: "Missing required fields (title, destination, startDate, endDate)" });
      }

      // Invalid dates
      if (journey.startDate && journey.endDate && new Date(journey.startDate) > new Date(journey.endDate)) {
        issues.push({ level: "high", msg: "startDate is after endDate" });
      }

      // Creator checks
      if (!journey.creator) {
        issues.push({ level: "high", msg: "Creator missing" });
      } else if (!validUserIds.has(journey.creator.toString())) {
        issues.push({ level: "high", msg: "Creator reference invalid (User does not exist)" });
      }

      // Invalid Journey status
      const validStatuses = ["Planning", "Upcoming", "Ongoing", "Completed", "Cancelled", "Archived"];
      if (!validStatuses.includes(journey.status)) {
        issues.push({ level: "medium", msg: `Invalid status: ${journey.status}` });
      }

      // Member checks
      if (journey.members && Array.isArray(journey.members)) {
        if (journey.members.length > journey.maxMembers) {
          issues.push({ level: "critical", msg: `members.length (${journey.members.length}) > maxMembers (${journey.maxMembers})` });
        }

        let seenMembers = new Set();
        for (let m of journey.members) {
          if (!m.user) {
            issues.push({ level: "high", msg: "Member user reference missing" });
            continue;
          }
          const uid = m.user.toString();
          if (seenMembers.has(uid)) {
            issues.push({ level: "medium", msg: `Duplicate member detected: ${uid}` });
          }
          seenMembers.add(uid);

          if (!validUserIds.has(uid)) {
            issues.push({ level: "high", msg: `Member reference invalid (User does not exist): ${uid}` });
          }
        }
      }

      // Log issues to report
      issues.forEach(i => {
        report[i.level].push({ journeyId: journey._id.toString(), issue: i.msg });
      });
    }

    const allJoinRequests = await JourneyJoinRequest.find({}).lean();
    let pendingJReqs = {}; // "journeyId-userId" -> count
    for (let req of allJoinRequests) {
      if (!req.journeyId) continue;
      
      const jId = req.journeyId.toString();
      const uId = req.userId ? req.userId.toString() : null;

      if (!validJourneyIds.has(jId)) {
        report.high.push({ journeyId: jId, issue: `JoinRequest (${req._id}) references nonexistent Journey` });
      } else {
        if (req.status === "accepted" && uId) {
          const journey = allJourneys.find(j => j._id.toString() === jId);
          if (journey && (!journey.members || !journey.members.some(m => m.user && m.user.toString() === uId))) {
            report.medium.push({ journeyId: jId, issue: `Accepted JoinRequest (${req._id}) but user ${uId} is not a Journey member` });
          }
        }

        if (req.status === "pending" && uId) {
          const key = `${jId}-${uId}`;
          pendingJReqs[key] = (pendingJReqs[key] || 0) + 1;
        }
      }
    }
    
    // Check duplicate pending JoinRequests
    for (let key in pendingJReqs) {
      if (pendingJReqs[key] > 1) {
        const [jId, uId] = key.split("-");
        report.medium.push({ journeyId: jId, issue: `Duplicate pending JoinRequests for user ${uId}` });
      }
    }

    const allInvitations = await JourneyInvitation.find({}).lean();
    let pendingInvs = {};
    for (let inv of allInvitations) {
      if (!inv.journeyId) continue;
      
      const jId = inv.journeyId.toString();
      const inviteeId = inv.inviteeId ? inv.inviteeId.toString() : null;

      if (!validJourneyIds.has(jId)) {
        report.high.push({ journeyId: jId, issue: `Invitation (${inv._id}) references nonexistent Journey` });
      } else {
        if (inv.status === "accepted" && inviteeId) {
          const journey = allJourneys.find(j => j._id.toString() === jId);
          if (journey && (!journey.members || !journey.members.some(m => m.user && m.user.toString() === inviteeId))) {
            report.medium.push({ journeyId: jId, issue: `Accepted Invitation (${inv._id}) but user ${inviteeId} is not a Journey member` });
          }
        }

        if (inv.status === "pending" && inviteeId) {
          const key = `${jId}-${inviteeId}`;
          pendingInvs[key] = (pendingInvs[key] || 0) + 1;
        }
      }
    }
    
    // Check duplicate pending Invitations
    for (let key in pendingInvs) {
      if (pendingInvs[key] > 1) {
        const [jId, uId] = key.split("-");
        report.medium.push({ journeyId: jId, issue: `Duplicate pending Invitations for user ${uId}` });
      }
    }

    console.log("\n====== INCONSISTENT JOURNEYS ======\n");
    let totalInconsistent = 0;
    const printReport = (level, issues) => {
      if (issues.length > 0) {
        issues.forEach(i => {
          console.log(`[${level.toUpperCase()}]`);
          console.log(`Journey: ${i.journeyId}`);
          console.log(`Issue: ${i.issue}\n`);
        });
        totalInconsistent += new Set(issues.map(i => i.journeyId)).size; // Approximate distinct, exact distinct calc is better below
      }
    };

    printReport("critical", report.critical);
    printReport("high", report.high);
    printReport("medium", report.medium);
    printReport("low", report.low);

    const allInconsistentJourneyIds = new Set([
      ...report.critical.map(i => i.journeyId),
      ...report.high.map(i => i.journeyId),
      ...report.medium.map(i => i.journeyId),
      ...report.low.map(i => i.journeyId)
    ]);

    console.log(`Total journeys scanned: ${allJourneys.length}`);
    console.log(`Total inconsistent journeys: ${allInconsistentJourneyIds.size}`);
    console.log(`Critical issues: ${report.critical.length}`);
    console.log(`High issues: ${report.high.length}`);
    console.log(`Medium issues: ${report.medium.length}`);
    console.log(`Low issues: ${report.low.length}`);
    console.log("\n===================================\n");
    
    process.exit(0);
  } catch (error) {
    console.error("Scanner encountered an error:", error);
    process.exit(1);
  }
};

runScanner();
