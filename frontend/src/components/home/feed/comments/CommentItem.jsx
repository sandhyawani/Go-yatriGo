import React from "react";
import { Trash2 } from "lucide-react";
import { renderClickableText } from "../utils/feedHelpers";

const CommentItem = ({ comment, myUserId, isCreator, postId, handleDeleteComment }) => {
  const canDelete =
    ((comment.userId?._id || comment.userId)?.toString() === myUserId) || isCreator;

  return (
    <div className="group/comment relative pr-7 text-xs leading-relaxed">
      <span className="mr-2 font-semibold text-slate-800">
        {comment.userName}
      </span>

      <span className="break-words text-slate-600">
        {renderClickableText(comment.text)}
      </span>

      {canDelete && (
        <button
          type="button"
          aria-label="Delete comment"
          onClick={() => handleDeleteComment(postId, comment._id)}
          className="absolute right-0 top-0 p-1 text-slate-400 opacity-0 transition-all hover:text-rose-500 group-hover/comment:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default React.memo(CommentItem);
