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
  commentsErrorMap,
  commentText,
  setCommentText,
  isSubmittingComment,
  handleOpenComments,
  handleDeleteComment,
  handleCommentSubmit,
}) => {
  const postId = (post?._id || post?.id)?.toString();
  const isThoughtsOpen = activeCommentPost === postId;
  const isLoading = Boolean(commentsLoadingMap?.[postId]);
  const errorMessage = commentsErrorMap?.[postId];
  const hasComments = Array.isArray(displayedComments) && displayedComments.length > 0;

  return (
    <div className="mt-1">
      <CommentList
        comments={displayedComments}
        myUserId={myUserId}
        isCreator={isCreator}
        postId={postId}
        handleDeleteComment={handleDeleteComment}
      />

      {isLoading && (
        <div className="my-2 flex items-center justify-center gap-2 py-1.5 text-xs text-brand-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">Loading thoughts...</span>
        </div>
      )}

      {isThoughtsOpen && !isLoading && errorMessage && (
        <div className="my-2 flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => handleOpenComments(postId)}
            className="font-bold underline transition-colors hover:text-amber-950"
          >
            Retry
          </button>
        </div>
      )}

      {isThoughtsOpen && !isLoading && !errorMessage && !hasComments && (
        <div className="my-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-center text-xs text-slate-500">
          No thoughts yet. Share your thoughts on this travel memory!
        </div>
      )}

      {isThoughtsOpen && !isLoading && (
        <button
          type="button"
          onClick={() => handleOpenComments(postId)}
          className="mt-1.5 block px-1 text-xs font-semibold text-slate-400 transition-colors hover:text-amber-700"
        >
          Hide Thoughts
        </button>
      )}

      {!isThoughtsOpen &&
        visibleCommentsCount > previewComments.length &&
        !isLoading && (
          <button
            type="button"
            onClick={() => handleOpenComments(postId)}
            className="mt-2 block px-1 text-xs font-semibold text-slate-400 transition-colors hover:text-amber-700"
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
    </div>
  );
};

export default React.memo(FeedComments);
