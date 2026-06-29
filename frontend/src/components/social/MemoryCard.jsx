import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, User, FileText, Image as ImageIcon, Video, Users, Clapperboard, Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const MemoryCard = ({ item, user }) => {
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mediaList = item.mediaUrls?.length > 0 ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : [];

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const getBadgeInfo = (postType) => {
    switch (postType) {
      case "story":
        return { icon: <Clapperboard className="w-3 h-3" />, label: "Story", bg: "bg-white/90 text-purple-600" };
      case "group":
        return { icon: <Users className="w-3 h-3" />, label: "Group Memory", bg: "bg-white/90 text-blue-600" };
      case "document":
        return { icon: <FileText className="w-3 h-3" />, label: "Document", bg: "bg-white/90 text-amber-600" };
      case "profile_update":
        return { icon: <User className="w-3 h-3" />, label: "Profile Update", bg: "bg-white/90 text-emerald-600" };
      case "travel_memory":
      case "travel_photo":
      case "memory":
        return { icon: <MapPin className="w-3 h-3" />, label: "Travel Memory", bg: "bg-white/90 text-rose-600" };
      case "travel_video":
        return { icon: <Video className="w-3 h-3" />, label: "Travel Video", bg: "bg-white/90 text-indigo-600" };
      default:
        return { icon: <ImageIcon className="w-3 h-3" />, label: "Memory", bg: "bg-white/90 text-slate-600" };
    }
  };

  const badge = getBadgeInfo(item.postType);
  const authorName = item.author?.name || item.author?.userName || "Traveler";
  const authorPic = getAvatarUrl(item.author?.pic || item.author?.userPic, item.author?.img, authorName);
  
  const handleCardClick = () => {
    if (item.type === "group") navigate(`/social/buddy/${item._id}`);
    else if (item.type === "story") navigate(`/social`); // Or specific story view if applicable
    else navigate(`/post/${item._id}`); // Adjust depending on post route
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (item.author?._id) navigate(`/profile/${item.author._id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onClick={handleCardClick}
      className="relative rounded-3xl overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group mb-6 inline-block w-full"
    >
      {/* Media Container */}
      <div className="relative w-full overflow-hidden bg-slate-100 aspect-[4/5]">
        {mediaList.length > 0 ? (
          <>
            {mediaList[currentMediaIndex].match(/\.(mp4|webm)$/i) || item.mediaType === "video" ? (
              <video 
                src={mediaList[currentMediaIndex]} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                muted loop playsInline
                onMouseOver={(e) => e.target.play().catch(()=>{})}
                onMouseOut={(e) => e.target.pause()}
              />
            ) : (
              <img 
                src={mediaList[currentMediaIndex]} 
                alt={item.caption || item.title || "Memory"} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            )}

            {mediaList.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                  {mediaList.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentMediaIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                      onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
            {badge.icon}
            <span className="mt-2 text-sm font-medium">{item.caption || item.title || "No Media"}</span>
          </div>
        )}

        {/* Top Left Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold tracking-wide shadow-sm ${badge.bg}`}>
            {badge.icon}
            {badge.label}
          </div>
        </div>

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
          
          {/* Location & Author */}
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {item.title && (
              <h3 className="text-white font-extrabold text-base leading-tight mb-2 drop-shadow-md line-clamp-2">
                {item.title}
              </h3>
            )}
            {item.location && (
              <div className="flex items-center gap-1.5 text-white/90 text-sm font-bold mb-2 line-clamp-1">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                {item.location}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-3 cursor-pointer w-fit" onClick={handleProfileClick}>
              <img 
                src={authorPic} 
                alt={authorName} 
                className="w-6 h-6 rounded-full object-cover border border-white/50"
              />
              <span className="text-white text-xs font-medium hover:underline shadow-sm">{authorName}</span>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-white/80 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">✨</span>
                <span>{item.likesCount || 0} Felt This</span>
              </div>
              {item.type !== "group" && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{item.commentsCount || 0} Thoughts</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
              <button onClick={(e) => { e.stopPropagation(); handleCardClick(); }} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 rounded-xl text-xs font-bold transition-colors">
                View
              </button>
              {item.location && (
                <button onClick={(e) => { e.stopPropagation(); window.open(`https://maps.google.com/?q=${item.location}`); }} className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-colors">
                  <MapPin className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};

export default MemoryCard;
