const Block = require("../models/Block");

const getBidirectionalBlockedUserIds = async (userId) => {
  if (!userId) return [];

  try {
    const blocks = await Block.find({
      $or: [{ blocker: userId }, { blocked: userId }]
    }).select("blocker blocked");

    const blockedIdsSet = new Set();

    blocks.forEach((record) => {
      if (record.blocker && record.blocker.toString() === userId.toString()) {
        if (record.blocked) blockedIdsSet.add(record.blocked.toString());
      }
      if (record.blocked && record.blocked.toString() === userId.toString()) {
        if (record.blocker) blockedIdsSet.add(record.blocker.toString());
      }
    });

    return Array.from(blockedIdsSet);
  } catch (error) {
    console.error("Error fetching bidirectional blocked user IDs:", error);
    return [];
  }
};

module.exports = {
  getBidirectionalBlockedUserIds
};