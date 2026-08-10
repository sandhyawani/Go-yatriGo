export const getAllComments = (post) => {
  return Array.isArray(post?.comments) ? post.comments : [];
};

export const getVisibleComments = (post) => {
  return getAllComments(post).filter(
    (comment) => !comment.hidden && !comment.deleted
  );
};

export const getPreviewComments = (post) => {
  return getVisibleComments(post).slice(-3);
};

export const getTotalCommentCount = (post) => {
  if (post.commentsCount !== undefined) return post.commentsCount;
  return getAllComments(post).filter((comment) => !comment.deleted).length;
};

export const getVisibleCommentCount = (post) => {
  return getVisibleComments(post).length;
};
