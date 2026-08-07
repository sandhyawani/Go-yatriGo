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
      {/* Music Preview */}
      {post.music?.title && (
        <div className="px-4 sm:px-6 mt-4 mb-2 relative z-10">
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 shadow-sm transition-all duration-300 hover:border-brand-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 shadow-inner">
                <Music2 className="h-4 w-4 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  {post.music.title}
                </p>
                {post.music.artist && (
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
                    {post.music.artist}
                  </p>
                )}
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
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
              >
                {playingAudioId === post._id ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="ml-1 h-3.5 w-3.5 fill-current" />
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
        <div className="px-5 pb-3 sm:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
            <Sparkles className="h-3 w-3" />
            {travelTag}
          </span>
        </div>
      )}

      {/* Polaroid Media Frame */}
      <div
        onClick={(event) => handlePostTap(event, post._id, post.likes)}
        style={{ touchAction: "manipulation" }}
        className="relative mx-4 sm:mx-6 mt-4 mb-2 overflow-hidden rounded-md bg-white p-2 pb-8 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer select-none transform rotate-[0.5deg]"
      >
        {/* Tape Effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#E5E5DF] opacity-80 shadow-sm rotate-[-2deg] z-20">
          <div
            className="w-full h-full opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10zM10 0h10v10H10V0z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          ></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5"></div>
        </div>

        {/* Media */}
        {post.mediaType === "video" ? (
          <video
            src={`${post.mediaUrl || post.image}#t=0.1`}
            controls
            controlsList="nodownload"
            playsInline
            muted
            preload="metadata"
            className="h-[340px] sm:h-[420px] w-full bg-black object-cover"
          />
        ) : (
          <LazyImage
            src={post.mediaUrl || post.image}
            alt={post.location || post.caption || "Travel memory image"}
            className="h-[340px] sm:h-[420px] w-full object-cover rounded-sm transition-transform duration-500 group-hover:scale-[1.015]"
          />
        )}

        {/* Tags overlay */}
        {post.tags?.length > 0 && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 sm:left-4 sm:top-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={`${post._id}-${tag}`}
                className="pointer-events-auto rounded-full border border-white/10 bg-slate-950/55 px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[10px]"
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/10"
            >
              <Sparkles className="h-16 w-16 text-amber-400 drop-shadow-md" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-md"
              >
                Journey Felt
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default React.memo(FeedMedia);
