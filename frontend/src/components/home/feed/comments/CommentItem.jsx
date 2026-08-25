import React from "react";
import { Trash2 } from "lucide-react";
import moment from "moment";
import { renderClickableText } from "../utils/feedHelpers";

const CommentItem = ({
  comment,
  myUserId,
  isCreator,
  postId,
  handleDeleteComment,
}) => {
  const commentAuthorId = (
    comment.userId?._id ||
    comment.userId ||
    comment.user?._id ||
    comment.user
  )?.toString();

  const canDelete = Boolean(
    (commentAuthorId && myUserId && commentAuthorId === myUserId) || isCreator
  );

  const userName =
    comment.userName ||
    comment.userId?.name ||
    comment.userId?.username ||
    comment.user?.name ||
    "Traveler";

  const userPic =
    comment.userPic ||
    comment.userId?.pic ||
    comment.userId?.avatar ||
    comment.userId?.img ||
    comment.user?.pic;

  const timestamp = comment.createdAt
    ? moment(comment.createdAt).fromNow()
    : "";

  return (
    <div className="group/comment relative flex items-start gap-2.5 py-1.5 text-xs leading-relaxed">
      <img
        src={
          userPic ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userName
          )}&background=7C3AED&color=fff&bold=true`
        }
        alt={userName}
        className="h-6 w-6 shrink-0 rounded-full object-cover border border-slate-100 mt-0.5"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userName
          )}&background=7C3AED&color=fff&bold=true`;
        }}
      />

      <div className="min-w-0 flex-1 pr-6">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-slate-800">{userName}</span>
          {timestamp && (
            <span className="text-[10px] text-slate-400 font-normal">
              {timestamp}
            </span>
          )}
        </div>

        <div className="break-words text-slate-600 mt-0.5">
          {renderClickableText(comment.text)}
        </div>
      </div>

      {canDelete && (
        <button
          type="button"
          aria-label="Delete comment"
          onClick={() => handleDeleteComment(postId, comment._id || comment.id)}
          className="absolute right-0 top-1.5 p-1 text-slate-400 opacity-0 transition-all hover:text-rose-500 group-hover/comment:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default React.memo(CommentItem);
