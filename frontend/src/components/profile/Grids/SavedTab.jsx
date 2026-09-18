import React from "react";
import { Bookmark, Sparkles, MessageCircle } from "lucide-react";
import { toHttps } from "../../../utils/toHttps";

export const SavedTab = ({
  savedMemories = [],
  savedPosts,
  savedLoading,
  setSelectedMemory,
}) => {
  const memoriesList = savedMemories.length > 0 ? savedMemories : (savedPosts || []);

  if (savedLoading && memoriesList.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square bg-secondary-100 animate-pulse rounded-2xl border border-border"
          />
        ))}
      </div>
    );
  }

  if (memoriesList.length === 0) {
    return (
      <div className="bg-surface/50 border border-border rounded-3xl p-10 sm:p-14 text-center select-none shadow-sm">
        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-sm border border-border">
          <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-xl animate-pulse" />
          <Bookmark className="w-8 h-8 text-muted relative z-10" />
        </div>
        <h3 className="text-sm font-bold text-dark mb-1">
          No Saved Memories
        </h3>
        <p className="text-[13px] text-muted font-medium">
          Travel memories you bookmark will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {memoriesList.map((memory) => (
        <div
          key={memory._id}
          className="aspect-square bg-secondary-100 rounded-2xl overflow-hidden relative shadow-sm cursor-pointer group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          onClick={() => setSelectedMemory(memory)}
        >
          <img
            loading="lazy"
            src={toHttps(memory.image || memory.mediaUrl || memory.mediaUrls?.[0])}
            alt={memory.title || "Saved Memory"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 z-10 text-white font-bold text-sm select-none pointer-events-none backdrop-blur-[2px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-warning fill-warning" />{" "}
              {memory.likes?.length || memory.likesCount || 0}
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <MessageCircle className="w-4 h-4 fill-white" />{" "}
              {memory.comments?.length || memory.commentsCount || 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedTab;
