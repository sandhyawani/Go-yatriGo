import React from "react";
import { Loader2, Sparkles } from "lucide-react";

const LikeButton = ({ post, hasFelt, feltLoadingMap = {}, handleFelt }) => {
  const postId = (post?._id || post?.id)?.toString();
  const likesCount = (Array.isArray(post?.likes) ? post.likes.length : post?.likesCount) ?? 0;
  const isLoading = Boolean(postId && feltLoadingMap[postId]);

  return (
    <button
      type="button"
      onClick={() => postId && handleFelt && handleFelt(postId)}
      disabled={isLoading}
      aria-label={hasFelt ? "Remove Felt" : "Felt this travel memory"}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 hover:scale-[1.02] sm:px-3
        ${
          hasFelt
            ? "bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs"
            : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
        }
        ${isLoading ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
      ) : (
        <Sparkles
          className={`h-4 w-4 transition-transform duration-300 ${
            hasFelt ? "fill-amber-500 text-amber-500 scale-110" : "text-slate-400"
          }`}
        />
      )}
      <span>Felt</span>
      {likesCount > 0 && (
        <span
          className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
            hasFelt ? "bg-amber-200/80 text-amber-950" : "bg-slate-200/70 text-slate-700"
          }`}
        >
          {likesCount}
        </span>
      )}
    </button>
  );
};

export default React.memo(LikeButton);
