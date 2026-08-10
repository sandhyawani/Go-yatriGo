import { useState, useRef, useEffect } from "react";
import AudioManager from "../../utils/AudioManager";

export const useAudioPlayer = (memories) => {
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  const postRefs = useRef({});

  // Auto-pause when post goes off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;

          const audio = audioRefs.current[postId];
          if (!entry.isIntersecting) {
            if (audio && !audio.paused) {
              AudioManager.pause(postId);
              setPlayingAudioId((prev) => (prev === postId ? null : prev));
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const currentPostRefs = postRefs.current;
    Object.values(currentPostRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [memories]);

  const toggleAudio = (postId) => {
    if (AudioManager.isLocked()) return;
    const audio = audioRefs.current[postId];
    if (!audio) return;

    if (playingAudioId === postId) {
      AudioManager.pause(postId);
      setPlayingAudioId(null);
    } else {
      AudioManager.play(postId, audio);
      setPlayingAudioId(postId);
    }
  };

  const stopAllAudio = () => {
    AudioManager.stopAll();
    setPlayingAudioId(null);
  };

  useEffect(() => {
    return () => {
      AudioManager.stopAll();
    };
  }, []);

  return {
    playingAudioId,
    setPlayingAudioId,
    audioRefs,
    postRefs,
    toggleAudio,
    stopAllAudio,
  };
};

export default useAudioPlayer;
