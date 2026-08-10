export const isPostCreator = (post, myUserId) => {
  if (!post || !myUserId) return false;
  return (post.userId?._id || post.userId)?.toString() === myUserId;
};
