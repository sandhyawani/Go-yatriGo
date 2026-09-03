import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Sparkles,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  MapPin,
  Calendar,
  Compass,
  Music2,
  Play,
  Pause,
  Edit,
  Trash2,
  ShieldAlert,
  Camera,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../../../utils/avatar";
import ChangeCoverModal from "../../modals/ChangeCoverModal";

export const ProfileMemoryCard = ({
  post,
  user,
  myUserId,
  hasFelt,
  isSaved,
  isCreator,
  feltLoadingMap = {},
  saveLoadingMap = {},
  totalCommentsCount = 0,
  playingAudioId,
  journeyLikeAnim,
  handleFelt,
  handlePostTap,
  handleOpenComments,
  handleDispatch,
  handleSaveToggle,
  toggleAudio,
  setReportModal,
  setEditPostData,
  setShowEditPostModal,
  handleDeletePost,
  handleAvatarError,
  audioRefCallback,
  onCardClick,
  onPostUpdated,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const menuRef = useRef(null);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const currentPost = localPost || post;
  const postId = (currentPost._id || currentPost.id)?.toString();
  const isAudioPlaying = Boolean(postId && playingAudioId === postId);

  // Extract cover/media
  const coverUrl =
    currentPost.image ||
    currentPost.mediaUrl ||
    currentPost.img ||
    (Array.isArray(currentPost.mediaUrls) && currentPost.mediaUrls[0]) ||
    "";

  const likesCount = Array.isArray(currentPost.likes)
    ? currentPost.likes.length
    : typeof currentPost.likesCount === "number"
    ? currentPost.likesCount
    : 0;

  const commentsCount =
    typeof currentPost.commentsCount === "number"
      ? currentPost.commentsCount
      : Array.isArray(currentPost.comments)
      ? currentPost.comments.length
      : totalCommentsCount || 0;

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

  const authorName =
    currentPost.userName ||
    currentPost.userId?.name ||
    currentPost.userId?.username ||
    "Traveler";

  const authorAvatar =
    currentPost.userPic ||
    currentPost.userId?.pic ||
    currentPost.userId?.avatar ||
    getAvatarUrl(currentPost.userId || currentPost);

  const audioSrc =
    currentPost.music?.preview ||
    currentPost.audio ||
    currentPost.audioUrl ||
    currentPost.songUrl;

  const songTitle =
    currentPost.music?.title ||
    (typeof currentPost.song === "object"
      ? currentPost.song?.title || currentPost.song?.name
      : typeof currentPost.song === "string"
      ? currentPost.song
      : null);

  const artistName =
    currentPost.music?.artist ||
    (typeof currentPost.song === "object"
      ? currentPost.song?.artist
      : null);

  const handleCoverUpdated = (updatedMemory) => {
    setLocalPost((prev) => ({
      ...prev,
      ...updatedMemory,
    }));
    if (onPostUpdated) {
      onPostUpdated(updatedMemory);
    }
  };

  const travelDateFormatted = currentPost.createdAt
    ? moment(currentPost.createdAt).format("MMM D, YYYY")
    : null;

  // ─── SINGLE VS DOUBLE CLICK / TAP COORDINATOR ─────────────────────
  const cardRef = useRef(null);
  const clickTimerRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, isScrolling: false });
  const lastFeltTriggerTimeRef = useRef(0);
  const lastTouchHandledTimeRef = useRef(0);

  const [heartAnim, setHeartAnim] = useState(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const triggerFeltAction = (tapPoint) => {
    const now = Date.now();
    // Guard against rapid duplicate triggers (350ms cooldown) and ongoing loading
    if (now - lastFeltTriggerTimeRef.current < 350) return;
    if (postId && feltLoadingMap?.[postId]) return;
    lastFeltTriggerTimeRef.current = now;

    // Position floating heart animation safely within card bounds
    const safePoint = {
      x: Math.max(15, Math.min(85, tapPoint?.x ?? 50)),
      y: Math.max(15, Math.min(85, tapPoint?.y ?? 50)),
    };

    setHeartAnim({
      x: safePoint.x,
      y: safePoint.y,
      key: now,
    });

    window.setTimeout(() => {
      setHeartAnim((prev) => (prev?.key === now ? null : prev));
    }, 750);

    // Invoke existing handleFelt exactly once — single source of truth for optimistic updates and API requests
    if (handleFelt && postId) {
      handleFelt(postId);
    }
  };

  const handleMouseDown = (e) => {
    // Prevent browser text selection when double clicking
    if (e.detail > 1) {
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    // If recently handled by touch event on mobile, ignore synthetic click
    if (Date.now() - lastTouchHandledTimeRef.current < 500) {
      return;
    }

    if (e.detail === 2) {
      // Desktop double-click
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      const rect = cardRef.current?.getBoundingClientRect();
      const tapPoint = rect
        ? {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          }
        : { x: 50, y: 50 };

      triggerFeltAction(tapPoint);
      return;
    }

    // First click: wait briefly for possible second click
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      if (onCardClick) onCardClick();
    }, 230);
  };

  const handleDoubleClick = (e) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    const rect = cardRef.current?.getBoundingClientRect();
    const tapPoint = rect
      ? {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        }
      : { x: 50, y: 50 };

    triggerFeltAction(tapPoint);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isScrolling: false,
    };
  };

  const handleTouchMove = (e) => {
    if (touchStartRef.current.isScrolling) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel tap detection if user moves finger > 8px (scrolling)
    if (dx > 8 || dy > 8) {
      touchStartRef.current.isScrolling = true;
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e) => {
    lastTouchHandledTimeRef.current = Date.now();

    // If scrolling, do not trigger single tap or double tap
    if (touchStartRef.current.isScrolling) {
      return;
    }

    const touch = e.changedTouches[0];
    const now = Date.now();
    const touchDuration = now - touchStartRef.current.time;

    // Ignore long presses (> 500ms)
    if (touchDuration > 500) return;

    const lastTap = lastTapRef.current;
    const timeSinceLastTap = now - lastTap.time;
    const dx = Math.abs(touch.clientX - lastTap.x);
    const dy = Math.abs(touch.clientY - lastTap.y);

    // Double-tap detected (< 300ms, within 32px distance)
    if (timeSinceLastTap < 300 && dx < 32 && dy < 32) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastTapRef.current = { time: 0, x: 0, y: 0 };

      const rect = cardRef.current?.getBoundingClientRect();
      const tapPoint = rect
        ? {
            x: ((touch.clientX - rect.left) / rect.width) * 100,
            y: ((touch.clientY - rect.top) / rect.height) * 100,
          }
        : { x: 50, y: 50 };

      triggerFeltAction(tapPoint);
    } else {
      // First tap of potential double tap
      lastTapRef.current = {
        time: now,
        x: touch.clientX,
        y: touch.clientY,
      };

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        if (onCardClick) onCardClick();
      }, 230);
    }
  };

  return (
    <>
      <article
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "manipulation" }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary-200 cursor-pointer text-text-primary select-none"
      >
        {/* Double-tap / Double-click Heart / Felt Animation Overlay */}
        <AnimatePresence>
          {(heartAnim || (journeyLikeAnim?.postId === postId && journeyLikeAnim)) && (
            <motion.div
              key={heartAnim?.key || journeyLikeAnim?.key || postId}
              initial={{ scale: 0.2, opacity: 0, y: 10 }}
              animate={{
                scale: [0.2, 1.25, 1],
                opacity: [0, 1, 1, 0],
                y: [10, -4, -18],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.72,
                times: [0, 0.25, 0.7, 1],
                ease: "easeOut",
              }}
              style={{
                left: `${heartAnim?.x ?? journeyLikeAnim?.x ?? 50}%`,
                top: `${heartAnim?.y ?? journeyLikeAnim?.y ?? 50}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="pointer-events-none absolute z-30 flex flex-col items-center justify-center select-none"
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="absolute w-16 h-16 rounded-full bg-rose-500/25 blur-sm"
                />
                <Heart className="w-12 h-12 text-rose-500 fill-rose-500 drop-shadow-[0_4px_16px_rgba(244,63,94,0.5)]" />
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  Felt
                </span>
                <span className="text-[10px]">✨</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* ─── 1. MEMORY HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 pb-2 select-none border-b border-slate-100/70">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              src={authorAvatar}
              alt={authorName}
              onError={(e) =>
                handleAvatarError
                  ? handleAvatarError(e, authorName)
                  : null
              }
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-primary-100"
            />

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate leading-tight font-heading">
                  {authorName}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded-full border border-primary-100 shrink-0">
                  MEMORY
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium truncate mt-0.5 font-sans">
                {currentPost.location && (
                  <span className="flex items-center gap-0.5 text-text-secondary truncate max-w-[130px]">
                    <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">{currentPost.location}</span>
                  </span>
                )}
                {currentPost.location && <span>•</span>}
                <span className="shrink-0">
                  {moment(currentPost.createdAt).fromNow(true)}
                </span>
              </div>
            </div>
          </div>

          {/* Three dot owner menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-background transition-colors"
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
                  className="absolute right-0 top-full mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCreator ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          if (setEditPostData) setEditPostData(currentPost);
                          if (setShowEditPostModal) setShowEditPostModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-primary-50 hover:text-primary-600 transition-colors whitespace-nowrap"
                      >
                        <Edit className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span>Edit Memory</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setShowChangeCoverModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-primary-50 hover:text-primary-600 transition-colors whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span>Change Cover</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          if (handleDeletePost) handleDeletePost(currentPost);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100 mt-0.5 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete Memory</span>
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
                              currentPost.userId?._id || currentPost.userId,
                          });
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-text-primary hover transition-colors whitespace-nowrap"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>Report Memory</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── 2. MUSIC BAR (IF ATTACHED) ──────────────────────────────── */}
        {(audioSrc || songTitle) && (
          <div className="px-3 pt-2 pb-0.5 select-none">
            <div className="flex items-center justify-between rounded-xl bg-primary-50/70 border border-primary-100/70 px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Music2 className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-text-primary truncate leading-tight">
                    {songTitle || "Audio Track"}
                  </p>
                  {artistName && (
                    <p className="text-[9px] text-text-muted font-medium truncate">
                      {artistName}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (toggleAudio) toggleAudio(postId);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-xs hover:bg-primary-700 transition-transform active:scale-95 ml-1.5 shrink-0"
              >
                {isAudioPlaying ? (
                  <Pause className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                )}
              </button>

              {audioSrc && (
                <audio
                  ref={(el) => {
                    if (audioRefCallback) audioRefCallback(el);
                  }}
                  src={audioSrc}
                  preload="none"
                />
              )}
            </div>
          </div>
        )}

        {/* ─── 3. COVER IMAGE (16:9 Aspect Ratio) ───────────────────────── */}
        <div className="p-3 pt-2 select-none">
          <div className="group/cover relative w-full aspect-[16/9] bg-background rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80">
            {coverUrl ? (
              currentPost.mediaType === "video" ||
              coverUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={`${coverUrl}#t=0.1`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={currentPost.caption || currentPost.title || "Travel photo"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20">
                <MapPin className="w-6 h-6 text-primary-400 mb-1" />
                <p className="text-[11px] font-bold text-text-primary line-clamp-2 px-2">
                  {currentPost.caption || currentPost.title || "Travel Memory"}
                </p>
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
          {currentPost.title && (
            <h3 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1 font-heading leading-tight">
              {currentPost.title}
            </h3>
          )}

          {currentPost.caption && (
            <p className="text-xs text-text-secondary font-normal line-clamp-2 leading-relaxed break-words font-sans">
              {currentPost.caption}
            </p>
          )}

          {/* Location & Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-semibold text-text-muted">
            {currentPost.location && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background text-text-primary truncate max-w-[140px]">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="truncate">{currentPost.location}</span>
              </span>
            )}
            {travelDateFormatted && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background text-text-secondary">
                <Calendar className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>{travelDateFormatted}</span>
              </span>
            )}
            {currentPost.journeyId && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100/60">
                <Compass className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>Trip</span>
              </span>
            )}
          </div>
        </div>

        {/* ─── 5. SOCIAL ACTIONS FOOTER ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/60 select-none mt-auto font-sans">
          <div className="flex items-center gap-4">
            {/* Like / Felt */}
            <button
              type="button"
              disabled={Boolean(postId && feltLoadingMap?.[postId])}
              onClick={(e) => {
                e.stopPropagation();
                if (handleFelt && postId) handleFelt(postId);
              }}
              className={`inline-flex items-center gap-1 text-xs font-bold transition-transform active:scale-90 ${
                hasFelt
                  ? "text-brand"
                  : "text-text-secondary hover:text-brand"
              } ${postId && feltLoadingMap?.[postId] ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Felt this travel memory"
              aria-label={hasFelt ? "Remove Felt" : "Felt this travel memory"}
            >
              <Sparkles
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  hasFelt ? "fill-brand text-brand scale-110" : "text-text-muted"
                }`}
              />
              <span>{likesCount > 0 ? `${likesCount} Felt` : "Felt"}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onCardClick) {
                  onCardClick();
                } else if (handleOpenComments) {
                  handleOpenComments(postId);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary-600 transition-transform active:scale-90"
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
                if (handleDispatch) handleDispatch(postId);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary-600 transition-transform active:scale-90"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save */}
          <button
            type="button"
            disabled={saveLoadingMap[postId]}
            onClick={(e) => {
              e.stopPropagation();
              if (handleSaveToggle) handleSaveToggle(postId);
            }}
            className={`text-xs font-bold transition-transform active:scale-90 ${
              isSaved
                ? "text-primary-600"
                : "text-text-secondary hover:text-primary-600"
            }`}
            title={isSaved ? "Saved" : "Save Travel Memory"}
          >
            <Bookmark
              className={`w-4 h-4 transition-colors ${
                isSaved ? "fill-primary-600 text-primary-600" : ""
              }`}
            />
          </button>
        </div>
      </article>

      {/* Change Cover Modal */}
      {showChangeCoverModal && (
        <ChangeCoverModal
          isOpen={showChangeCoverModal}
          onClose={() => setShowChangeCoverModal(false)}
          memory={currentPost}
          onCoverUpdated={handleCoverUpdated}
        />
      )}
    </>
  );
};

export default ProfileMemoryCard;
