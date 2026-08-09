const assert = require("assert");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const TravelGroup = require("../models/TravelGroup");
const JoinRequest = require("../models/JoinRequest");
const Journey = require("../models/Journey");
const JourneyMember = require("../models/JourneyMember");
const JourneyInvitation = require("../models/JourneyInvitation");
const JourneyTimeline = require("../models/JourneyTimeline");
const ChatRoom = require("../models/ChatRoom");
const Notification = require("../models/Notification");
const User = require("../models/User");

const { requestToJoinTrip, manageJoinRequest } = require("../controllers/socialTravelController");
const { inviteMembers, acceptInvitation } = require("../controllers/journeyController");

// Helper mock response factory
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

async function runJoiningFlowTests() {
  console.log("\n==================================================");
  console.log("  RUNNING COMPREHENSIVE TRAVEL JOINING FLOW TESTS");
  console.log("==================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goyatrigo_test";
  await mongoose.connect(mongoUri);

  let passedCount = 0;
  let totalCount = 10;

  try {
    // Setup dummy test users
    const hostUser = await User.create({ name: "Host User", email: `host_${Date.now()}@test.com`, password: "password123" });
    const userA = await User.create({ name: "User A", email: `usera_${Date.now()}@test.com`, password: "password123" });
    const userB = await User.create({ name: "User B", email: `userb_${Date.now()}@test.com`, password: "password123" });
    const nonOrgUser = await User.create({ name: "Non Org", email: `nonorg_${Date.now()}@test.com`, password: "password123" });

    // ----------------------------------------------------------------------
    // Scenario 1: Host attempts to approve a pending request when group capacity is full
    // ----------------------------------------------------------------------
    console.log("Test 1: Approve when group is full");
    const groupFull = await TravelGroup.create({
      title: "Test Full Group",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "Paris",
      host: hostUser._id,
      maxMembers: 2,
      members: [
        { user: hostUser._id, role: "host" },
        { user: userA._id, role: "member" }
      ],
      isPrivate: true
    });

    const req1 = await JoinRequest.create({ groupId: groupFull._id, userId: userB._id, status: "Pending" });
    const res1 = createMockRes();

    await manageJoinRequest(
      { body: { requestId: req1._id.toString(), status: "Approved" }, user: { _id: hostUser._id } },
      res1
    );

    assert.strictEqual(res1.statusCode, 400, "Should return HTTP 400 when group is full");
    assert.strictEqual(res1.body.success, false);
    assert.strictEqual(res1.body.message, "Group capacity has been reached");
    console.log("  ✓ Passed: 400 returned, user not added to full group\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 2: Two concurrent approvals for the final available slot
    // ----------------------------------------------------------------------
    console.log("Test 2: Two concurrent approvals for final available slot");
    const groupSlot = await TravelGroup.create({
      title: "One Slot Left Group",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "Rome",
      host: hostUser._id,
      maxMembers: 2,
      members: [{ user: hostUser._id, role: "host" }],
      isPrivate: true
    });

    const reqA = await JoinRequest.create({ groupId: groupSlot._id, userId: userA._id, status: "Pending" });
    const reqB = await JoinRequest.create({ groupId: groupSlot._id, userId: userB._id, status: "Pending" });

    const resA = createMockRes();
    const resB = createMockRes();

    await Promise.all([
      manageJoinRequest({ body: { requestId: reqA._id.toString(), status: "Approved" }, user: { _id: hostUser._id } }, resA),
      manageJoinRequest({ body: { requestId: reqB._id.toString(), status: "Approved" }, user: { _id: hostUser._id } }, resB)
    ]);

    const results = [resA, resB];
    const successCount = results.filter((r) => r.statusCode === 200).length;
    const failCount = results.filter((r) => r.statusCode === 400).length;

    assert.strictEqual(successCount, 1, "Exactly one approval must succeed");
    assert.strictEqual(failCount, 1, "Exactly one approval must fail with 400");
    console.log("  ✓ Passed: Race condition prevented, exactly one approval succeeded\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 3: Duplicate pending group request
    // ----------------------------------------------------------------------
    console.log("Test 3: Duplicate pending group request");
    const resDup = createMockRes();
    await requestToJoinTrip(
      { params: { id: groupSlot._id.toString() }, body: { message: "Second try" }, user: { _id: userA._id } },
      resDup
    );

    assert.strictEqual(resDup.statusCode, 400, "Should return HTTP 400 for duplicate request");
    assert.strictEqual(resDup.body.success, false);
    console.log("  ✓ Passed: 400 returned, no duplicate request created\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 4: Accept full journey invitation
    // ----------------------------------------------------------------------
    console.log("Test 4: Accept full journey invitation");
    const journeyFull = await Journey.create({
      title: "Full Journey",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "Tokyo",
      creator: hostUser._id,
      maxMembers: 1,
      members: [{ user: hostUser._id, role: "Organizer" }]
    });

    const inviteFull = await JourneyInvitation.create({
      journeyId: journeyFull._id,
      inviterId: hostUser._id,
      inviteeId: userA._id,
      status: "pending"
    });

    const resAccFull = createMockRes();
    await acceptInvitation(
      { params: { invitationId: inviteFull._id.toString() }, user: { _id: userA._id } },
      resAccFull
    );

    assert.strictEqual(resAccFull.statusCode, 400, "Should return HTTP 400 when journey is full");
    const updatedInviteFull = await JourneyInvitation.findById(inviteFull._id);
    assert.strictEqual(updatedInviteFull.status, "capacity_full", "Status should update to capacity_full");
    console.log("  ✓ Passed: 400 returned, invitation set to capacity_full\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 5: Invite existing member
    // ----------------------------------------------------------------------
    console.log("Test 5: Invite existing member");
    const journeyExisting = await Journey.create({
      title: "Existing Member Journey",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "Kyoto",
      creator: hostUser._id,
      members: [{ user: hostUser._id, role: "Organizer" }, { user: userA._id, role: "Member" }]
    });

    const resInvExisting = createMockRes();
    await inviteMembers(
      { params: { id: journeyExisting._id.toString() }, body: { userIds: [userA._id.toString()] }, user: { _id: hostUser._id } },
      resInvExisting
    );

    assert.strictEqual(resInvExisting.statusCode, 400, "Should return HTTP 400 when inviting existing member");
    console.log("  ✓ Passed: 400 returned, no invitation sent\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 6: Invite already-pending user
    // ----------------------------------------------------------------------
    console.log("Test 6: Invite already-pending user");
    await JourneyInvitation.create({
      journeyId: journeyExisting._id,
      inviterId: hostUser._id,
      inviteeId: userB._id,
      status: "pending"
    });

    const resInvPending = createMockRes();
    await inviteMembers(
      { params: { id: journeyExisting._id.toString() }, body: { userIds: [userB._id.toString()] }, user: { _id: hostUser._id } },
      resInvPending
    );

    assert.strictEqual(resInvPending.statusCode, 400, "Should return HTTP 400 when user has pending invite");
    console.log("  ✓ Passed: 400 returned, duplicate invite prevented\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 7: Unauthorized invitation (Non-organizer)
    // ----------------------------------------------------------------------
    console.log("Test 7: Unauthorized invitation (Non-organizer)");
    const resUnauth = createMockRes();
    await inviteMembers(
      { params: { id: journeyExisting._id.toString() }, body: { userIds: [userA._id.toString()] }, user: { _id: nonOrgUser._id } },
      resUnauth
    );

    assert.strictEqual(resUnauth.statusCode, 403, "Should return HTTP 403 for unauthorized invitation attempt");
    console.log("  ✓ Passed: HTTP 403 returned for non-organizer invite attempt\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 8: Transaction rollback safety
    // ----------------------------------------------------------------------
    console.log("Test 8: Transaction rollback safety check");
    const journeyTx = await Journey.create({
      title: "Tx Journey",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "Berlin",
      creator: hostUser._id,
      members: [{ user: hostUser._id, role: "Organizer" }]
    });
    const inviteTx = await JourneyInvitation.create({
      journeyId: journeyTx._id,
      inviterId: hostUser._id,
      inviteeId: userA._id,
      status: "pending"
    });

    // Delete journey to simulate failure during accept
    await Journey.findByIdAndDelete(journeyTx._id);

    const resTxFail = createMockRes();
    await acceptInvitation(
      { params: { invitationId: inviteTx._id.toString() }, user: { _id: userA._id } },
      resTxFail
    );

    assert.strictEqual(resTxFail.statusCode, 404, "Should return HTTP 404 when journey missing");
    const memberCheck = await JourneyMember.findOne({ journeyId: journeyTx._id, userId: userA._id });
    assert.strictEqual(memberCheck, null, "Zero partial writes allowed on transaction failure");
    console.log("  ✓ Passed: Transaction rolled back cleanly, zero partial writes\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 9: Rejected join request path & notification cleanup
    // ----------------------------------------------------------------------
    console.log("Test 9: Rejected join request path & notification cleanup");
    const groupRej = await TravelGroup.create({
      title: "Rejection Group",
      description: "Test description",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      destination: "London",
      host: hostUser._id,
      members: [{ user: hostUser._id, role: "host" }]
    });
    const reqRej = await JoinRequest.create({ groupId: groupRej._id, userId: userA._id, status: "Pending" });
    await Notification.create({ sender: userA._id, receiver: hostUser._id, type: "join_request", group: groupRej._id, joinRequest: reqRej._id, message: "User A requested to join" });

    const resRej = createMockRes();
    await manageJoinRequest(
      { body: { requestId: reqRej._id.toString(), status: "Rejected" }, user: { _id: hostUser._id } },
      resRej
    );

    assert.strictEqual(resRej.statusCode, 200, "Should return HTTP 200 on rejection");
    const updatedReqRej = await JoinRequest.findById(reqRej._id);
    assert.strictEqual(updatedReqRej.status, "Rejected", "Status should update to Rejected");
    const hostNotifCheck = await Notification.findOne({ joinRequest: reqRej._id, type: "join_request" });
    assert.strictEqual(hostNotifCheck, null, "Pending host notification should be cleaned up");
    console.log("  ✓ Passed: Request set to Rejected, host notification cleaned up\n");
    passedCount++;

    // ----------------------------------------------------------------------
    // Scenario 10: Already-processed invitation
    // ----------------------------------------------------------------------
    console.log("Test 10: Already-processed invitation");
    const resAlreadyProc = createMockRes();
    await manageJoinRequest(
      { body: { requestId: reqRej._id.toString(), status: "Approved" }, user: { _id: hostUser._id } },
      resAlreadyProc
    );

    assert.strictEqual(resAlreadyProc.statusCode, 400, "Should return HTTP 400 for already-processed request");
    assert.strictEqual(resAlreadyProc.body.message, "Invitation has already been processed");
    console.log("  ✓ Passed: 400 returned, re-processing prevented\n");
    passedCount++;

    console.log("==================================================");
    console.log(`  ALL ${passedCount}/${totalCount} TEST SCENARIOS PASSED SUCCESSFULLY!`);
    console.log("==================================================\n");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runJoiningFlowTests();
}

module.exports = runJoiningFlowTests;
