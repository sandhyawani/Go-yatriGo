import React, { useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const StorySkeleton = () => (
  <div className="flex flex-col items-center gap-2 shrink-0">
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full skeleton-shimmer" />
    <div className="w-12 h-2.5 rounded-full skeleton-shimmer" />
  </div>
);

const DispatchBar = ({
  user,
  myUserId,
  dispatches,
  myStoryGroup,
  sortedStories,
  loadingStories,
  onlineUsersMap,
  setActiveStoryGroup,
  setActiveStoryIndex,
  setShowStoryModal,
  handleAvatarError,
}) => {
  const storyContainerRef = useRef(null);

  const scrollStories = useCallback((direction) => {
    if (storyContainerRef.current) {
      const scrollAmount = 320;
      storyContainerRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);



  return (
    <div className="relative group/storybar w-full max-w-full min-w-0">
      <button
        aria-label="Scroll left"
        onClick={() => scrollStories(-1)}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md z-20 hidden lg:group-hover/storybar:flex items-center justify-center text-text-secondary hover:text-text-primary hover:scale-105 transition-all border border-border-default cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => scrollStories(1)}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full shadow-md z-20 hidden lg:group-hover/storybar:flex items-center justify-center text-text-secondary hover:text-text-primary hover:scale-105 transition-all border border-border-default cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div
        ref={storyContainerRef}
        className="w-full max-w-full bg-surface border border-border-default rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs flex items-center gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory select-none scroll-smooth relative"
      >
        {/* User's Story Trigger */}
        <div className="flex flex-col items-center shrink-0 relative z-10 gap-1.5">
          {myStoryGroup ? (
            <div
              onClick={() => {
                setActiveStoryGroup(myStoryGroup);
                setActiveStoryIndex(0);
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-xs group p-0.5 bg-gradient-to-tr from-brand via-brand-400 to-emerald-200 flex items-center justify-center"
            >
              <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-surface bg-secondary-100">
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
                    alt="Your moment"
                    className="w-full h-full object-cover"
                    onError={(e) => handleAvatarError(e, user?.name)}
                  />
                )}
                <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStoryModal(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-brand rounded-full flex items-center justify-center border-2 border-surface shadow-sm hover:bg-brand-dark transition-colors z-20 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowStoryModal(true)}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-xs group border-2 border-dashed border-brand-300 hover:border-brand flex items-center justify-center p-0.5 bg-brand-50/50"
            >
              <div className="w-full h-full rounded-full overflow-hidden relative bg-surface border border-border flex items-center justify-center">
                <img
                  loading="lazy"
                  src={getAvatarUrl(user, user?.name)}
                  alt="Your moment"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => handleAvatarError(e, user?.name)}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-brand rounded-full flex items-center justify-center border-2 border-surface shadow-sm hover:scale-110 transition-transform z-20">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          <span className="text-[11px] font-bold text-text-secondary tracking-tight">
            Your Moment
          </span>
        </div>

        {/* Stories List */}
        {loadingStories
          ? [1, 2, 3, 4].map((i) => <StorySkeleton key={i} />)
          : sortedStories.length > 0
          ? sortedStories.map((group) => {
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
                  className="flex flex-col items-center relative cursor-pointer hover:scale-105 transition-all duration-300 ease-spring active:scale-95 group shrink-0 z-10 gap-1.5"
                >
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center p-0.5 shadow-2xs relative transition-all duration-300 ${
                      hasUnviewed
                        ? "bg-gradient-to-tr from-brand via-brand-400 to-emerald-200 hover:shadow-[0_0_16px_rgba(2,132,199,0.35)]"
                        : "bg-secondary-200"
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-surface bg-secondary-100">
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
                        <div className="w-full h-full bg-secondary-100 flex items-center justify-center">
                          <img
                            loading="lazy"
                            src={getAvatarUrl(
                              group.userPic,
                              group.userImg,
                              group.userName
                            )}
                            alt={group.userName}
                            className="w-8 h-8 rounded-full object-cover opacity-60"
                            onError={(e) => handleAvatarError(e, group.userName)}
                          />
                        </div>
                      )}

                      {!hasUnviewed && (
                        <div className="absolute inset-0 bg-white/30" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center max-w-[76px]">
                    <span
                      className={`text-[11px] font-bold tracking-tight truncate w-full text-center font-heading ${
                        hasUnviewed ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      {group.userName.split(" ")[0]}
                    </span>
                    {(() => {
                      const firstStory = group.stories[0];
                      const location =
                        firstStory?.journeyId?.destination ||
                        firstStory?.journeyId?.title ||
                        firstStory?.location;
                      if (location) {
                        return (
                          <span className="text-[9px] font-semibold text-brand uppercase tracking-wide truncate w-full text-center font-sans">
                            {location.split(",")[0].trim()}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })
          : (
            <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-border-default/60 my-auto select-none">
              <span className="text-xs font-medium text-text-muted">
                No moments yet
              </span>
            </div>
          )}
      </div>
    </div>
  );
};

export default DispatchBar;