import React from "react";
import { MessageCircle } from "lucide-react";

const CommentButton = ({ post, totalCommentsCount, handleOpenComments }) => {
  return (
    <button
      type="button"
      onClick={() => handleOpenComments(post._id)}
      aria-label="Add Thoughts"
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900 hover:scale-[1.03] active:scale-95 sm:px-3"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden xs:inline">Thoughts</span>
      {totalCommentsCount > 0 && <span className="font-semibold">{totalCommentsCount}</span>}
    </button>
  );
};

export default React.memo(CommentButton);
