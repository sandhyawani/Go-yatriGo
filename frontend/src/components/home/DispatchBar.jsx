import React, { useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const StorySkeleton = () =>
<div className="w-20 h-20 rounded-full bg-slate-100 relative overflow-hidden shrink-0 animate-pulse border-2 border-slate-200">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
  </div>;


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
  handleAvatarError
}) => {
  const storyContainerRef = useRef(null);

  const scrollStories = useCallback((direction) => {
    if (storyContainerRef.current) {
      const scrollAmount = 300;
      storyContainerRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
      });
    }
  }, []);

  return (
    <div className="relative group/storybar w-full max-w-full min-w-0">
      <button
      aria-label="Scroll left"
      onClick={() => scrollStories(-1)}
      className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-7 h-7 bg-white rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">

        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
      aria-label="Scroll right"
      onClick={() => scrollStories(1)}
      className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-7 h-7 bg-white rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">

        <ChevronRight className="w-4 h-4" />
      </button>

      <div
      ref={storyContainerRef}
      className="w-full max-w-full bg-white border border-slate-200/60 rounded-3xl py-4 pl-2 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory select-none scroll-smooth relative">

        {}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%237C3AED' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

        {}
        <div className="flex flex-col items-center shrink-0 relative z-10 gap-2">
          {myStoryGroup ?
          <div
          onClick={() => {
            setActiveStoryGroup(myStoryGroup);
            setActiveStoryIndex(0);
          }}
          className="w-20 h-20 rounded-full overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group border-[3px] border-[#7C3AED]/40 flex items-center justify-center p-1 bg-white">

              <div className="w-full h-full rounded-full overflow-hidden relative">
                {myStoryGroup.stories[0]?.mediaType === "video" ?
              <video
              src={`${myStoryGroup.stories[0]?.media}#t=0.1`}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata" /> :


              <img
              loading="lazy"
              src={
              myStoryGroup.stories[0]?.media ||
              myStoryGroup.stories[0]?.mediaUrl ||
              myStoryGroup.stories[0]?.image ||
              getAvatarUrl(user, user?.name)}

              alt="Your story"
              className="w-full h-full object-cover"
              onError={(e) => handleAvatarError(e, user?.name)} />}


                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div
            onClick={(e) => {
              e.stopPropagation();
              setShowStoryModal(true);
            }}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-purple-700 transition-colors z-20">

                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div> :

          <div
          onClick={() => setShowStoryModal(true)}
          className="w-20 h-20 rounded-full relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group border-[3px] border-slate-200 flex items-center justify-center p-1 bg-slate-50">

              <div className="w-full h-full rounded-full overflow-hidden">
                <img
              loading="lazy"
              src={getAvatarUrl(user, user?.name)}
              alt="Your story"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              onError={(e) => handleAvatarError(e, user?.name)} />

              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center border-2 border-white shadow-md hover:scale-110 transition-transform z-20">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div>}

          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
            My Dispatch
          </span>
        </div>

        {}
        {loadingStories ?
        [1, 2, 3].map((i) => <StorySkeleton key={i} />) :
        sortedStories.length > 0 ?
        sortedStories.map((group, index) => {
          const hasUnviewed = group.stories?.some(
          (s) => !s.viewedBy?.includes(myUserId)
          );


          const rotations = ['rotate-0', 'rotate-[-3deg]', 'rotate-[3deg]', 'rotate-[-6deg]', 'rotate-[6deg]'];
          const rotClass = rotations[index % 5];

          return (
            <div
            key={group.userId}
            onClick={() => {
              setActiveStoryGroup(group);
              setActiveStoryIndex(0);
            }}
            className={`flex flex-col items-center relative cursor-pointer hover:scale-105 transition-all duration-300 group shrink-0 z-10 gap-2 ${rotClass}`}>

                  <div className={`w-20 h-20 rounded-full flex items-center justify-center p-1 bg-white shadow-sm relative 
                    ${hasUnviewed ? 'border-[3px] border-double border-[#7C3AED]' : 'border-2 border-solid border-slate-200'}`}>
                    
                    {}
                    <div className="absolute -inset-1 border border-[#7C3AED]/20 rounded-full pointer-events-none transform rotate-12 scale-105" />
                    
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      {group.stories[0]?.media ||
                  group.stories[0]?.mediaUrl ||
                  group.stories[0]?.image ?
                  group.stories[0]?.mediaType === "video" ?
                  <video
                  src={`${group.stories[0]?.media}#t=0.1`}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata" /> :


                  <img
                  loading="lazy"
                  src={
                  group.stories[0].media ||
                  group.stories[0].mediaUrl ||
                  group.stories[0].image}

                  alt={group.userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }} /> :



                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <img
                    loading="lazy"
                    src={getAvatarUrl(
                    group.userPic,
                    group.userImg,
                    group.userName
                    )}
                    alt={group.userName}
                    className="w-8 h-8 rounded-full object-cover opacity-50"
                    onError={(e) => handleAvatarError(e, group.userName)} />

                        </div>}

                      {}
                      {!hasUnviewed && <div className="absolute inset-0 bg-white/40" />}
                    </div>

                    {}
                    <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-[1px] bg-white shadow-md border border-slate-100 z-20">

                      <img
                  loading="lazy"
                  src={getAvatarUrl(
                  group.userPic,
                  group.userImg,
                  group.userName
                  )}
                  alt={group.userName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) =>
                  handleAvatarError(e, group.userName)} />


                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-black uppercase tracking-wider truncate max-w-[80px] text-center ${hasUnviewed ? 'text-slate-800' : 'text-slate-500'}`}>
                      {group.userName.split(" ")[0]}
                    </span>
                    {(() => {
                  const firstStory = group.stories[0];
                  const location = firstStory?.journeyId?.destination || firstStory?.journeyId?.title || firstStory?.location;
                  if (location) {
                    return (
                      <span className="text-[8px] font-bold text-[#7C3AED] uppercase truncate max-w-[80px] text-center">
                            {location.split(",")[0].trim()}
                          </span>);

                  }
                  return null;
                })()}
                  </div>
                </div>);

        }) :

        <div className="flex items-center gap-2.5 px-4 py-2 text-slate-400 select-none border-l border-slate-200 ml-2 shrink-0 h-16">
              <div className="flex flex-col justify-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  No Dispatches Yet
                </p>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider">
                  Follow explorers to see updates
                </p>
              </div>
            </div>}

      </div>
    </div>);

};

export default DispatchBar;