const mongoose = require("mongoose");
const User = require("../models/User");
const Block = require("../models/Block");

// Checks if a block exists between userA and userB in either direction
const isBlockedPair = async (userAId, userBId) => {
  if (!userAId || !userBId) return false;

  const aStr = userAId.toString();
  const bStr = userBId.toString();
  if (aStr === bStr) return false;

  const aId = mongoose.Types.ObjectId.isValid(aStr) ? new mongoose.Types.ObjectId(aStr) : null;
  const bId = mongoose.Types.ObjectId.isValid(bStr) ? new mongoose.Types.ObjectId(bStr) : null;
  if (!aId || !bId) return false;

  const blockDoc = await Block.findOne({
    $or: [
      { blocker: aId, blocked: bId },
      { blocker: bId, blocked: aId }
    ]
  }).lean();

  if (blockDoc) return true;

  // Fallback check in User.blockedUsers array
  const users = await User.find({
    _id: { $in: [aId, bId] }
  }).select("blockedUsers").lean();

  for (const u of users) {
    if (Array.isArray(u.blockedUsers)) {
      const blockedSet = new Set(u.blockedUsers.map((id) => (id._id || id).toString()));
      if (u._id.toString() === aStr && blockedSet.has(bStr)) return true;
      if (u._id.toString() === bStr && blockedSet.has(aStr)) return true;
    }
  }

  return false;
};

// Gets all user IDs that have a block relationship with userId in either direction
const getBlockedUserIds = async (userId) => {
  if (!userId) {
    return { objectIds: [], stringIds: [], idSet: new Set() };
  }

  const uStr = userId.toString();
  const uId = mongoose.Types.ObjectId.isValid(uStr) ? new mongoose.Types.ObjectId(uStr) : null;
  if (!uId) {
    return { objectIds: [], stringIds: [], idSet: new Set() };
  }

  const blockedIdSet = new Set();

  // 1. Block collection: blocker == uId OR blocked == uId
  const blockDocs = await Block.find({
    $or: [
      { blocker: uId },
      { blocked: uId }
    ]
  }).lean();

  for (const b of blockDocs) {
    if (b.blocker && b.blocker.toString() !== uStr) {
      blockedIdSet.add(b.blocker.toString());
    }
    if (b.blocked && b.blocked.toString() !== uStr) {
      blockedIdSet.add(b.blocked.toString());
    }
  }

  // 2. User collection:
  // a) currentUser's blockedUsers
  const currentUser = await User.findById(uId).select("blockedUsers").lean();
  if (currentUser && Array.isArray(currentUser.blockedUsers)) {
    for (const bId of currentUser.blockedUsers) {
      const bStr = (bId._id || bId).toString();
      if (bStr && bStr !== uStr) blockedIdSet.add(bStr);
    }
  }

  // b) Users who have currentUser in their blockedUsers
  const usersWhoBlocked = await User.find({
    blockedUsers: uId
  }).select("_id").lean();

  for (const u of usersWhoBlocked) {
    const idStr = u._id.toString();
    if (idStr !== uStr) blockedIdSet.add(idStr);
  }

  const stringIds = Array.from(blockedIdSet);
  const objectIds = stringIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  return {
    objectIds,
    stringIds,
    idSet: blockedIdSet
  };
};

/**
 * Returns a MongoDB query filter to exclude all blocked users on a specific field (default "userId").
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} field
 * @returns {Promise<Object>}
 */
const getBlockFilter = async (userId, field = "userId") => {
  const { objectIds } = await getBlockedUserIds(userId);
  if (!objectIds || objectIds.length === 0) {
    return {};
  }
  return { [field]: { $nin: objectIds } };
};

const getModel = (name) => {
  try {
    return mongoose.models[name] || require(`../models/${name}`);
  } catch (e) {
    return null;
  }
};

// Handles complete block action across users, relations, and messaging
const blockUserAction = async (blockerId, blockedId) => {
  const b1Str = blockerId.toString();
  const b2Str = blockedId.toString();
  if (b1Str === b2Str) {
    throw new Error("You cannot block yourself.");
  }

  const b1 = new mongoose.Types.ObjectId(b1Str);
  const b2 = new mongoose.Types.ObjectId(b2Str);

  await Block.findOneAndUpdate(
    { blocker: b1, blocked: b2 },
    { blocker: b1, blocked: b2 },
    { upsert: true, new: true }
  );

  // Update blocker: add to blockedUsers and remove relations
  await User.findByIdAndUpdate(b1, {
    $addToSet: { blockedUsers: b2 },
    $pull: {
      followers: b2,
      following: b2,
      followRequests: b2,
      messageRequests: b2
    }
  });

  // Update blocked user: remove relations
  await User.findByIdAndUpdate(b2, {
    $pull: {
      followers: b1,
      following: b1,
      followRequests: b1,
      messageRequests: b1
    }
  });

  // Clean up follow records
  const Follow = getModel("Follow");
  if (Follow) {
    await Follow.deleteMany({
      $or: [
        { follower: b1, following: b2 },
        { follower: b2, following: b1 }
      ]
    });
  }

  // Clean up connections
  const TripMateConnection = getModel("TripMateConnection");
  if (TripMateConnection) {
    await TripMateConnection.deleteMany({
      $or: [
        { requester: b1, recipient: b2 },
        { requester: b2, recipient: b1 }
      ]
    });
  }

  // Clean up pending invitations
  const JourneyInvitation = getModel("JourneyInvitation");
  if (JourneyInvitation) {
    await JourneyInvitation.deleteMany({
      $or: [
        { inviterId: b1, inviteeId: b2 },
        { inviterId: b2, inviteeId: b1 }
      ]
    });
  }

  // Clean up follow notifications
  const Notification = getModel("Notification");
  if (Notification) {
    await Notification.deleteMany({
      type: { $in: ["follow_request", "follow_accept", "follow"] },
      $or: [
        { sender: b1, receiver: b2 },
        { sender: b2, receiver: b1 }
      ]
    });
  }

  // Update direct chat room status
  const ChatRoom = getModel("ChatRoom");
  if (ChatRoom) {
    await ChatRoom.updateMany(
      {
        type: "direct",
        members: { $all: [b1, b2] }
      },
      {
        $set: { requestStatus: "blocked" }
      }
    );
  }

  return { success: true };
};

// Handles unblocking and restores direct chat room status if not blocked in opposite direction
const unblockUserAction = async (blockerId, blockedId) => {
  const b1Str = blockerId.toString();
  const b2Str = blockedId.toString();
  const b1 = new mongoose.Types.ObjectId(b1Str);
  const b2 = new mongoose.Types.ObjectId(b2Str);

  await Block.deleteMany({ blocker: b1, blocked: b2 });

  await User.findByIdAndUpdate(b1, {
    $pull: { blockedUsers: b2 }
  });

  // Reset direct chat status only if not still blocked in opposite direction
  const isStillBlocked = await isBlockedPair(b1, b2);
  const ChatRoom = getModel("ChatRoom");
  if (ChatRoom && !isStillBlocked) {
    await ChatRoom.updateMany(
      {
        type: "direct",
        members: { $all: [b1, b2] },
        requestStatus: "blocked"
      },
      {
        $set: { requestStatus: "accepted" }
      }
    );
  }

  return { success: true };
};

module.exports = {
  isBlockedPair,
  getBlockedUserIds,
  getBlockFilter,
  blockUserAction,
  unblockUserAction
};