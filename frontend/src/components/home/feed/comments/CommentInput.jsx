import React from "react";
import { Loader2, Send } from "lucide-react";
import Avatar from "../../../common/Avatar";

const CommentInput = ({
  post,
  user,
  commentText,
  setCommentText,
  isSubmittingComment,
  handleCommentSubmit,
}) => {
  return (
    <form
      onSubmit={(event) => handleCommentSubmit(event, post._id)}
      className="mt-2 flex items-center gap-2.5 border-t border-slate-100 pt-2"
    >
      <Avatar
        user={user}
        pic={user?.pic || user?.profilePic}
        img={user?.img}
        name={user?.name}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />

      <div className="relative flex flex-1 items-center">
        <input
          type="text"
          value={commentText[post._id] || ""}
          onChange={(event) =>
            setCommentText((previous) => ({
              ...previous,
              [post._id]: event.target.value,
            }))
          }
          placeholder="Share your travel thought..."
          maxLength={500}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />

        <button
          type="submit"
          disabled={isSubmittingComment[post._id] || !commentText[post._id]?.trim()}
          aria-label="Share thought"
          className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-all duration-200 hover:bg-brand-700 active:scale-90 disabled:pointer-events-none disabled:scale-75 disabled:opacity-0"
        >
          {isSubmittingComment[post._id] ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </form>
  );
};

export default React.memo(CommentInput);
