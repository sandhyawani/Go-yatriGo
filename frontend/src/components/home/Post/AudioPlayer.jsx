import React from "react";
import { Music2, Play, Pause } from "lucide-react";

export const AudioPlayer = ({
  post,
  playingAudioId,
  toggleAudio,
  audioRefs,
  setPlayingAudioId,
}) => {
  if (!post.music || !post.music.title) return null;

  return (
    <div
      className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md rounded-full shadow-lg px-3 py-1.5 z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <Music2 className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" />
      <div className="flex flex-col max-w-[120px] sm:max-w-[150px]">
        <span className="truncate text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
          {post.music.title}
        </span>
        <span className="truncate text-[9px] text-slate-500 font-medium leading-tight">
          {post.music.artist}
        </span>
      </div>
      {post.music.preview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleAudio(post._id);
          }}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-md transition-all hover:scale-105 active:scale-95"
        >
          {playingAudioId === post._id ? (
            <Pause className="h-3 w-3 fill-current" />
          ) : (
            <Play className="h-3 w-3 fill-current ml-0.5" />
          )}
        </button>
      )}
      {post.music.preview && (
        <audio
          ref={(el) => {
            if (audioRefs && audioRefs.current) {
              audioRefs.current[post._id] = el;
            }
          }}
          src={post.music.preview}
          onEnded={() => setPlayingAudioId(null)}
        />
      )}
    </div>
  );
};

export default AudioPlayer;
