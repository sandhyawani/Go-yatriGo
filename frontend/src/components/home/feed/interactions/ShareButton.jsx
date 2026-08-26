import React from "react";
import { Share2 } from "lucide-react";

const ShareButton = ({ post, handleDispatch }) => {
  return (
    <button
      type="button"
      onClick={() => handleDispatch(post._id)}
      aria-label="Share travel memory"
      className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-white hover:text-brand-700 hover:scale-[1.03] active:scale-95"
    >
      <Share2 className="h-4 w-4" />
      Share
    </button>
  );
};

export default React.memo(ShareButton);
