import React from "react";
import { Sparkles } from "lucide-react";
import { renderClickableText } from "../utils/feedHelpers";

const FeedCaption = ({ post }) => {
  if (!post.caption && !post.title) return null;

  return (
    <div className="px-1 pb-2">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-brand-600">
            Explorer Log
          </p>

          <p className="text-[13px] leading-relaxed text-slate-700">
            {renderClickableText(post.caption || post.title)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedCaption);
