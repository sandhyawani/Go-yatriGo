import React from "react";
import { Trash2, Loader2, Send } from "lucide-react";
import { getAvatarUrl } from "../../../utils/avatar";

export const CommentSection = ({
  post,
  myUserId,
  isCreator,
  activeCommentPost,
  visibleComments,
  previewComments,
  visibleCommentsCount,
  handleDeleteComment,
  handleOpenComments,
  handleCommentSubmit,
  commentText,
  setCommentText,
  isSubmittingComment,
  user,
  handleAvatarError,
  commentsLoadingMap,
}) => {
  const currentComments = activeCommentPost === post._id ? visibleComments : previewComments;

  return (
    <>
      {currentComments.length > 0 && (
        <>
          {/* Divider */}
          <div className="mt-3 border-t border-slate-100" />

          {/* Comments list */}
          <div className="mt-3 space-y-2 pl-1">
            {currentComments.map((comment) => (
              <div key={comment._id} className="text-[14px] group relative pr-6 leading-tight">
                <span className="font-semibold text-slate-800 mr-1.5">
                  {comment.userName}
                </span>
                <span className="text-slate-600 break-words">{comment.text}</span>
                {((comment.userId?._id || comment.userId)?.toString() === myUserId || isCreator) && (
                  <button
                    onClick={() => handleDeleteComment(post._id, comment._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity absolute right-0 top-0 -mt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {commentsLoadingMap?.[post._id] && (
        <div className="flex justify-center my-2">
          <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
        </div>
      )}

      {visibleCommentsCount > previewComments.length && activeCommentPost !== post._id && (
        <button
          onClick={() => handleOpenComments(post._id)}
          className="text-sm font-semibold text-slate-400 hover:text-[#7C3AED] mt-2 pl-1 block transition-colors"
        >
          View all {visibleCommentsCount} Thoughts
        </button>
      )}

      {/* Comment Form Input */}
      <form
        onSubmit={(e) => handleCommentSubmit(e, post._id)}
        className="flex items-center gap-2.5 pt-3 mt-3 border-t border-[#94a3b81f]"
      >
        <img
          loading="lazy"
          src={getAvatarUrl(user, user?.name)}
          alt="Your avatar"
          className="w-7 h-7 rounded-full object-cover shrink-0"
          onError={(e) => handleAvatarError(e, user?.name)}
        />
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={commentText[post._id] || ""}
            onChange={(e) =>
              setCommentText((prev) => ({
                ...prev,
                [post._id]: e.target.value,
              }))
            }
            placeholder="Share your thoughts..."
            maxLength={500}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-full pl-4 pr-10 py-2 text-xs text-[#111827] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#7C3AED]/50 focus:bg-white dark:focus:bg-slate-800 focus:shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={isSubmittingComment[post._id] || !commentText[post._id]?.trim()}
            aria-label="Post comment"
            className="absolute right-1 p-1.5 bg-gradient-to-r from-violet-500 to-[#7C3AED] text-white rounded-full active:scale-90 transition-all disabled:opacity-0 disabled:scale-75 disabled:pointer-events-none shadow-sm"
          >
            {isSubmittingComment[post._id] ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3 -ml-0.5 mt-0.5" />
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default CommentSection;
