const User = require("../models/User");

const canInteractWithContent = async (authorId, requestingUser) => {
  if (!authorId || !requestingUser) return false;

  const currentUserId = requestingUser._id || requestingUser.id;

  if (authorId.toString() === currentUserId.toString()) {
    return true;
  }

  const author = await User.findById(authorId).select("privateAccount followers blockedUsers").lean();
  if (!author) {
    return false;
  }

  if (author.blockedUsers && author.blockedUsers.some((id) => id.toString() === currentUserId.toString())) {
    return false;
  }

  if (requestingUser.blockedUsers && requestingUser.blockedUsers.some((id) => id.toString() === authorId.toString())) {
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