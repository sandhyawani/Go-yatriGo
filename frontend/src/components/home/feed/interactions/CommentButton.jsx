import React from "react";
import { MessageCircle } from "lucide-react";

const CommentButton = ({ post, totalCommentsCount, handleOpenComments }) => {
  return (
    <button
      type="button"
      onClick={() => handleOpenComments(post._id)}
      aria-label="Add Thoughts"
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900 active:scale-95 sm:px-3"
    >
      <MessageCircle className="h-4 w-4 text-slate-400" />
      <span>Thoughts</span>
      {totalCommentsCount > 0 && (
        <span className="ml-0.5 rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700">
          {totalCommentsCount}
        </span>
      )}
    </button>
  );
};

export default React.memo(CommentButton);
