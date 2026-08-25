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
            className="aspect-[3/4] bg-secondary-100 animate-pulse rounded-3xl shadow-sm border border-border"
          />
        ))}
      </div>
    );
  }

  if (feltPosts.length === 0) {
    return (
      <div className="bg-surface/50 border border-border rounded-3xl p-16 text-center select-none shadow-sm">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-border">
          <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-xl animate-pulse" />
          <Star className="w-10 h-10 text-primary-600 relative z-10" />
        </div>
        <h3 className="text-sm font-bold text-dark mb-1">
          No felt vibes yet ✨
        </h3>
        <p className="text-[13px] text-muted font-medium">
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
            bg: "text-danger",
          };
          if (post.postType === "story")
            badgeInfo = {
              icon: <Clapperboard className="w-3 h-3" />,
              label: "Story",
              bg: "text-primary-600",
            };
          else if (post.postType === "group")
            badgeInfo = {
              icon: <Users className="w-3 h-3" />,
              label: "Travel Group",
              bg: "text-info",
            };
          else if (post.postType === "document")
            badgeInfo = {
              icon: <FileText className="w-3 h-3" />,
              label: "Document",
              bg: "text-warning",
            };
          else if (post.postType === "profile_update")
            badgeInfo = {
              icon: <User className="w-3 h-3" />,
              label: "Profile Update",
              bg: "text-success",
            };
          else if (post.postType === "travel_video")
            badgeInfo = {
              icon: <Video className="w-3 h-3" />,
              label: "Travel Video",
              bg: "text-primary-600",
            };

          return (
            <div
              key={post._id}
              onClick={() => setSelectedMemory(post)}
              className="aspect-[3/4] bg-surface/80 backdrop-blur-xl rounded-3xl border border-border overflow-hidden relative cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] hover:-translate-y-1 transition-all duration-300"
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
                  className={`flex items-center gap-1 px-2 py-1 rounded-full bg-surface/90 backdrop-blur-md ${badgeInfo.bg} text-[9px] sm:text-[10px] font-bold shadow-sm`}
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
          className="w-full py-3 bg-surface border border-border hover:bg-secondary-50 text-primary-600 font-bold rounded-2xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 group"
        >
          View All Felt Vibes
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default FeltTab;
