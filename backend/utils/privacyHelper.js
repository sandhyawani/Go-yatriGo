const User = require("../models/User");
const { isBlockedPair } = require("./blockHelper");

const canInteractWithContent = async (authorId, requestingUser) => {
  if (!authorId || !requestingUser) return false;

  const currentUserId = requestingUser._id || requestingUser.id;

  if (authorId.toString() === currentUserId.toString()) {
    return true;
  }

  const isBlocked = await isBlockedPair(authorId, currentUserId);
  if (isBlocked) {
    return false;
  }

  const author = await User.findById(authorId).select("privateAccount followers isPrivate").lean();
  if (!author) {
    return false;
  }

  if (requestingUser.isAdmin) {
    return true;
  }

  if (author.privateAccount) {
    const isFollower = author.followers && author.followers.some((id) => id.toString() === currentUserId.toString());
    if (!isFollower) {
      return false;
    }
  }

  return true;
};

module.exports = {
  canInteractWithContent
};