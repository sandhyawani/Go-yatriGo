import React from "react";
import { Music2, Pause, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LazyImage from "../../../common/LazyImage";
import { getTravelTag } from "../utils/feedHelpers";

const FeedMedia = ({
  post,
  playingAudioId,
  journeyLikeAnim,
  toggleAudio,
  handlePostTap,
  audioRefCallback,
}) => {
  const travelTag = getTravelTag(post);

  return (
    <>
      {/* Soundtrack of the Moment Preview */}
      {post.music?.title && (
        <div className="px-3.5 sm:px-5 mt-3 mb-1 relative z-10">
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-between rounded-xl border border-dashed border-amber-300/80 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white px-3 py-2 shadow-2xs transition-all duration-300 hover:border-amber-400"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <Music2 className="h-4 w-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase text-amber-700/80 tracking-wider">
                    Soundtrack
                  </span>
                </div>
                <p className="truncate text-[11.5px] font-bold text-slate-800">
                  {post.music.title}
                  {post.music.artist && (
                    <span className="font-normal text-slate-500 text-[10px] ml-1.5">
                      • {post.music.artist}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {post.music.preview && (
              <button
                type="button"
                aria-label={playingAudioId === post._id ? "Pause music" : "Play music"}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleAudio(post._id);
                }}
                className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white shadow-xs transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {playingAudioId === post._id ? (
                  <Pause className="h-3 w-3 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-3 w-3 fill-current" />
                )}
              </button>
            )}

            {post.music.preview && (
              <audio
                ref={(element) => audioRefCallback && audioRefCallback(element)}
                src={post.music.preview}
                onEnded={() => toggleAudio(post._id)}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Travel Tag */}
      {travelTag && (
        <div className="px-4 pb-2 sm:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
            <Sparkles className="h-3 w-3 text-amber-600" />
            {travelTag}
          </span>
        </div>
      )}

      {/* Keepsake Photo Print Frame */}
      <div className="px-3.5 sm:px-5 pt-2 pb-1">
        <div
          onClick={(event) => handlePostTap(event, post._id, post.likes)}
          style={{ touchAction: "manipulation" }}
          className="relative p-1.5 sm:p-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer select-none transition-all duration-300 group-hover:border-amber-200/70"
        >
          {/* Inner Photo Container */}
          <div className="relative overflow-hidden rounded-xl bg-slate-950">
            {post.mediaType === "video" ? (
              <video
                src={`${post.mediaUrl || post.image}#t=0.1`}
                controls
                controlsList="nodownload"
                playsInline
                muted
                preload="metadata"
                className="max-h-[460px] w-full bg-black object-cover"
              />
            ) : (
              <LazyImage
                src={post.mediaUrl || post.image}
                alt={post.location || post.caption || "Travel memory"}
                className="max-h-[460px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              />
            )}

            {/* Organic Scrapbook Stickers / Tags */}
            {post.tags?.length > 0 && (
              <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1.5 sm:left-3.5 sm:top-3.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={`${post._id}-${tag}`}
                    className="pointer-events-auto rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-[9.5px] font-bold text-white shadow-xs backdrop-blur-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Like Animation Overlay */}
            <AnimatePresence>
              {journeyLikeAnim?.postId === post._id && (
                <motion.div
                  key={journeyLikeAnim.key}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px]"
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: [0, 1.3, 1], rotate: [0, 12, 0] }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <Sparkles className="h-20 w-20 text-amber-300 fill-amber-300 drop-shadow-[0_0_20px_rgba(252,211,77,0.7)]" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 2.5] }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute w-24 h-24 rounded-full border-2 border-amber-300/60"
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.12, type: "spring", stiffness: 350, damping: 25 }}
                    className="mt-3 rounded-full border border-amber-200/40 bg-black/80 backdrop-blur-md px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-xl flex items-center gap-1.5"
                  >
                    <span>✨</span>
                    <span>Memory Felt</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(FeedMedia);
