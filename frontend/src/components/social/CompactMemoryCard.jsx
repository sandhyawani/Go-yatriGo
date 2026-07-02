import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  Users,
  Clapperboard,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CompactMemoryCard = ({ item }) => {
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mediaList =
    item.mediaUrls?.length > 0
      ? item.mediaUrls
      : item.mediaUrl
        ? [item.mediaUrl]
        : [];

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaList.length - 1 : prev - 1,
    );
  };

  const getBadgeInfo = (postType) => {
    switch (postType) {
      case "story":
        return {
          icon: <Clapperboard className="w-3 h-3" />,
          label: "Story",
          bg: "bg-white/95 text-purple-600",
        };
      case "group":
        return {
          icon: <Users className="w-3 h-3" />,
          label: "Group",
          bg: "bg-white/95 text-blue-600",
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
      case "travel_memory":
      case "travel_photo":
      case "memory":
        return {
          icon: <MapPin className="w-3 h-3" />,
          label: "Memory",
          bg: "bg-white/95 text-rose-600",
        };
      case "travel_video":
        return {
          icon: <Video className="w-3 h-3" />,
          label: "Video",
          bg: "bg-white/95 text-indigo-600",
        };
      default:
        return {
          icon: <ImageIcon className="w-3 h-3" />,
          label: "Memory",
          bg: "bg-white/95 text-slate-600",
        };
    }
  };

  const badge = getBadgeInfo(item.postType);

  const handleCardClick = () => {
    if (item.type === "group") navigate(`/social/buddy/${item._id}`);
    else if (item.type === "story") navigate(`/social`);
    else navigate(`/post/${item._id}`);
  };

  const isNonTravel =
    item.postType === "document" || item.postType === "profile_update";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`relative overflow-hidden cursor-pointer group shrink-0 transition-all duration-300 w-full sm:w-[200px] h-[210px] sm:h-[260px] 
        ${isNonTravel ? "rounded-2xl border-2 border-slate-200 bg-slate-50" : "rounded-2xl sm:rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] hover:-translate-y-1"}
      `}
    >
      <div
        className={`relative w-full h-full overflow-hidden ${isNonTravel ? "p-4" : ""}`}
      >
        {mediaList.length > 0 ? (
          <>
            {mediaList[currentMediaIndex].match(/\.(mp4|webm)$/i) ||
            item.mediaType === "video" ? (
              <video
                src={`${mediaList[currentMediaIndex]}#t=0.1`}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isNonTravel ? "rounded-xl" : ""}`}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseOver={(e) => e.target.play().catch(() => {})}
                onMouseOut={(e) => e.target.pause()}
              />
            ) : (
              <img
                src={mediaList[currentMediaIndex]}
                alt={item.caption || item.title || "Memory"}
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isNonTravel ? "rounded-xl" : ""}`}
              />
            )}

            {mediaList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                  {mediaList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-300 shadow-sm ${idx === currentMediaIndex ? "w-3 bg-white" : "w-1 bg-white/50 hover:bg-white/80"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex(idx);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${isNonTravel ? "bg-white rounded-xl shadow-sm" : "bg-slate-100"}`}
          >
            <div
              className={`p-4 rounded-full mb-3 ${isNonTravel ? "bg-slate-50" : "bg-white shadow-sm"}`}
            >
              {React.cloneElement(badge.icon, {
                className: "w-6 h-6 text-slate-400",
              })}
            </div>
            <span className="text-sm font-medium text-slate-600 line-clamp-2">
              {item.caption || item.title || "No Preview"}
            </span>
          </div>
        )}

        {/* Top Badge */}
        <div
          className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 ${isNonTravel ? "top-4 left-4" : ""}`}
        >
          <div
            className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md text-[9px] sm:text-[10px] font-bold tracking-wide shadow-sm ${badge.bg}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>

        {/* hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 ${isNonTravel ? "m-4 rounded-xl" : ""}`}
        >
          <div className="transform translate-y-0 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {item.title && (
              <h3 className="text-white font-extrabold text-sm leading-tight mb-1.5 drop-shadow-md line-clamp-2">
                {item.title}
              </h3>
            )}
            {item.location && (
              <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold mb-2 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                {item.location}
              </div>
            )}

            <div className="flex items-center gap-3 text-white/80 text-[11px] font-semibold mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs leading-none">✨</span>
                <span>{item.likesCount || 0}</span>
              </div>
              {item.type !== "group" && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{item.commentsCount || 0}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/20">
              <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-1.5 rounded-lg text-[11px] font-bold transition-colors">
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompactMemoryCard;
