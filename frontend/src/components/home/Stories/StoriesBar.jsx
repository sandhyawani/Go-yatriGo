import React from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getAvatarUrl } from "../../../utils/avatar";
import StorySkeleton from "./StorySkeleton";

export const StoriesBar = ({
  user,
  myUserId,
  myStoryGroup,
  sortedStories,
  loadingStories,
  onlineUsersMap,
  scrollStories,
  storyContainerRef,
  setActiveStoryGroup,
  setActiveStoryIndex,
  setShowStoryModal,
  handleAvatarError,
}) => {
  return (
    <div className="relative group/storybar w-full max-w-full min-w-0">
      <button
        aria-label="Scroll left"
        onClick={() => scrollStories(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => scrollStories(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div
        ref={storyContainerRef}
        className="w-full max-w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-3xl py-2.5 px-3 sm:py-3 sm:px-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory select-none transition-colors duration-300 scroll-smooth"
      >
        {/* My story */}
        <div className="flex flex-col shrink-0">
          {myStoryGroup ? (
            <div
              onClick={() => {
                setActiveStoryGroup(myStoryGroup);
                setActiveStoryIndex(0);
              }}
              className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group"
            >
              {myStoryGroup.stories[0]?.mediaType === "video" ? (
                <video
                  src={`${myStoryGroup.stories[0]?.media}#t=0.1`}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  loading="lazy"
                  src={
                    myStoryGroup.stories[0]?.media ||
                    myStoryGroup.stories[0]?.mediaUrl ||
                    myStoryGroup.stories[0]?.image ||
                    getAvatarUrl(user, user?.name)
                  }
                  alt="Your story"
                  className="w-full h-full object-cover"
                  onError={(e) => handleAvatarError(e, user?.name)}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500">
                <img
                  loading="lazy"
                  src={getAvatarUrl(user, user?.name)}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                  onError={(e) => handleAvatarError(e, user?.name)}
                  alt=""
                />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStoryModal(true);
                }}
                className="absolute bottom-2 left-2 right-2 flex justify-between items-end"
              >
                <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                  My Story
                </span>
                <div className="w-5 h-5 bg-[#6C4DF6] rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-[#5b3ee0] transition-colors shrink-0">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowStoryModal(true)}
              className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group shrink-0"
            >
              <img
                loading="lazy"
                src={getAvatarUrl(user, user?.name)}
                alt="Your story"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                onError={(e) => handleAvatarError(e, user?.name)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center justify-center gap-1.5">
                <div className="w-7 h-7 bg-[#6C4DF6] rounded-full flex items-center justify-center border-[2px] border-white shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  My Story
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Others' stories */}
        {loadingStories
          ? [1, 2, 3].map((i) => <StorySkeleton key={i} />)
          : sortedStories.map((group) => {
              const hasUnviewed = group.stories?.some(
                (s) => !s.viewedBy?.includes(myUserId)
              );
              return (
                <div
                  key={group.userId}
                  onClick={() => {
                    setActiveStoryGroup(group);
                    setActiveStoryIndex(0);
                  }}
                  className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group shrink-0"
                >
                  {group.stories[0]?.media ||
                  group.stories[0]?.mediaUrl ||
                  group.stories[0]?.image ? (
                    group.stories[0]?.mediaType === "video" ? (
                      <video
                        src={`${group.stories[0]?.media}#t=0.1`}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        loading="lazy"
                        src={
                          group.stories[0].media ||
                          group.stories[0].mediaUrl ||
                          group.stories[0].image
                        }
                        alt={group.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#6C4DF6]/80 to-purple-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div
                    className={`absolute top-2 left-2 w-8 h-8 rounded-full p-[2px] ${
                      hasUnviewed
                        ? "bg-gradient-to-tr from-pink-500 to-purple-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <img
                      loading="lazy"
                      src={getAvatarUrl(
                        group.userPic,
                        group.userImg,
                        group.userName
                      )}
                      alt={group.userName}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                      onError={(e) => handleAvatarError(e, group.userName)}
                    />
                  </div>
                  {onlineUsersMap[group.userId] && (
                    <div
                      className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
                      title="Online"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white truncate drop-shadow-md">
                    {group.userName.split(" ")[0]}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default StoriesBar;
