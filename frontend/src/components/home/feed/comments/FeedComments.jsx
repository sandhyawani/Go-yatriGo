import React from "react";
import { Loader2 } from "lucide-react";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";

const FeedComments = ({
  post,
  user,
  myUserId,
  isCreator,
  displayedComments,
  previewComments,
  visibleCommentsCount,
  activeCommentPost,
  commentsLoadingMap,
  commentText,
  setCommentText,
  isSubmittingComment,
  handleOpenComments,
  handleDeleteComment,
  handleCommentSubmit,
}) => {
  return (
    <>
      <CommentList
        comments={displayedComments}
        myUserId={myUserId}
        isCreator={isCreator}
        postId={post._id}
        handleDeleteComment={handleDeleteComment}
      />

      {commentsLoadingMap[post._id] && (
        <div className="my-2 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        </div>
      )}

      {visibleCommentsCount > previewComments.length &&
        activeCommentPost !== post._id &&
        !commentsLoadingMap[post._id] && (
          <button
            type="button"
            onClick={() => handleOpenComments(post._id)}
            className="mt-2 block px-1 text-xs font-semibold text-slate-400 transition-colors hover:text-brand-600"
          >
            View all {visibleCommentsCount} Thoughts
          </button>
        )}

      <CommentInput
        post={post}
        user={user}
        commentText={commentText}
        setCommentText={setCommentText}
        isSubmittingComment={isSubmittingComment}
        handleCommentSubmit={handleCommentSubmit}
      />
    </>
  );
};

export default React.memo(FeedComments);
