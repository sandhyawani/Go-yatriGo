import React from "react";
import { Loader2, Sparkles } from "lucide-react";

const LikeButton = ({ post, hasFelt, feltLoadingMap, handleFelt }) => {
  const likesCount = post.likes?.length ?? 0;

  return (
    <button
      type="button"
      onClick={() => handleFelt(post._id)}
      disabled={feltLoadingMap[post._id]}
      aria-label={hasFelt ? "Remove Felt" : "Felt this travel memory"}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all duration-300 active:scale-75 hover:scale-[1.03] sm:px-3
        ${hasFelt ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"}
        ${feltLoadingMap[post._id] ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      {feltLoadingMap[post._id] ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles
          className={`h-4 w-4 transition-transform duration-300 ${
            hasFelt ? "fill-[#7C3AED] text-[#7C3AED] scale-110" : "text-slate-400"
          }`}
        />
      )}
      <span>Felt</span>
      {likesCount > 0 && <span className="font-semibold">{likesCount}</span>}
    </button>
  );
};

export default React.memo(LikeButton);
