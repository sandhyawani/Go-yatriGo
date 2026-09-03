import React from "react";
import { renderClickableText } from "../utils/feedHelpers";

const FeedCaption = ({ post }) => {
  if (!post.caption && !post.title) return null;

  return (
    <div className="px-1 pt-1 pb-2 sm:px-2">
      {post.title && (
        <h4 className="text-[14px] font-bold text-slate-900 mb-1 font-heading">
          {post.title}
        </h4>
      )}
      <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-slate-700/90 font-sans">
        <span className="text-amber-500/80 font-serif text-base mr-1 select-none">“</span>
        {renderClickableText(post.caption || post.title)}
        <span className="text-amber-500/80 font-serif text-base ml-1 select-none">”</span>
      </p>
    </div>
  );
};

export default React.memo(FeedCaption);
