import React from "react";
import CommentItem from "./CommentItem";

const CommentList = ({
  comments,
  myUserId,
  isCreator,
  postId,
  handleDeleteComment,
}) => {
  if (!Array.isArray(comments) || !comments.length) return null;

  const isScrollable = comments.length > 3;

  return (
    <>
      <div className="mt-3 border-t border-slate-100" />
      <div
        className={`mt-2 space-y-1.5 px-1 w-full min-w-0 ${
          isScrollable
            ? "max-h-[220px] overflow-y-auto overscroll-contain pr-1.5 sm:pr-2 scrollbar-thin"
            : ""
        }`}
      >
        {comments.map((comment, index) => (
          <CommentItem
            key={comment._id || comment.id || `${postId}-comment-${index}`}
            comment={comment}
            myUserId={myUserId}
            isCreator={isCreator}
            postId={postId}
            handleDeleteComment={handleDeleteComment}
          />
        ))}
      </div>
    </>
  );
};

export default React.memo(CommentList);
