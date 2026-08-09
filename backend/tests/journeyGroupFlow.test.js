const assert = require("assert");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyInvitation = require("../models/JourneyInvitation");

const {
  inviteMembers,
  acceptInvitation,
  rejectInvitation,
} = require("../controllers/journeyController");

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

function createMockReq(overrides = {}) {
  return {
    app: {
      get: () => null
    },
    ...overrides
  };
}

async function runJourneyGroupFlowTests() {
  console.log("\n==================================================");
  console.log("  RUNNING JOURNEY GROUP FLOW TESTS");
  console.log("==================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goyatrigo_test";
  await mongoose.connect(mongoUri);

  let passedCount = 0;
  let totalCount = 10;

  try {
    // 1. Setup Dummy Data
    await User.deleteMany({ email: { $regex: /test_journey/ } });
    await Journey.deleteMany({ title: "Test Journey Flow" });
    await JourneyInvitation.deleteMany({});

    const userA = await User.create({ name: "Creator A", email: `test_journey_a_${Date.now()}@test.com`, password: "password123" });
    const userB = await User.create({ name: "Invited B", email: `test_journey_b_${Date.now()}@test.com`, password: "password123" });
    const userC = await User.create({ name: "Invited C", email: `test_journey_c_${Date.now()}@test.com`, password: "password123" });
    const userD = await User.create({ name: "Extra D", email: `test_journey_d_${Date.now()}@test.com`, password: "password123" });

    // Create a Journey directly using mongoose
    const journey = await Journey.create({
      title: "Test Journey Flow",
      destination: "Paris",
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 86400000 * 5),
      creator: userA._id,
      maxMembers: 3,
      members: [{ user: userA._id, role: "Organizer" }]
    });

    console.log(`User A (Creator): ${userA._id}`);
    console.log(`User B (Invited): ${userB._id}`);
    console.log(`User C (Invited): ${userC._id}`);
    console.log(`User D (Extra): ${userD._id}`);
    console.log(`Journey: ${journey._id} | Capacity: 3`);

    // --- FLOW A: Normal Acceptance ---
    console.log("\n[Test 1] A invites B...");
    const reqInviteB = createMockReq({
      user: { _id: userA._id, id: userA._id },
      params: { id: journey._id.toString() },
      body: { userIds: [userB._id.toString()], role: "Member" }
    });
    const resInviteB = createMockRes();
    await inviteMembers(reqInviteB, resInviteB);
    assert.strictEqual(resInviteB.statusCode, 200, "Invitation to B should succeed");
    console.log("✅ A invites B Passed");
    passedCount++;

    const inviteB_Doc = await JourneyInvitation.findOne({ journeyId: journey._id, inviteeId: userB._id });
    assert.ok(inviteB_Doc, "Invitation document for B should exist");

    console.log("\n[Test 2] B accepts invitation...");
    const reqAcceptB = createMockReq({
      user: { _id: userB._id, id: userB._id },
      params: { id: inviteB_Doc._id.toString() }
    });
    const resAcceptB = createMockRes();
    await acceptInvitation(reqAcceptB, resAcceptB);
    assert.strictEqual(resAcceptB.statusCode, 200, "Acceptance should succeed");
    console.log("✅ B accepts invitation Passed");
    passedCount++;

    console.log("\n[Test 3] Verify membership and invitation status for B...");
    const updatedInviteB = await JourneyInvitation.findById(inviteB_Doc._id);
    assert.strictEqual(updatedInviteB.status, "accepted", "Invitation status should be 'accepted'");
    
    let updatedJourney = await Journey.findById(journey._id);
    const bIsMember = updatedJourney.members.some(m => m.user.toString() === userB._id.toString());
    assert.ok(bIsMember, "User B should be in journey members");
    assert.strictEqual(updatedJourney.members.length, 2, "Journey should have exactly 2 members now");
    console.log("✅ Membership verified");
    passedCount++;

    console.log("\n[Test 4] B tries to accept again (Duplicate prevention)...");
    const resAcceptB_again = createMockRes();
    await acceptInvitation(reqAcceptB, resAcceptB_again);
    assert.strictEqual(resAcceptB_again.statusCode, 400, "Should return 400 for already processed invitation");
    
    updatedJourney = await Journey.findById(journey._id);
    assert.strictEqual(updatedJourney.members.length, 2, "No duplicate membership should exist");
    console.log("✅ Duplicate acceptance prevented");
    passedCount++;

    // --- Capacity decrease check ---
    console.log("\n[Test 5] A invites D and D accepts (Reaching Capacity)...");
    const reqInviteD = createMockReq({
      user: { _id: userA._id, id: userA._id },
      params: { id: journey._id.toString() },
      body: { userIds: [userD._id.toString()] }
    });
    const resInviteD = createMockRes();
    await inviteMembers(reqInviteD, resInviteD);
    
    const inviteD_Doc = await JourneyInvitation.findOne({ journeyId: journey._id, inviteeId: userD._id });
    const reqAcceptD = createMockReq({
      user: { _id: userD._id, id: userD._id },
      params: { id: inviteD_Doc._id.toString() }
    });
    const resAcceptD = createMockRes();
    await acceptInvitation(reqAcceptD, resAcceptD);
    assert.strictEqual(resAcceptD.statusCode, 200, "D's acceptance should succeed");

    updatedJourney = await Journey.findById(journey._id);
    assert.strictEqual(updatedJourney.members.length, 3, "Journey capacity should be exactly 3 now");
    console.log("✅ Capacity reached successfully");
    passedCount++;

    // --- FLOW B: Reject Invitation ---
    console.log("\n[Test 6] A invites C...");
    const reqInviteC = createMockReq({
      user: { _id: userA._id, id: userA._id },
      params: { id: journey._id.toString() },
      body: { userIds: [userC._id.toString()] }
    });
    const resInviteC = createMockRes();
    await inviteMembers(reqInviteC, resInviteC);
    assert.strictEqual(resInviteC.statusCode, 200, "Invitation to C should succeed");
    
    const inviteC_Doc = await JourneyInvitation.findOne({ journeyId: journey._id, inviteeId: userC._id });
    console.log("✅ A invites C Passed");
    passedCount++;

    console.log("\n[Test 7] C rejects invitation...");
    const reqRejectC = createMockReq({
      user: { _id: userC._id, id: userC._id },
      params: { id: inviteC_Doc._id.toString() }
    });
    const resRejectC = createMockRes();
    await rejectInvitation(reqRejectC, resRejectC);
    assert.strictEqual(resRejectC.statusCode, 200, "Rejection should succeed");
    console.log("✅ C rejects invitation Passed");
    passedCount++;

    console.log("\n[Test 8] Verify C's invitation is rejected and C is not a member...");
    const updatedInviteC = await JourneyInvitation.findById(inviteC_Doc._id);
    assert.strictEqual(updatedInviteC.status, "rejected", "Invitation status should be 'rejected'");
    
    updatedJourney = await Journey.findById(journey._id);
    const cIsMember = updatedJourney.members.some(m => m.user.toString() === userC._id.toString());
    assert.strictEqual(cIsMember, false, "User C should NOT be a member");
    console.log("✅ Rejection verified");
    passedCount++;

    console.log("\n[Test 9] C tries to accept the rejected invitation...");
    const reqAcceptC = createMockReq({
      user: { _id: userC._id, id: userC._id },
      params: { id: inviteC_Doc._id.toString() }
    });
    const resAcceptC = createMockRes();
    await acceptInvitation(reqAcceptC, resAcceptC);
    assert.strictEqual(resAcceptC.statusCode, 400, "Should prevent accepting a non-pending/rejected invitation");
    console.log("✅ Cannot accept rejected invitation");
    passedCount++;

    console.log("\n[Test 10] C tries to accept a forced pending invitation when capacity is full...");
    // Let's force it to pending to verify capacity check
    await JourneyInvitation.findByIdAndUpdate(inviteC_Doc._id, { status: "pending" });
    const resAcceptC_Full = createMockRes();
    await acceptInvitation(reqAcceptC, resAcceptC_Full);
    assert.strictEqual(resAcceptC_Full.statusCode, 400, "Should fail because capacity is full");
    assert.strictEqual(resAcceptC_Full.body.message, "Journey capacity is full", "Should return capacity full message");
    console.log("✅ Capacity full check verified");
    passedCount++;

  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error(error);
  } finally {
    console.log(`\n==================================================`);
    console.log(`  TESTS COMPLETE: ${passedCount}/${totalCount} Passed`);
    console.log(`==================================================\n`);
    await mongoose.connection.close();
    process.exit(0);
  }
}

runJourneyGroupFlowTests();
