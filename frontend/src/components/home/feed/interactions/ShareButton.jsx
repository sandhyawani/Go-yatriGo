import React from "react";
import { Share2 } from "lucide-react";

const ShareButton = ({ post, handleDispatch }) => {
  const postId = (post?._id || post?.id)?.toString();

  return (
    <button
      type="button"
      onClick={() => postId && handleDispatch && handleDispatch(postId)}
      aria-label="Share travel memory"
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-amber-800 active:scale-95 sm:px-3"
    >
      <Share2 className="h-4 w-4 text-slate-400" />
      <span>Share</span>
    </button>
  );
};

export default React.memo(ShareButton);
