import React, { useRef } from "react";
import { X, Play, Pause, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const MemoryDetailModal = ({
  selectedMemory,
  setSelectedMemory,
  isPlayingAudio,
  setIsPlayingAudio,
  audioRef,
  likeAnimation,
  setLikeAnimation,
  handleLikeMemory,
  currentUser,
  toggleAudio,
}) => {
  const lastTapTime = useRef(0);

  if (!selectedMemory) return null;

  const handleImageClickLocal = (e) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      const hasLiked = selectedMemory.likes?.some(
        (id) => (id?._id || id)?.toString() === currentUser?._id
      );
      if (!hasLiked) {
        handleLikeMemory(selectedMemory._id);
      }
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1150);
    }
    lastTapTime.current = now;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md select-none">
        <button
          onClick={() => setSelectedMemory(null)}
          className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors z-50 bg-black/20 rounded-full cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-8 h-8" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          onClick={handleImageClickLocal}
        >
          {selectedMemory.mediaType === "video" ||
          (selectedMemory.image || selectedMemory.mediaUrl || selectedMemory.mediaUrls?.[0] || "").match(/\.(mp4|webm|mov)$/i) ? (
            <video
              src={selectedMemory.image || selectedMemory.mediaUrl || selectedMemory.mediaUrls?.[0]}
              controls
              autoPlay
              loop
              playsInline
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
          ) : (
            <img
              src={selectedMemory.image || selectedMemory.mediaUrl || selectedMemory.mediaUrls?.[0]}
              alt={selectedMemory.title || "Vibe Detail"}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
          )}

          <AnimatePresence>
            {likeAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
              >
                <span className="text-6xl drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                  ✨
                </span>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                >
                  Journey Felt
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-4 left-4 right-16">
            {selectedMemory.music && selectedMemory.music.title && (
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/40 p-2 pr-4 backdrop-blur-md shadow-sm max-w-sm cursor-pointer hover:bg-black/50 transition-colors"
                onClick={toggleAudio}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                  <img
                    loading="lazy"
                    src={selectedMemory.music.cover}
                    alt={selectedMemory.music.title}
                    className={`h-full w-full object-cover ${isPlayingAudio ? "animate-[spin_4s_linear_infinite]" : ""}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Music className="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="flex flex-col overflow-hidden text-white flex-1 min-w-0">
                  <span className="truncate text-xs font-extrabold flex items-center gap-2">
                    {selectedMemory.music.title}
                    {isPlayingAudio && (
                      <div className="music-bars text-white scale-[0.6] transform origin-left">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </span>
                  <span className="truncate text-[10px] font-semibold text-white/70">
                    {selectedMemory.music.artist}
                  </span>
                </div>
                {selectedMemory.music.preview && (
                  <button
                    onClick={toggleAudio}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    {isPlayingAudio ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLikeMemory(selectedMemory._id);
              setLikeAnimation(true);
              setTimeout(() => setLikeAnimation(false), 1150);
            }}
            className="absolute bottom-4 left-4 bg-black/60 hover:bg-black/80 transition-all backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white shadow-sm border border-white/20 cursor-pointer active:scale-95 z-20"
          >
            <span className="text-[18px] drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110 transition-transform">
              ✨
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {selectedMemory.likes?.length || 0} Felt This
            </span>
          </button>
          <audio
            ref={audioRef}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MemoryDetailModal;
