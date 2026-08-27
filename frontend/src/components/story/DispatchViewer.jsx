import { showToast } from "../../utils/showToast";
import ReportModal from "../modals/ReportModal";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
X,
Music,
VolumeX,
Volume2,
Edit2,
Trash2,
Loader2,
Send,
ChevronLeft,
ChevronRight,
ShieldAlert,
MoreVertical } from
"lucide-react";
import moment from "moment";
import axios from "../../api/axios";
import { getAvatarUrl } from "../../utils/avatar";
import AudioManager from "../../utils/AudioManager";
import StorySticker from "./StorySticker";
import { SocketContext } from "../../context/SocketContext";
import { useContext } from "react";

const DispatchViewer = ({
  activeStoryGroup,
  activeStoryIndex,
  myUserId,
  isStoryMuted,
  setIsStoryMuted,
  handleDeleteStory,
  setShowViewersList,
  isStoryPaused,
  setIsStoryPaused,
  closeStoryViewer,
  nextStory,
  prevStory,
  dispatches,
  onStoryViewed,
  fetchFeedData
}) => {
  const [storyMediaLoaded, setStoryMediaLoaded] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [showViewersLocal, setShowViewersLocal] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [replyingToStory, setReplyingToStory] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(null);


  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionInput, setCaptionInput] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);
  const [isDeletingStoryModal, setIsDeletingStoryModal] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);

  const socket = useContext(SocketContext);

  const currentStory = activeStoryGroup?.stories?.[activeStoryIndex];


  const handleOpenEditCaption = (e) => {
    e?.stopPropagation();
    setCaptionInput(currentStory?.caption || "");
    setIsStoryPaused(true);
    setShowMoreMenu("edit");
  };

  const handleSaveCaption = async () => {
    if (!currentStory?._id) return;
    setSavingCaption(true);
    try {
      await axios.put(
      `/social/story/${currentStory._id}`,
      { caption: captionInput },
      { withCredentials: true }
      );
      currentStory.caption = captionInput;
      showToast.success("Caption updated!");
      fetchFeedData?.();
      setShowMoreMenu(null);
      setIsStoryPaused(false);
    } catch {
      showToast.error("Failed to update caption");
    } finally {
      setSavingCaption(false);
    }
  };


  const handleOpenDeleteStory = (e) => {
    e?.stopPropagation();
    setIsStoryPaused(true);
    setShowMoreMenu("delete");
  };

  const handleConfirmDeleteStory = async () => {
    if (!currentStory?._id) return;
    setDeletingStory(true);
    try {
      const res = await axios.delete(
      `/social/story/${currentStory._id}`,
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success("Dispatch deleted successfully!");
        if (typeof handleDeleteStory === "function") {
          try {handleDeleteStory(currentStory._id);} catch {}
        }
        setShowMoreMenu(null);
        closeStoryViewer();
        fetchFeedData?.();
      }
    } catch {
      showToast.error("Failed to delete Dispatch.");
    } finally {
      setDeletingStory(false);
      setIsStoryPaused(false);
    }
  };


  useEffect(() => {
    if (activeStoryGroup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeStoryGroup]);


  const handleStoryReply = async () => {
    if (!storyReplyText.trim() || !activeStoryGroup) return;
    setReplyingToStory(true);
    try {
      const currentStory = activeStoryGroup.stories[activeStoryIndex];
      const targetUserId = (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString();
      const res = await axios.post(
      `/social/story/reply/${targetUserId}`,
      { text: storyReplyText, storyId: currentStory?._id },
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success(
        `Reply sent to ${activeStoryGroup.userName.split(" ")[0]}! 💬`
        );
        setStoryReplyText("");

        window.dispatchEvent(new CustomEvent("refresh_chats"));
        if (res.data.chatMessage) {
          window.dispatchEvent(new CustomEvent("message_sent", { detail: res.data.chatMessage }));
        }
      }
    } catch {
      showToast.error("Failed to send reply");
    } finally {
      setReplyingToStory(false);
    }
  };


  const handleStoryReaction = async (emoji) => {
    if (!activeStoryGroup) return;
    try {
      const currentStory = activeStoryGroup.stories[activeStoryIndex];
      const res = await axios.post(
      `/social/story/${currentStory?._id}/react`,
      { emoji },
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success(`${emoji} Sent!`);

        window.dispatchEvent(new CustomEvent("refresh_chats"));
        if (res.data.chatMessage) {
          window.dispatchEvent(new CustomEvent("message_sent", { detail: res.data.chatMessage }));
        }
      }
    } catch {
      showToast.error("Failed to send reaction");
    }
  };

  const handleAvatarError = useCallback((e, name) => {
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=8b5cf6&color=fff`;
  }, []);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const pointerDownTime = useRef(0);
  const pointerStartPos = useRef({ x: 0, y: 0 });
  const storyProgressRef = useRef(0);
  const animFrameRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();


  useEffect(() => {
    if (!activeStoryGroup || !myUserId) return;
    const currentStory = activeStoryGroup.stories[activeStoryIndex];
    if (currentStory && String(activeStoryGroup.userId) !== String(myUserId)) {
      if (!currentStory.viewedBy?.includes(myUserId)) {
        if (!currentStory.viewedBy) currentStory.viewedBy = [];
        currentStory.viewedBy.push(myUserId);
        axios
        .post(
        `/social/story/${currentStory._id}/view`,
        {},
        { withCredentials: true }
        )
        .then(() => onStoryViewed?.(currentStory._id))
        .catch(() => {});
      }
    }
  }, [activeStoryGroup, activeStoryIndex, myUserId, onStoryViewed]);


  useEffect(() => {
    const handle = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, []);


  useEffect(() => {
    AudioManager.stopAll();
    AudioManager.lock();
    return () => {
      AudioManager.stopAll();
      AudioManager.unlock();
    };
  }, []);


  useEffect(() => {
    const handle = (e) => {
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") nextStory();else
      if (e.key === "ArrowLeft") prevStory();else
      if (e.key === "Escape") closeStoryViewer();else
      if (e.key === " ") {
        e.preventDefault();
        setIsStoryPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [nextStory, prevStory, closeStoryViewer, setIsStoryPaused]);


  useEffect(() => {
    setStoryProgress(0);
    storyProgressRef.current = 0;
    setStoryMediaLoaded(false);
    setShowMoreMenu(null);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const currentStory = activeStoryGroup?.stories?.[activeStoryIndex];
    const isVideo = currentStory?.mediaType === "video";

    if (!isVideo && currentStory?.song?.audioUrl) {
      AudioManager.stopAll();
      const audio = new Audio(currentStory.song.audioUrl);
      audio.loop = true;
      audio.currentTime = 0;

      audio.muted = isStoryMuted;
      AudioManager.play("story-preview", audio, { source: "story" });
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [activeStoryGroup, activeStoryIndex]);


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isStoryMuted;

      if (
      !isStoryMuted &&
      !isStoryPaused &&
      isTabActive &&
      audioRef.current.paused)
      {
        AudioManager.play("story-preview", audioRef.current, {
          source: "story"
        });
      }
    }
  }, [isStoryMuted, isStoryPaused, isTabActive]);


  useEffect(() => {
    if (audioRef.current) {
      if (isStoryPaused || !isTabActive) {
        audioRef.current.pause();
      } else {
        AudioManager.play("story-preview", audioRef.current, {
          source: "story"
        });
      }
    }
  }, [isStoryPaused, isTabActive]);


  useEffect(() => {
    if (
    !activeStoryGroup ||
    isStoryPaused ||
    !storyMediaLoaded ||
    !isTabActive)
    {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const IMAGE_STORY_DURATION = 30000;
    const isVideo =
    activeStoryGroup.stories[activeStoryIndex]?.mediaType === "video";
    const duration = isVideo ?
    videoRef.current?.duration ?
    videoRef.current.duration * 1000 :
    15000 :
    IMAGE_STORY_DURATION;
    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      storyProgressRef.current += (now - lastTime) / duration * 100;
      lastTime = now;
      if (storyProgressRef.current >= 100) {
        storyProgressRef.current = 100;
        setStoryProgress(100);
        nextStory();
      } else {
        setStoryProgress(storyProgressRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
  activeStoryGroup,
  activeStoryIndex,
  isStoryPaused,
  storyMediaLoaded,
  isTabActive,
  nextStory]
  );

  const handlePointerDown = useCallback(
  (e) => {
    pointerDownTime.current = Date.now();
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    setIsStoryPaused(true);
    videoRef.current?.pause();
    audioRef.current?.pause();
  },
  [setIsStoryPaused]
  );

  const handlePointerUp = useCallback(
  (e, direction) => {
    setIsStoryPaused(false);
    if (videoRef.current && isTabActive)
    videoRef.current.play().catch(() => {});
    if (audioRef.current && isTabActive)
    AudioManager.play("story-preview", audioRef.current, {
      source: "story"
    });
    const dx = Math.abs(e.clientX - pointerStartPos.current.x);
    const dy = Math.abs(e.clientY - pointerStartPos.current.y);
    if (dx > 20 || dy > 20) return;
    if (Date.now() - pointerDownTime.current < 250) {
      if (direction === "prev") prevStory();else
      if (direction === "next") nextStory();
    }
  },
  [setIsStoryPaused, isTabActive, prevStory, nextStory]
  );

  const handleDragEnd = useCallback(
  (_, info) => {
    const { offset, velocity } = info;
    if (offset.y > 50 || velocity.y > 500) closeStoryViewer();else
    if (offset.x > 50 || velocity.x > 500) prevStory();else
    if (offset.x < -50 || velocity.x < -500) nextStory();
  },
  [closeStoryViewer, prevStory, nextStory]
  );

  useEffect(() => {
    if (currentStory) {
    }
  }, [currentStory]);

  if (!activeStoryGroup) return null;

  const isVideo = currentStory?.mediaType === "video";
  const mediaUrl = currentStory?.media;
  const isOwnStory = String(activeStoryGroup.userId) === String(myUserId);
  const totalStories = activeStoryGroup.stories?.length ?? 1;

  return createPortal(
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[99999] flex items-center justify-center overflow-hidden">

      {}
      <button
    onClick={prevStory}
    className="hidden sm:flex absolute left-4 z-50 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-sm"
    aria-label="Previous story">

        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
    onClick={nextStory}
    className="hidden sm:flex absolute right-4 z-50 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-sm"
    aria-label="Next story">

        <ChevronRight className="w-5 h-5" />
      </button>

      <motion.div
    drag
    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
    dragElastic={0.35}
    onDragEnd={handleDragEnd}
    className="relative w-full h-full max-w-[430px] mx-auto sm:h-[95vh] sm:rounded-[36px] overflow-hidden bg-black flex flex-col shadow-2xl ring-1 ring-white/10">

        {}
        <div className="absolute top-3 inset-x-3 z-40 flex gap-1">
          {activeStoryGroup.stories?.map((st, idx) =>
        <div
        key={st._id}
        className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden">

              <div
          className="h-full bg-white rounded-full transition-none"
          style={{
            width:
            idx < activeStoryIndex ?
            "100%" :
            idx === activeStoryIndex ?
            `${storyProgress}%` :
            "0%"
          }} />

            </div>
        )}
        </div>

        {}
        <div className="absolute top-7 inset-x-3 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-brand-400 via-brand-500 to-brand-600 shrink-0">
              <div className="w-full h-full rounded-full border-[1.5px] border-black overflow-hidden bg-zinc-800">
                <img
              src={getAvatarUrl(
              activeStoryGroup.userPic,
              null,
              activeStoryGroup.userName
              )}
              alt={activeStoryGroup.userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeStoryGroup.userName || "Explorer")}&background=8b5cf6&color=fff&bold=true`;
              }} />

              </div>
            </div>
            <div style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
              <h4 className="text-[13px] font-bold text-white leading-none flex items-center gap-1">
                {activeStoryGroup.userName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/70 font-medium flex items-center gap-1.5">
                  <span>{moment(currentStory?.createdAt).fromNow()}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span className="text-white/90">
                    {(() => {
                    const expiresAt = moment(currentStory?.createdAt).add(
                    24,
                    "hours"
                    );
                    const now = moment();
                    const diffHours = expiresAt.diff(now, "hours");
                    if (diffHours > 0) return `${diffHours}h remaining`;
                    const diffMinutes = expiresAt.diff(now, "minutes");
                    if (diffMinutes > 0) return `${diffMinutes}m remaining`;
                    return "Expiring soon";
                  })()}
                  </span>
                </span>
                {currentStory?.visibility &&
              <span className="text-[9px] font-bold text-white/90 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                    {currentStory.visibility === "public" ?
                "🌍 Public" :
                currentStory.visibility === "friends" ?
                "👥 Trip Mates" :
                "🔒 Private"}
                  </span>}

              </div>
            </div>
          </div>
          <button
        onClick={closeStoryViewer}
        className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-white transition-colors"
        aria-label="Close">

            <X className="w-4 h-4" />
          </button>
        </div>

        {}
        <div
      className="absolute inset-y-0 left-0 w-1/3 z-20 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => handlePointerUp(e, "prev")}
      onPointerCancel={() => setIsStoryPaused(false)} />

        <div
      className="absolute inset-y-0 right-0 w-1/3 z-20 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => handlePointerUp(e, "next")}
      onPointerCancel={() => setIsStoryPaused(false)} />

        <div
      className="absolute inset-y-0 left-1/3 right-1/3 z-20 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => handlePointerUp(e, "none")}
      onPointerCancel={() => setIsStoryPaused(false)} />


        {}
        <div className="w-full h-full flex items-center justify-center relative bg-black">
          {!storyMediaLoaded &&
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>}


          {}
          {mediaUrl &&
        <div
        className="absolute inset-0 z-0 overflow-hidden opacity-25"
        aria-hidden>

              {isVideo ?
          <video
          src={mediaUrl}
          muted
          loop
          playsInline
          className="w-full h-full object-cover blur-[40px] scale-110 brightness-50" /> :


          <img
          src={mediaUrl}
          alt=""
          className="w-full h-full object-cover blur-[40px] scale-110 brightness-50" />}


            </div>}


          {}
          <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
            {isVideo ?
          <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          loop={false}
          muted={isStoryMuted}
          playsInline
          className="w-full h-full object-contain"
          onLoadedMetadata={() => setStoryMediaLoaded(true)} /> :


          <img
          src={mediaUrl}
          alt="Dispatch"
          className="w-full h-full object-contain"
          onLoad={() => setStoryMediaLoaded(true)} />}


          </div>

          {}
          <AnimatePresence>
            {storyMediaLoaded &&
          currentStory?.song &&
          !currentStory?.stickers?.some((s) => s.type === "music") &&
          <motion.div
          drag={isOwnStory}
          dragConstraints={{ top: 0, left: 0, right: 200, bottom: 600 }}
          dragElastic={0.2}
          onDragStart={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className={`absolute top-20 left-4 bg-black/50 backdrop-blur-xl border border-white/20 text-white px-3 py-1.5 rounded-2xl flex items-center gap-2 max-w-[180px] z-[60] shadow-lg ${isOwnStory ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}>

                  <Music className="w-3 h-3 text-rose-400 shrink-0" />
                  <div className="overflow-hidden min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      {currentStory.song.songTitle}
                    </p>
                    <p className="text-[9px] text-white/60 truncate">
                      {currentStory.song.artistName}
                    </p>
                  </div>
                </motion.div>}

          </AnimatePresence>

          {}
          {(isVideo || currentStory?.song) &&
        <button
        onClick={(e) => {
          e.stopPropagation();
          setIsStoryMuted((m) => !m);

          if (
          isStoryMuted &&
          audioRef.current &&
          audioRef.current.paused)
          {
            audioRef.current.play().catch(() => {});
          }
        }}
        className="absolute top-20 right-4 z-40 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white transition-colors"
        aria-label={isStoryMuted ? "Unmute" : "Mute"}>

              {isStoryMuted ?
          <VolumeX className="w-3.5 h-3.5" /> :

          <Volume2 className="w-3.5 h-3.5" />}

            </button>}


          {}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <AnimatePresence mode="wait">
              {storyMediaLoaded && currentStory?.stickers?.length > 0 ?
            currentStory.stickers.map((sticker, idx) =>
            <StorySticker
            key={sticker.id || sticker._id || idx}
            sticker={sticker}
            mode="viewer" />

            ) :

            storyMediaLoaded &&
            currentStory?.caption &&
            <motion.div
            key={activeStoryIndex + "-legacy"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            className={`absolute w-full px-5 text-center font-black text-xl z-30 tracking-tight pointer-events-none leading-snug
                      ${currentStory.captionPosition === "top" ? "top-32" : currentStory.captionPosition === "bottom" ? "bottom-32" : "top-1/2 -translate-y-1/2"}
                      ${currentStory.captionColor === "black" ? "text-black" : currentStory.captionColor === "purple" ? "text-brand-400" : "text-white"}`}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>

                      {currentStory.caption}
                    </motion.div>}

            </AnimatePresence>
          </div>
        </div>

        {}
        <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pt-10 pb-8 sm:pb-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
          {!isOwnStory ?
        <div className="pointer-events-auto flex flex-col gap-3 w-full">
              {}
              <div className="flex justify-center gap-3">
                {["✨", "🔥", "😍", "😂", "🌍"].map((emoji, i) =>
            <motion.button
            key={emoji}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: "spring" }}
            whileHover={
            prefersReducedMotion ? {} : { scale: 1.2, y: -4 }}

            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              handleStoryReaction(emoji);
            }}
            className="text-2xl min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full"
            aria-label={`React ${emoji}`}>

                    {emoji}
                  </motion.button>
            )}
              </div>
              {}
              <div className="flex gap-2 items-center">
                <button
            onClick={(e) => {
              e.stopPropagation();
              setIsStoryPaused(true);
              setReportModal({ isOpen: true });
            }}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-rose-500/80 text-white border border-white/20 rounded-full transition-all shrink-0"
                  aria-label="Report Dispatch"
                  title="Report Dispatch">

                  <ShieldAlert className="w-4 h-4" />
                </button>
                <input
            type="text"
            value={storyReplyText}
            onChange={(e) => setStoryReplyText(e.target.value)}
            placeholder={`Reply to ${activeStoryGroup.userName.split(" ")[0]}...`}
            className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full pl-4 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/50 outline-none focus:bg-white/15 focus:border-white/35 transition-all min-h-[40px]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && storyReplyText.trim())
              handleStoryReply();
            }}
            aria-label="Reply to story" />

                <button
            onClick={handleStoryReply}
            disabled={replyingToStory || !storyReplyText.trim()}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-brand-500 to-brand-600 text-white rounded-full disabled:opacity-40 transition-all shrink-0 hover:scale-105 active:scale-95"
            aria-label="Send">

                  {replyingToStory ?
              <Loader2 className="w-4 h-4 animate-spin" /> :

              <Send className="w-4 h-4" />}

                </button>
              </div>
            </div> :

        <div className="pointer-events-auto flex items-center justify-between w-full">
              <button
          onClick={(e) => {
            e.stopPropagation();
            setShowViewersLocal(true);
            setIsStoryPaused(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-[12px] font-semibold transition-all backdrop-blur-sm"
          aria-label="View viewers">

                👁️{" "}
                <span>
                  {currentStory?.viewers?.length > 0 ?
              `${currentStory.viewers.length} Views` :
              "No views"}
                </span>
              </button>
              <div className="relative">
                <button
            onClick={(e) => {
              e.stopPropagation();
              if (showMoreMenu) {
                setShowMoreMenu(null);
                setIsStoryPaused(false);
              } else {
                setShowMoreMenu("menu");
                setIsStoryPaused(true);
              }
            }}
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all hover:scale-105 active:scale-95"
            aria-label="More options"
            title="More options">

                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence mode="wait">
                  {showMoreMenu === "menu" &&
                <motion.div
                key="menu"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="absolute bottom-12 right-0 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[70]">

                    <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditCaption(e);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors text-left">

                      <Edit2 className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="text-sm font-semibold">Edit Caption</span>
                    </button>
                    <div className="h-px bg-white/10 mx-3" />
                    <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteStory(e);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/15 transition-colors text-left">

                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-semibold">Delete Dispatch</span>
                    </button>
                  </motion.div>}

                  {showMoreMenu === "edit" &&
                <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-12 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-[70] p-4 space-y-3">

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-brand-400" />
                        <span className="text-sm font-bold text-white">Edit Caption</span>
                      </div>
                      <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(null);
                    setIsStoryPaused(false);
                  }}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                  rows={2}
                  maxLength={150}
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Enter caption..."
                  className="w-full bg-slate-800/90 border border-white/15 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 resize-none transition-all"
                  autoFocus
                  onClick={(e) => e.stopPropagation()} />
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-slate-500">
                        {captionInput.length}/150
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(null);
                    setIsStoryPaused(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                      <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveCaption();
                  }}
                  disabled={savingCaption}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-brand-500/25 active:scale-95 transition-all flex items-center gap-1.5">
                        {savingCaption ?
                    <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> :
                    "Save"}
                      </button>
                    </div>
                  </motion.div>}

                  {showMoreMenu === "delete" &&
                <motion.div
                key="delete"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-12 right-0 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-[70] p-4 space-y-3 text-center">

                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Delete Dispatch?</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">This can't be undone.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(null);
                    setIsStoryPaused(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all">
                        Cancel
                      </button>
                      <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDeleteStory();
                  }}
                  disabled={deletingStory}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                        {deletingStory ?
                    <><Loader2 className="w-3 h-3 animate-spin" /> ...</> :
                    "Delete"}
                      </button>
                    </div>
                  </motion.div>}

                </AnimatePresence>
              </div>
            </div>}

        </div>
      </motion.div>

      {/* Old edit/delete modals removed - now inline in the ⋮ popup */}

      {reportModal.isOpen &&
    <ReportModal
    isOpen={reportModal.isOpen}
    onClose={() => {
      setReportModal({ isOpen: false });
      setIsStoryPaused(false);
    }}
    targetId={currentStory?._id}
    targetType="story"
    reportedUserId={activeStoryGroup?.userId} />}



      {}
      <AnimatePresence>
        {showViewersLocal &&
      activeStoryGroup &&
      (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString() === String(myUserId) &&
      <>
              <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100000] bg-black/40"
        onClick={() => {
          setShowViewersLocal(false);
          setIsStoryPaused(false);
        }} />

              <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 sm:max-w-[430px] sm:mx-auto h-auto max-h-[60vh] min-h-[220px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-t-[32px] z-[100001] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border-t border-white/20 dark:border-white/5">

                <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-12 h-1.5 bg-slate-300/50 dark:bg-slate-600/50 rounded-full" />
                </div>

                <div className="px-5 pb-3 pt-1 border-b border-slate-200/30 dark:border-slate-700/30 flex items-center justify-between shrink-0">
                  <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <span className="text-xl">👁</span> Viewers
                    <span className="text-xs bg-slate-100/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {activeStoryGroup.stories[activeStoryIndex]?.viewers?.length ?? 0}
                    </span>
                  </h3>
                  <button
            onClick={() => {
              setShowViewersLocal(false);
              setIsStoryPaused(false);
            }}
            aria-label="Close viewers"
            className="p-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-700/80 dark:hover:bg-slate-600/80 rounded-full text-slate-500 dark:text-slate-300 transition-colors">

                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-none pointer-events-auto">
                  {!activeStoryGroup.stories[activeStoryIndex]?.viewers?.length ?
            <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-slate-500 dark:text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <p className="font-bold text-[15px] text-slate-700 dark:text-slate-300">No viewers yet</p>
                      <p className="text-xs text-center mt-1 px-4 opacity-80 leading-relaxed">When someone views your story,<br />they'll appear here.</p>
                    </div> :

            <div className="space-y-1 p-2">
                      {activeStoryGroup.stories[activeStoryIndex].viewers.map((v) => {
                const reaction = activeStoryGroup.stories[activeStoryIndex].storyReactions?.find(
                (r) => r.userId?._id === v.userId?._id || r.userId === v.userId?._id
                );
                return (
                  <div key={v._id || v.userId?._id} className="flex items-center justify-between p-2.5 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                              <img
                      loading="lazy"
                      src={getAvatarUrl(v.userId?.pic, v.userId?.img, v.userId?.name)}
                      alt={v.userId?.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                      onError={(e) => handleAvatarError(e, v.userId?.name)} />

                              <div>
                                <p className="text-[14px] font-bold text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors">
                                  {v.userId?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  Viewed {moment(v.viewedAt).fromNow()}
                                </p>
                              </div>
                            </div>
                            {reaction &&
                    <div className="text-2xl animate-bounce drop-shadow-sm">
                                {reaction.emoji}
                              </div>}

                          </div>);

              })}
                    </div>}

                </div>
              </motion.div>
            </>}

      </AnimatePresence>
    </motion.div>,
  document.body
  );
};

export default DispatchViewer;