import React from "react";
import { Bookmark, Play } from "lucide-react";

export const SavedTab = ({
  savedPosts,
  savedLoading,
  setSelectedMemory,
}) => {
  if (savedLoading && savedPosts.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
          />
        ))}
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
          <div className="absolute inset-0 bg-[#6C4DF6]/5 rounded-full blur-xl animate-pulse" />
          <Bookmark className="w-10 h-10 text-slate-300 relative z-10" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          No Saved Posts
        </h3>
        <p className="text-[13px] text-slate-500 font-medium">
          When you bookmark memories on the explore feed, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
      {savedPosts.map((post) => (
        <div key={post._id} className="relative group">
          <div
            className="aspect-square bg-slate-100 rounded-3xl overflow-hidden relative shadow-sm cursor-pointer"
            onClick={() => setSelectedMemory(post)}
          >
            {post.mediaType === "video" ||
            (post.image || post.mediaUrl || post.mediaUrls?.[0] || "").match(/\.(mp4|webm|mov)$/i) ? (
              <div className="relative w-full h-full">
                <video
                  src={`${post.image || post.mediaUrl || post.mediaUrls?.[0]}#t=0.1`}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-lg backdrop-blur-sm z-10">
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              </div>
            ) : (
              <img
                loading="lazy"
                src={post.image || post.mediaUrl || post.mediaUrls?.[0]}
                alt={post.title || "Saved Post"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop";
                }}
              />
            )}
            
            {/* Hover statistics overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 z-10 text-white font-bold text-sm">
              <span className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                ✨ {post.likes?.length || 0}
              </span>
              <span className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                💭 {post.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedTab;
