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
import { toHttps } from "../../../utils/toHttps";
import AudioManager from "../../../utils/AudioManager";
import ChangeCoverModal from "../../modals/ChangeCoverModal";

export const ProfileMemoryCard = ({
  memory,
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
  handleMemoryTap,
  handlePostTap,
  handleOpenComments,
  handleDispatch,
  handleSaveToggle,
  toggleAudio,
  setReportModal,
  setEditMemoryData,
  setEditPostData,
  setShowEditMemoryModal,
  setShowEditPostModal,
  handleDeleteMemory,
  handleDeletePost,
  handleAvatarError,
  audioRefCallback,
  onCardClick,
  onMemoryUpdated,
  onPostUpdated,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const initialMemory = memory || post;
  const [localMemory, setLocalMemory] = useState(initialMemory);
  const menuRef = useRef(null);

  useEffect(() => {
    setLocalMemory(memory || post);
  }, [memory, post]);

  const currentMemory = localMemory || initialMemory;
  const memoryId = (currentMemory?._id || currentMemory?.id)?.toString();
  const isAudioPlaying = Boolean(memoryId && playingAudioId === memoryId);

  const coverUrl = toHttps(
    currentMemory.image ||
    currentMemory.mediaUrl ||
    currentMemory.img ||
    (Array.isArray(currentMemory.mediaUrls) && currentMemory.mediaUrls[0]) ||
    ""
  );

  const likesCount = Array.isArray(currentMemory.likes)
    ? currentMemory.likes.length
    : typeof currentMemory.likesCount === "number"
    ? currentMemory.likesCount
    : 0;

  const commentsCount =
    typeof currentMemory.commentsCount === "number"
      ? currentMemory.commentsCount
      : Array.isArray(currentMemory.comments)
      ? currentMemory.comments.length
      : totalCommentsCount || 0;

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
    currentMemory.userName ||
    currentMemory.userId?.name ||
    currentMemory.userId?.username ||
    "Traveler";

  const authorAvatar = toHttps(
    currentMemory.userPic ||
    currentMemory.userId?.pic ||
    currentMemory.userId?.avatar ||
    getAvatarUrl(currentMemory.userId || currentMemory)
  );

  const audioSrc = toHttps(
    currentMemory.music?.preview ||
    currentMemory.audio ||
    currentMemory.audioUrl ||
    currentMemory.songUrl
  );

  const songTitle =
    currentMemory.music?.title ||
    (typeof currentMemory.song === "object"
      ? currentMemory.song?.title || currentMemory.song?.name
      : typeof currentMemory.song === "string"
      ? currentMemory.song
      : null);

  const artistName =
    currentMemory.music?.artist ||
    (typeof currentMemory.song === "object"
      ? currentMemory.song?.artist
      : null);

  const handleCoverUpdated = (updatedMemory) => {
    setLocalMemory((prev) => ({
      ...prev,
      ...updatedMemory,
    }));
    if (onMemoryUpdated) {
      onMemoryUpdated(updatedMemory);
    } else if (onPostUpdated) {
      onPostUpdated(updatedMemory);
    }
  };

  const travelDateFormatted = currentMemory.createdAt
    ? moment(currentMemory.createdAt).format("MMM D, YYYY")
    : null;

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
    if (now - lastFeltTriggerTimeRef.current < 350) return;
    if (memoryId && feltLoadingMap?.[memoryId]) return;
    lastFeltTriggerTimeRef.current = now;

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

    if (handleFelt && memoryId) {
      handleFelt(memoryId);
    }
  };

  const handleMouseDown = (e) => {
    if (e.detail > 1) {
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    if (Date.now() - lastTouchHandledTimeRef.current < 500) {
      return;
    }

    if (e.detail === 2) {
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

    if (touchStartRef.current.isScrolling) {
      return;
    }

    const touch = e.changedTouches[0];
    const now = Date.now();
    const touchDuration = now - touchStartRef.current.time;

    if (touchDuration > 500) return;

    const lastTap = lastTapRef.current;
    const timeSinceLastTap = now - lastTap.time;
    const dx = Math.abs(touch.clientX - lastTap.x);
    const dy = Math.abs(touch.clientY - lastTap.y);

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
        <AnimatePresence>
          {(heartAnim || (journeyLikeAnim?.postId === memoryId && journeyLikeAnim)) && (
            <motion.div
              key={heartAnim?.key || journeyLikeAnim?.key || memoryId}
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
                {currentMemory.location && (
                  <span className="flex items-center gap-0.5 text-text-secondary truncate max-w-[130px]">
                    <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                    <span className="truncate">{currentMemory.location}</span>
                  </span>
                )}
                {currentMemory.location && <span>•</span>}
                <span className="shrink-0">
                  {moment(currentMemory.createdAt).fromNow(true)}
                </span>
              </div>
            </div>
          </div>

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
                          if (setEditMemoryData) setEditMemoryData(currentMemory);
                          else if (setEditPostData) setEditPostData(currentMemory);
                          if (setShowEditMemoryModal) setShowEditMemoryModal(true);
                          else if (setShowEditPostModal) setShowEditPostModal(true);
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
                          if (handleDeleteMemory) handleDeleteMemory(currentMemory);
                          else if (handleDeletePost) handleDeletePost(currentMemory);
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
                            targetId: memoryId,
                            targetType: "post",
                            reportedUserId:
                              currentMemory.userId?._id || currentMemory.userId,
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
                  if (toggleAudio) toggleAudio(memoryId);
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
                  onEnded={() => {
                    AudioManager.stop(memoryId);
                  }}
                  onError={(e) => {
                    AudioManager.stop(memoryId);
                    if (process.env.NODE_ENV === "development") {
                      console.warn("ProfileMemoryCard audio element error:", audioSrc, e);
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

        <div className="p-3 pt-2 select-none">
          <div className="group/cover relative w-full aspect-[4/3] bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80">
            {coverUrl ? (
              currentMemory.mediaType === "video" ||
              coverUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={`${coverUrl}#t=0.1`}
                  className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <>
                  <img
                    src={coverUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
                  />
                  <img
                    src={coverUrl}
                    alt={currentMemory.caption || currentMemory.title || "Travel photo"}
                    loading="lazy"
                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20">
                <MapPin className="w-6 h-6 text-primary-400 mb-1" />
                <p className="text-[11px] font-bold text-text-primary line-clamp-2 px-2">
                  {currentMemory.caption || currentMemory.title || "Travel Memory"}
                </p>
              </div>
            )}

            {isCreator && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangeCoverModal(true);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold backdrop-blur-md shadow-sm opacity-0 group-hover/cover:opacity-100 transition-all duration-200 active:scale-95 z-20"
              >
                <Camera className="w-3 h-3 text-primary-300" />
                <span>Change Cover</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-3.5 pb-2 text-left space-y-1.5 font-sans">
          {(currentMemory.caption || currentMemory.title) && (
            <p className="text-xs text-text-primary font-medium line-clamp-2 leading-relaxed break-words font-sans">
              {currentMemory.caption || currentMemory.title}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-semibold text-text-muted">
            {currentMemory.location && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background text-text-primary truncate max-w-[140px]">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span className="truncate">{currentMemory.location}</span>
              </span>
            )}
            {travelDateFormatted && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background text-text-secondary">
                <Calendar className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>{travelDateFormatted}</span>
              </span>
            )}
            {currentMemory.journeyId && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100/60">
                <Compass className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                <span>Trip</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/60 select-none mt-auto font-sans">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={Boolean(memoryId && feltLoadingMap?.[memoryId])}
              onClick={(e) => {
                e.stopPropagation();
                if (handleFelt && memoryId) handleFelt(memoryId);
              }}
              className={`inline-flex items-center gap-1 text-xs font-bold transition-transform active:scale-90 ${
                hasFelt
                  ? "text-brand"
                  : "text-text-secondary hover:text-brand"
              } ${memoryId && feltLoadingMap?.[memoryId] ? "opacity-50 cursor-not-allowed" : ""}`}
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

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onCardClick) {
                  onCardClick();
                } else if (handleOpenComments) {
                  handleOpenComments(memoryId);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary-600 transition-transform active:scale-90"
              title="Comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (handleDispatch) handleDispatch(memoryId);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary-600 transition-transform active:scale-90"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            disabled={saveLoadingMap[memoryId]}
            onClick={(e) => {
              e.stopPropagation();
              if (handleSaveToggle) handleSaveToggle(memoryId);
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

      {showChangeCoverModal && (
        <ChangeCoverModal
          isOpen={showChangeCoverModal}
          onClose={() => setShowChangeCoverModal(false)}
          memory={currentMemory}
          onCoverUpdated={handleCoverUpdated}
        />
      )}
    </>
  );
};

export default ProfileMemoryCard;
