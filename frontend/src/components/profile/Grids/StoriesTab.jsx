import React from "react";
import { Activity, Eye, Trash2 } from "lucide-react";

export const StoriesTab = ({
  userStories,
  handleOpenStory,
  isOwnProfile,
  storiesLoading,
  setShowDeleteStoryModal,
  setStoryToDelete,
}) => {
  if (storiesLoading && userStories.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-[9/16] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
          />
        ))}
      </div>
    );
  }

  if (userStories.length === 0) {
    return (
      <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
          <div className="absolute inset-0 bg-pink-500/5 rounded-full blur-xl animate-pulse" />
          <Activity className="w-10 h-10 text-slate-300 relative z-10" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          No Stories
        </h3>
        <p className="text-[13px] text-slate-500 font-medium">
          You don't have any active stories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
      {userStories.map((story, index) => (
        <div
          key={story._id}
          className="relative group cursor-pointer"
          onClick={() => handleOpenStory(index)}
        >
          <div className="aspect-[9/16] bg-slate-100 rounded-3xl overflow-hidden relative shadow-sm">
            {story.mediaType === "video" ? (
              <video
                src={`${story.media || story.mediaUrl}#t=0.1`}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                loading="lazy"
                src={story.media || story.mediaUrl}
                alt="Story update"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            
            {/* View Count overlay */}
            <div className="absolute bottom-3 left-3 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-black tracking-wider flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{story.viewers?.length || 0}</span>
            </div>

            {/* Delete button for own stories */}
            {isOwnProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryToDelete(story);
                  setShowDeleteStoryModal(true);
                }}
                className="absolute top-3 right-3 bg-black/45 hover:bg-rose-600/80 p-2 rounded-full backdrop-blur-md text-white transition-all z-20 scale-90 md:scale-100"
                title="Delete Dispatch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoriesTab;
