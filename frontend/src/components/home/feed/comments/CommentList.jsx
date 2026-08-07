import React from "react";
import CommentItem from "./CommentItem";

const CommentList = ({ comments, myUserId, isCreator, postId, handleDeleteComment }) => {
  if (!comments.length) return null;

  return (
    <>
      <div className="mt-3 border-t border-slate-100" />
      <div className="mt-2 space-y-1.5 px-1">
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
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
