import React from "react";
import { Share2 } from "lucide-react";

const ShareButton = ({ post, handleDispatch }) => {
  const postId = (post?._id || post?.id)?.toString();

  return (
    <button
      type="button"
      onClick={() => postId && handleDispatch && handleDispatch(postId)}
      aria-label="Share travel memory"
      className="flex items-center gap-1 sm:gap-1.5 rounded-xl px-2 py-1.5 text-[11px] sm:text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-amber-800 active:scale-95 sm:px-3 whitespace-nowrap shrink-0"
    >
      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
      <span>Share</span>
    </button>
  );
};

export default React.memo(ShareButton);
