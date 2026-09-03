import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, User, FileText, Video, Users, Clapperboard, Sparkles, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

const CompactMemoryCard = ({ item }) => {
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mediaList =
    item.mediaUrls?.length > 0
      ? item.mediaUrls
      : item.mediaUrl
      ? [item.mediaUrl]
      : item.image
      ? [item.image]
      : [];

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaList.length - 1 : prev - 1
    );
  };

  const getBadgeInfo = (postType) => {
    switch (postType) {
      case "story":
        return {
          icon: <Clapperboard className="w-3 h-3" />,
          label: "Dispatch",
          bg: "bg-white/95 text-primary-600",
        };
      case "group":
        return {
          icon: <Users className="w-3 h-3" />,
          label: "Group",
          bg: "bg-white/95 text-primary-600",
        };
      case "document":
        return {
          icon: <FileText className="w-3 h-3" />,
          label: "Document",
          bg: "bg-white/95 text-amber-600",
        };
      case "profile_update":
        return {
          icon: <User className="w-3 h-3" />,
          label: "Profile",
          bg: "bg-white/95 text-emerald-600",
        };
      case "travel_video":
        return {
          icon: <Video className="w-3 h-3" />,
          label: "Video",
          bg: "bg-white/95 text-primary-600",
        };
      case "travel_memory":
      case "travel_photo":
      case "memory":
      default:
        return {
          icon: <MapPin className="w-3 h-3 text-rose-500" />,
          label: "Travel Memory",
          bg: "bg-white/95 text-primary-700",
        };
    }
  };

  const badge = getBadgeInfo(item.postType);

  const handleCardClick = () => {
    const authorId = item.author?._id;
    if (item.type === "group") {
      navigate(`/social/buddy/${item._id}`);
    } else if (item.type === "story") {
      // stories: navigate to the author's profile
      if (authorId) navigate(`/profile/${authorId}`);
      else navigate("/");
    } else {
      // memories: navigate to the post detail page
      navigate(`/post/${item._id}`);
    }
  };

  const isNonTravel =
    item.postType === "document" || item.postType === "profile_update";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      onClick={handleCardClick}
      className={`relative overflow-hidden cursor-pointer group shrink-0 transition-all duration-300 w-full sm:w-[220px] rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-lg hover:border-primary-200 hover:-translate-y-1`}
    >
      {/* Media 16:9 */}
      <div className="relative w-full aspect-[16/9] bg-background overflow-hidden">
        {mediaList.length > 0 ? (
          <>
            {mediaList[currentMediaIndex].match(/\.(mp4|webm)$/i) ||
            item.mediaType === "video" ? (
              <video
                src={`${mediaList[currentMediaIndex]}#t=0.1`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={mediaList[currentMediaIndex]}
                alt={item.caption || item.title || "Memory"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20">
            <MapPin className="w-5 h-5 text-primary-400 mb-1" />
            <span className="text-xs font-bold text-text-primary line-clamp-1">
              {item.caption || item.title || "Travel Memory"}
            </span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] font-bold tracking-wide shadow-2xs ${badge.bg}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-left space-y-1 font-sans">
        <h4 className="text-xs font-bold text-text-primary line-clamp-1 font-heading leading-tight">
          {item.title || item.caption || "Travel Memory"}
        </h4>

        {item.location && (
          <div className="flex items-center gap-1 text-text-muted text-[10px] font-semibold truncate">
            <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-text-muted select-none">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-brand">
              <Sparkles className="w-3 h-3 text-brand fill-brand" />
              <span>{item.likesCount || 0} Felt</span>
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="w-3 h-3 text-primary-600" />
              <span>{item.commentsCount || 0}</span>
            </span>
          </div>

          <span className="text-[9px] font-bold text-text-muted">
            {item.createdAt ? moment(item.createdAt).fromNow(true) : ""}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CompactMemoryCard;