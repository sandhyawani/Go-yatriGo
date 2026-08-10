import React from "react";
import { Star, MapPin, Clapperboard, Users, FileText, User, Video, MessageCircle, ChevronRight } from "lucide-react";

export const FeltTab = ({
  feltPosts,
  setSelectedMemory,
  navigate,
  feltLoading,
}) => {
  if (feltLoading && feltPosts.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
          />
        ))}
      </div>
    );
  }

  if (feltPosts.length === 0) {
    return (
      <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
          <Star className="w-10 h-10 text-amber-200 fill-amber-100 relative z-10" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          No felt vibes yet ✨
        </h3>
        <p className="text-[13px] text-slate-500 font-medium">
          No travel memories have been felt yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {feltPosts.slice(0, 3).map((post) => {
          let badgeInfo = {
            icon: <MapPin className="w-3 h-3" />,
            label: "Travel Memory",
            bg: "text-rose-600",
          };
          if (post.postType === "story")
            badgeInfo = {
              icon: <Clapperboard className="w-3 h-3" />,
              label: "Story",
              bg: "text-purple-600",
            };
          else if (post.postType === "group")
            badgeInfo = {
              icon: <Users className="w-3 h-3" />,
              label: "Travel Group",
              bg: "text-blue-600",
            };
          else if (post.postType === "document")
            badgeInfo = {
              icon: <FileText className="w-3 h-3" />,
              label: "Document",
              bg: "text-amber-600",
            };
          else if (post.postType === "profile_update")
            badgeInfo = {
              icon: <User className="w-3 h-3" />,
              label: "Profile Update",
              bg: "text-emerald-600",
            };
          else if (post.postType === "travel_video")
            badgeInfo = {
              icon: <Video className="w-3 h-3" />,
              label: "Travel Video",
              bg: "text-indigo-600",
            };

          return (
            <div
              key={post._id}
              onClick={() => setSelectedMemory(post)}
              className="aspect-[3/4] bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 overflow-hidden relative cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] hover:-translate-y-1 transition-all duration-300"
            >
              {post.mediaType === "video" ||
              (post.image || post.mediaUrl || post.mediaUrls?.[0] || "").match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={`${post.image || post.mediaUrl || post.mediaUrls?.[0]}#t=0.1`}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <img
                  src={post.image || post.mediaUrl || post.mediaUrls?.[0]}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md ${badgeInfo.bg} text-[9px] sm:text-[10px] font-bold shadow-sm`}
                >
                  {badgeInfo.icon}
                  <span className="hidden sm:inline">
                    {badgeInfo.label}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-3 text-white/90 text-xs font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="text-xs leading-none">✨</span>{" "}
                      {post.likes?.length || post.likesCount || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />{" "}
                      {post.comments?.length || post.commentsCount || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {feltPosts.length > 3 && (
        <button
          onClick={() => navigate("/felt-vibes")}
          className="w-full py-4 bg-white/80 backdrop-blur-xl hover:bg-purple-50 text-purple-700 text-sm font-extrabold rounded-3xl transition-all duration-300 border border-purple-100 shadow-[0_4px_20px_rgba(124,58,237,0.05)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.1)] flex items-center justify-center gap-2 group"
        >
          View All Felt Vibes
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default FeltTab;
