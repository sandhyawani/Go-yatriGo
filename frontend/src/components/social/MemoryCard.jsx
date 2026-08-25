import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Compass,
  Sparkles,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Edit,
  Trash2,
  ShieldAlert,
  Camera,
  ChevronLeft,
  ChevronRight,
  Music2,
  Play,
  Pause,
} from "lucide-react";
import moment from "moment";
import { getAvatarUrl } from "../../utils/avatar";
import ChangeCoverModal from "../modals/ChangeCoverModal";

const MemoryCard = ({
  item,
  user,
  onPostUpdated,
  onPostDeleted,
  onEditRequested,
  onReportRequested,
  handleLike,
  handleSaveToggle,
  isSaved,
  hasLiked,
}) => {
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const [localItem, setLocalItem] = useState(item);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const currentItem = localItem || item;
  const currentUserId = (user?._id || user?.id)?.toString();
  const authorId = (
    currentItem.userId?._id ||
    currentItem.userId ||
    currentItem.author?._id ||
    currentItem.author?.id
  )?.toString();

  const isCreator = Boolean(
    currentUserId && authorId && currentUserId === authorId
  );

  const mediaList =
    Array.isArray(currentItem.mediaUrls) && currentItem.mediaUrls.length > 0
      ? currentItem.mediaUrls
      : currentItem.mediaUrl
      ? [currentItem.mediaUrl]
      : currentItem.image
      ? [currentItem.image]
      : currentItem.img
      ? [currentItem.img]
      : [];

  const coverUrl = mediaList[currentMediaIndex] || mediaList[0] || "";

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

  const authorName =
    currentItem.author?.name ||
    currentItem.author?.userName ||
    currentItem.userName ||
    currentItem.userId?.name ||
    "Traveler";

  const authorPic = getAvatarUrl(
    currentItem.author?.pic ||
      currentItem.author?.userPic ||
      currentItem.userPic ||
      currentItem.userId?.pic,
    currentItem.author?.img,
    authorName
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = () => {
    if (currentItem.type === "group") navigate(`/social/buddy/${currentItem._id}`);
    else if (currentItem.type === "story") navigate(`/social`);
    else navigate(`/post/${currentItem._id}`);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (authorId) navigate(`/profile/${authorId}`);
  };

  const handleCoverUpdated = (updatedMemory) => {
    setLocalItem((prev) => ({
      ...prev,
      ...updatedMemory,
    }));
    if (onPostUpdated) {
      onPostUpdated(updatedMemory);
    }
  };

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const audioSrc =
    currentItem.music?.preview ||
    currentItem.audio ||
    currentItem.audioUrl ||
    currentItem.songUrl;

  const songTitle =
    currentItem.music?.title ||
    (typeof currentItem.song === "object"
      ? currentItem.song?.title || currentItem.song?.name
      : typeof currentItem.song === "string"
      ? currentItem.song
      : null);

  const likesCount =
    typeof currentItem.likesCount === "number"
      ? currentItem.likesCount
      : Array.isArray(currentItem.likes)
      ? currentItem.likes.length
      : 0;

  const commentsCount =
    typeof currentItem.commentsCount === "number"
      ? currentItem.commentsCount
      : Array.isArray(currentItem.comments)
      ? currentItem.comments.length
      : 0;

  const travelDateFormatted = currentItem.createdAt
    ? moment(currentItem.createdAt).format("MMM D, YYYY")
    : null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary-200 cursor-pointer mb-5 inline-block w-full text-slate-900"
      >
        {/* ─── 1. CARD HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 pb-2 select-none border-b border-slate-100/70">
          <div
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            onClick={handleProfileClick}
          >
            <img
              src={authorPic}
              alt={authorName}
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-primary-100"
            />

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight font-heading hover:underline">
                  {authorName}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded-full border border-primary-100 shrink-0">
                  TRAVEL MEMORY
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate mt-0.5 font-sans">
                {currentItem.location && (
                  <span className="flex items-center gap-0.5 text-slate-600 truncate max-w-[130px]">
                    <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">{currentItem.location}</span>
                  </span>
                )}
                {currentItem.location && <span>•</span>}
                <span className="shrink-0">
                  {moment(currentItem.createdAt).fromNow(true)}
                </span>
              </div>
            </div>
          </div>

          {/* Three dot dropdown menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCreator ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          if (onEditRequested) onEditRequested(currentItem);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-primary-500" />
                        Edit Memory
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setShowChangeCoverModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-primary-600 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary-500" />
                        Change Cover Photo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          if (onPostDeleted) onPostDeleted(currentItem._id);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Memory
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        if (onReportRequested) onReportRequested(currentItem);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      Report Memory
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── 2. MUSIC ROW (IF ATTACHED) ──────────────────────────────── */}
        {(audioSrc || songTitle) && (
          <div className="px-3 pt-2 pb-0.5 select-none">
            <div className="flex items-center justify-between rounded-xl bg-purple-50/70 border border-primary-100/70 px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Music2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {songTitle || "Audio Track"}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAudio}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-xs hover:bg-primary-700 transition-transform active:scale-95 ml-1.5 shrink-0"
              >
                {isPlayingAudio ? (
                  <Pause className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                )}
              </button>

              {audioSrc && (
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  preload="none"
                  onEnded={() => setIsPlayingAudio(false)}
                />
              )}
            </div>
          </div>
        )}

        {/* ─── 3. COVER IMAGE SECTION (16:9 Aspect Ratio) ───────────────── */}
        <div className="p-3 pt-2 select-none">
          <div className="group/cover relative w-full aspect-[16/9] bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80">
            {coverUrl ? (
              coverUrl.match(/\.(mp4|webm|mov)$/i) ||
              currentItem.mediaType === "video" ? (
                <video
                  src={`${coverUrl}#t=0.1`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={currentItem.caption || currentItem.title || "Memory"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-primary-50/40 via-white to-purple-50/20">
                <MapPin className="w-6 h-6 text-primary-400 mb-1" />
                <p className="text-[11px] font-bold text-slate-700 line-clamp-2 px-2">
                  {currentItem.caption || currentItem.title || "Travel Memory"}
                </p>
              </div>
            )}

            {/* Carousel navigation buttons */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                  {mediaList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === currentMediaIndex
                          ? "w-3 bg-white"
                          : "w-1 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Owner Hover "Change Cover" overlay button */}
            {isCreator && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangeCoverModal(true);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold backdrop-blur-md shadow-sm opacity-0 group-hover/cover:opacity-100 transition-all duration-200 active:scale-95"
              >
                <Camera className="w-3 h-3 text-primary-300" />
                <span>Change Cover</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 4. MEMORY CONTENT (Title, Caption, Location, Date) ──────── */}
        <div className="px-3.5 pb-2 text-left space-y-1.5 font-sans">
          {currentItem.title && (
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 font-heading leading-tight">
              {currentItem.title}
            </h3>
          )}

          {currentItem.caption && (
            <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed break-words font-sans">
              {currentItem.caption}
            </p>
          )}

          {/* Location & Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-semibold text-slate-500">
            {currentItem.location && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[140px]">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="truncate">{currentItem.location}</span>
              </span>
            )}
            {travelDateFormatted && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                <Calendar className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>{travelDateFormatted}</span>
              </span>
            )}
            {currentItem.journeyId && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-primary-700 border border-primary-100/60">
                <Compass className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>Trip</span>
              </span>
            )}
          </div>
        </div>

        {/* ─── 5. SOCIAL ACTIONS FOOTER ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/60 select-none mt-auto font-sans">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (handleLike) handleLike(currentItem._id);
              }}
              className={`inline-flex items-center gap-1 text-xs font-bold transition-transform active:scale-90 ${
                hasLiked
                  ? "text-[#7C3AED]"
                  : "text-slate-600 hover:text-[#7C3AED]"
              }`}
              title="Felt this memory"
              aria-label={hasLiked ? "Remove Felt" : "Felt this travel memory"}
            >
              <Sparkles
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  hasLiked ? "fill-[#7C3AED] text-[#7C3AED] scale-110" : "text-slate-400"
                }`}
              />
              <span>{likesCount > 0 ? `${likesCount} Felt` : "Felt"}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-primary-600 transition-transform active:scale-90"
              title="Comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: currentItem.title || "Travel Memory",
                    text: currentItem.caption || "",
                    url: `${window.location.origin}/post/${currentItem._id}`,
                  }).catch(() => {});
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-primary-600 transition-transform active:scale-90"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (handleSaveToggle) handleSaveToggle(currentItem._id);
            }}
            className={`text-xs font-bold transition-transform active:scale-90 ${
              isSaved
                ? "text-primary-600"
                : "text-slate-600 hover:text-primary-600"
            }`}
            title={isSaved ? "Saved" : "Save Memory"}
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isSaved ? "fill-primary-600 text-primary-600" : ""
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Change Cover Modal */}
      {showChangeCoverModal && (
        <ChangeCoverModal
          isOpen={showChangeCoverModal}
          onClose={() => setShowChangeCoverModal(false)}
          memory={currentItem}
          onCoverUpdated={handleCoverUpdated}
        />
      )}
    </>
  );
};

export default MemoryCard;