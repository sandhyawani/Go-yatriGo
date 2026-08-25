import React, { useState, useRef, useEffect } from "react";
import { X, Heart, MessageCircle, Share2, Bookmark, MapPin, Calendar, Compass, Music2, Play, Pause, MoreVertical, Edit, Trash2, ShieldAlert, Send, Loader2, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../../utils/avatar";
import { renderClickableText } from "../home/feed/utils/feedHelpers";
import ChangeCoverModal from "../modals/ChangeCoverModal";

export const MemoryDetailModal = ({
  selectedMemory,
  setSelectedMemory,
  currentUser,
  profileUser,
  savedPostIds,
  saveLoadingMap = {},
  feltLoadingMap = {},
  commentsLoadingMap = {},
  isSubmittingComment = {},
  commentText = {},
  setCommentText,
  activeCommentPost,
  playingAudioId,
  journeyLikeAnim,
  handleFelt,
  handlePostTap,
  handleOpenComments,
  handleDispatch,
  handleSaveToggle,
  handleDeleteComment,
  handleCommentSubmit,
  toggleAudio,
  setReportModal,
  setEditPostData,
  setShowEditPostModal,
  handleDeletePost,
  handleAvatarError,
  audioRefs,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const menuRef = useRef(null);

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (selectedMemory) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedMemory]);

  // Load full comments if not loaded already
  useEffect(() => {
    if (selectedMemory) {
      const postId = selectedMemory._id || selectedMemory.id;
      if (postId && handleOpenComments && activeCommentPost !== postId) {
        handleOpenComments(postId);
      }
    }
  }, [selectedMemory, handleOpenComments, activeCommentPost]);

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

  if (!selectedMemory) return null;

  const postId = (selectedMemory._id || selectedMemory.id)?.toString();
  const myUserId = (currentUser?._id || currentUser?.id)?.toString();
  const memoryAuthorId = (
    selectedMemory.userId?._id ||
    selectedMemory.userId ||
    profileUser?._id ||
    profileUser?.id
  )?.toString();

  const isCreator = Boolean(
    myUserId && memoryAuthorId && myUserId === memoryAuthorId
  );

  const hasFelt = Array.isArray(selectedMemory.likes)
    ? selectedMemory.likes.some(
        (id) => (id?._id || id)?.toString() === myUserId
      )
    : false;

  const isSaved = savedPostIds ? savedPostIds.has(postId) : false;

  const authorName =
    selectedMemory.userName ||
    selectedMemory.userId?.name ||
    selectedMemory.userId?.username ||
    profileUser?.name ||
    "Traveler";

  const authorAvatar =
    selectedMemory.userPic ||
    selectedMemory.userId?.pic ||
    selectedMemory.userId?.avatar ||
    getAvatarUrl(selectedMemory.userId || profileUser || selectedMemory);

  const likesCount = Array.isArray(selectedMemory.likes)
    ? selectedMemory.likes.length
    : typeof selectedMemory.likesCount === "number"
    ? selectedMemory.likesCount
    : 0;

  const comments = Array.isArray(selectedMemory.comments)
    ? selectedMemory.comments.filter(
        (c) => typeof c === "object" && c !== null
      )
    : [];

  const commentsCount =
    typeof selectedMemory.commentsCount === "number"
      ? selectedMemory.commentsCount
      : comments.length;

  const mediaList = Array.isArray(selectedMemory.mediaUrls) &&
    selectedMemory.mediaUrls.length > 0
    ? selectedMemory.mediaUrls
    : selectedMemory.mediaUrl
    ? [selectedMemory.mediaUrl]
    : selectedMemory.image
    ? [selectedMemory.image]
    : selectedMemory.media
    ? [selectedMemory.media]
    : selectedMemory.img
    ? [selectedMemory.img]
    : [];

  const audioSrc =
    selectedMemory.music?.preview ||
    selectedMemory.audio ||
    selectedMemory.audioUrl ||
    selectedMemory.songUrl;

  const songTitle =
    selectedMemory.music?.title ||
    (typeof selectedMemory.song === "object"
      ? selectedMemory.song?.title || selectedMemory.song?.name
      : selectedMemory.song);

  const artistName =
    selectedMemory.music?.artist ||
    (typeof selectedMemory.song === "object"
      ? selectedMemory.song?.artist
      : null);

  const isAudioPlaying = playingAudioId === postId;

  const handleCoverUpdated = (updatedMemory) => {
    setSelectedMemory((prev) => ({
      ...prev,
      ...updatedMemory,
    }));
  };

  const travelDateFormatted = selectedMemory.createdAt
    ? moment(selectedMemory.createdAt).format("MMMM D, YYYY")
    : null;

  return (
    <>
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/65 backdrop-blur-sm select-none"
          onClick={() => setSelectedMemory(null)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl text-slate-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── 1. MEMORY HEADER (User, Badge, Date, Location, Owner Menu) ──── */}
            <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-100 min-h-[58px]">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  onError={(e) =>
                    handleAvatarError
                      ? handleAvatarError(e, authorName)
                      : null
                  }
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary-100"
                />

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate font-heading">
                      {authorName}
                    </span>
                    {(selectedMemory.userId?.isVerified ||
                      profileUser?.isVerified) && (
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[9px]">
                        ✓
                      </span>
                    )}
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200/80 shrink-0">
                      TRAVEL MEMORY
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {selectedMemory.location && (
                      <span className="flex items-center gap-0.5 text-slate-600 truncate max-w-[170px] sm:max-w-[220px]">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {selectedMemory.location}
                        </span>
                      </span>
                    )}
                    {selectedMemory.location && <span>•</span>}
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {moment(selectedMemory.createdAt).fromNow()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Actions: 3-dot Menu & Close Button */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Three-dot dropdown menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="More options"
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
                        className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 text-left"
                      >
                        {isCreator ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setShowMenu(false);
                                if (setEditPostData) {
                                  setEditPostData(selectedMemory);
                                }
                                if (setShowEditPostModal) {
                                  setShowEditPostModal(true);
                                }
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-primary-600 transition-colors"
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
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-primary-600 transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-primary-500" />
                              Change Cover Photo
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowMenu(false);
                                if (handleDeletePost) {
                                  handleDeletePost(selectedMemory);
                                }
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-0.5"
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
                              if (setReportModal) {
                                setReportModal({
                                  isOpen: true,
                                  targetId: postId,
                                  targetType: "post",
                                  reportedUserId:
                                    selectedMemory.userId?._id ||
                                    selectedMemory.userId,
                                });
                              }
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                            Report Memory
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Close modal */}
                <button
                  type="button"
                  onClick={() => setSelectedMemory(null)}
                  aria-label="Close details"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ─── 2. COMPACT MUSIC SECTION ─────────────────────────────────── */}
            {(audioSrc || songTitle) && (
              <div className="px-4 sm:px-5 pt-2.5 pb-1 select-none">
                <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-purple-50/70 px-3 py-1.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
                      <Music2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                        {songTitle || "Audio Track"}
                      </p>
                      {artistName && (
                        <p className="truncate text-[10px] text-slate-500 font-medium">
                          {artistName}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={isAudioPlaying ? "Pause music" : "Play music"}
                    onClick={() => {
                      if (toggleAudio) toggleAudio(postId);
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:scale-95 transition-transform ml-2"
                  >
                    {isAudioPlaying ? (
                      <Pause className="h-3 w-3 fill-current" />
                    ) : (
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    )}
                  </button>

                  {audioSrc && (
                    <audio
                      ref={(el) => {
                        if (audioRefs && audioRefs.current) {
                          audioRefs.current[postId] = el;
                        }
                      }}
                      src={audioSrc}
                      preload="none"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─── 3. COVER IMAGE SECTION (16:9 Aspect Ratio & Hover Change Cover) ── */}
            <div className="px-4 sm:px-5 pt-2.5 select-none">
              <div className="group/cover relative w-full aspect-[16/9] max-h-[340px] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                {mediaList.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary-50/40 via-white to-purple-50/20">
                    <MapPin className="w-8 h-8 text-primary-400 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      {selectedMemory.caption || "Travel Memory"}
                    </p>
                  </div>
                ) : mediaList.length === 1 ? (
                  mediaList[0]?.match(/\.(mp4|webm|mov)$/i) ||
                  selectedMemory.mediaType === "video" ? (
                    <video
                      src={`${mediaList[0]}#t=0.1`}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={mediaList[0]}
                      alt={selectedMemory.caption || "Travel memory"}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  /* Carousel view */
                  <div className="relative w-full h-full">
                    {mediaList[activeMediaIndex]?.match(/\.(mp4|webm|mov)$/i) ? (
                      <video
                        src={`${mediaList[activeMediaIndex]}#t=0.1`}
                        controls
                        playsInline
                        className="w-full h-full object-cover bg-black"
                      />
                    ) : (
                      <img
                        src={mediaList[activeMediaIndex] || mediaList[0]}
                        alt={`Photo ${activeMediaIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Carousel Nav Buttons */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex((prev) =>
                          prev === 0 ? mediaList.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex(
                          (prev) => (prev + 1) % mediaList.length
                        );
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Indicator pill */}
                    <div className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {activeMediaIndex + 1} / {mediaList.length}
                    </div>
                  </div>
                )}

                {/* Owner Hover "Change Cover" overlay button */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChangeCoverModal(true);
                    }}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white text-[11px] font-bold backdrop-blur-md shadow-md opacity-0 group-hover/cover:opacity-100 transition-all duration-200 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-primary-300" />
                    <span>Change Cover</span>
                  </button>
                )}

                {/* Double-tap heart animation indicator */}
                {journeyLikeAnim?.postId === postId && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0.8, 1.3, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                  >
                    <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-xl" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* ─── 4. MEMORY CONTENT (Title, Caption, Travel Metadata Row) ─── */}
            <div className="px-4 sm:px-5 pt-3.5 pb-2 text-left space-y-2">
              {/* Memory Title */}
              {selectedMemory.title && (
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-heading">
                  {selectedMemory.title}
                </h2>
              )}

              {/* Caption / Description */}
              {selectedMemory.caption && (
                <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-wrap break-words font-sans">
                  {renderClickableText(selectedMemory.caption)}
                </p>
              )}

              {/* Travel Metadata Pills Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {selectedMemory.location && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {selectedMemory.location}
                    </span>
                  </div>
                )}

                {travelDateFormatted && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>{travelDateFormatted}</span>
                  </div>
                )}

                {selectedMemory.journeyId && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-primary-700 border border-primary-100 text-[11px] font-semibold">
                    <Compass className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>Journey Escape</span>
                  </div>
                )}

                {/* Tags if any */}
                {selectedMemory.tags &&
                  selectedMemory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            </div>

            {/* ─── 5. SOCIAL ACTIONS ROW (Like, Comment, Share, Save) ────────── */}
            <div className="px-4 sm:px-5 py-2.5 mt-1 flex items-center justify-between border-y border-slate-100 bg-slate-50/70 select-none">
              <div className="flex items-center gap-5 sm:gap-6">
                {/* Like / Felt */}
                <button
                  type="button"
                  disabled={feltLoadingMap[postId]}
                  onClick={() => {
                    if (handleFelt) handleFelt(postId);
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 ${
                    hasFelt
                      ? "text-rose-500"
                      : "text-slate-600 hover:text-rose-500"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      hasFelt ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span>{likesCount} Felt</span>
                </button>

                {/* Comments count */}
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <MessageCircle className="w-4 h-4 text-primary-600" />
                  <span>{commentsCount} Thoughts</span>
                </div>

                {/* Dispatch / Share */}
                <button
                  type="button"
                  onClick={() => {
                    if (handleDispatch) handleDispatch(postId);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary-600 transition-transform active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              {/* Save */}
              <button
                type="button"
                disabled={saveLoadingMap[postId]}
                onClick={() => {
                  if (handleSaveToggle) handleSaveToggle(postId);
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 ${
                  isSaved
                    ? "text-primary-600"
                    : "text-slate-600 hover:text-primary-600"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 transition-colors ${
                    isSaved ? "fill-primary-600 text-primary-600" : ""
                  }`}
                />
                <span className="hidden sm:inline">
                  {isSaved ? "Saved" : "Save"}
                </span>
              </button>
            </div>

            {/* ─── 6. COMMENTS THREAD & INPUT ───────────────────────────────── */}
            <div className="px-4 sm:px-5 py-3 flex-1 flex flex-col min-h-[160px]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Thoughts & Comments ({comments.length})
              </h4>

              {commentsLoadingMap[postId] && comments.length === 0 ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span>Loading thoughts...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400 font-medium">
                  No comments yet. Share your thoughts on this travel memory!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {comments.map((comment, index) => {
                    const commentId =
                      comment._id || comment.id || `cmt-${index}`;
                    const commentAuthorId = (
                      comment.userId?._id ||
                      comment.userId ||
                      comment.user?._id ||
                      comment.user
                    )?.toString();

                    const canDeleteComment = Boolean(
                      (commentAuthorId &&
                        myUserId &&
                        commentAuthorId === myUserId) ||
                        isCreator
                    );

                    const cmtUserName =
                      comment.userName ||
                      comment.userId?.name ||
                      comment.userId?.username ||
                      comment.user?.name ||
                      "Traveler";

                    const cmtUserPic =
                      comment.userPic ||
                      comment.userId?.pic ||
                      comment.userId?.avatar ||
                      comment.user?.pic;

                    return (
                      <div
                        key={commentId}
                        className="group/comment relative flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition-colors"
                      >
                        <img
                          src={
                            cmtUserPic ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              cmtUserName
                            )}&background=7C3AED&color=fff&bold=true`
                          }
                          alt={cmtUserName}
                          className="h-6 w-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200 mt-0.5"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              cmtUserName
                            )}&background=7C3AED&color=fff&bold=true`;
                          }}
                        />

                        <div className="min-w-0 flex-1 pr-6">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-900 font-heading">
                              {cmtUserName}
                            </span>
                            {comment.createdAt && (
                              <span className="text-[10px] text-slate-400">
                                {moment(comment.createdAt).fromNow()}
                              </span>
                            )}
                          </div>

                          <div className="text-slate-700 mt-0.5 leading-relaxed break-words font-sans">
                            {renderClickableText(comment.text)}
                          </div>
                        </div>

                        {canDeleteComment && (
                          <button
                            type="button"
                            aria-label="Delete comment"
                            onClick={() => {
                              if (handleDeleteComment) {
                                handleDeleteComment(postId, commentId);
                              }
                            }}
                            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment Input Form */}
              <form
                onSubmit={(e) => {
                  if (handleCommentSubmit) handleCommentSubmit(e, postId);
                }}
                className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100"
              >
                <img
                  src={
                    currentUser?.pic ||
                    currentUser?.profilePic ||
                    getAvatarUrl(currentUser)
                  }
                  alt="My avatar"
                  className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser?.name || "User"
                    )}&background=7C3AED&color=fff&bold=true`;
                  }}
                />

                <div className="relative flex flex-1 items-center">
                  <input
                    type="text"
                    value={commentText[postId] || ""}
                    onChange={(e) => {
                      if (setCommentText) {
                        setCommentText((prev) => ({
                          ...prev,
                          [postId]: e.target.value,
                        }));
                      }
                    }}
                    placeholder="Add a comment..."
                    maxLength={500}
                    className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-3.5 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 font-sans"
                  />

                  <button
                    type="submit"
                    disabled={
                      isSubmittingComment[postId] ||
                      !commentText[postId]?.trim()
                    }
                    aria-label="Post comment"
                    className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white shadow-xs transition-all hover:bg-primary-700 active:scale-90 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    {isSubmittingComment[postId] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Change Cover Modal */}
      {showChangeCoverModal && (
        <ChangeCoverModal
          isOpen={showChangeCoverModal}
          onClose={() => setShowChangeCoverModal(false)}
          memory={selectedMemory}
          onCoverUpdated={handleCoverUpdated}
        />
      )}
    </>
  );
};

export default MemoryDetailModal;
