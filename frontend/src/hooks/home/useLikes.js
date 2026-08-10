import { useState, useCallback, useRef } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";

export const useLikes = (myUserId, setMemories) => {
  const [likeLoadingMap, setLikeLoadingMap] = useState({});
  const [journeyLikeAnim, setJourneyLikeAnim] = useState(null);
  const lastTapTime = useRef({});

  const handleLike = useCallback(async (postId) => {
    if (lastTapTime.current[`like_${postId}`]) return;
    lastTapTime.current[`like_${postId}`] = true;

    setLikeLoadingMap((prev) => ({ ...prev, [postId]: true }));

    // Optimistic Update
    setMemories((prev) =>
      prev.map((m) => {
        if (m._id === postId) {
          const hasLiked = m.likes?.some(
            (id) => (id?._id || id)?.toString() === myUserId
          );
          const newLikes = hasLiked
            ? (m.likes || []).filter(
                (id) => (id?._id || id)?.toString() !== myUserId
              )
            : [...(m.likes || []), myUserId];
          return { ...m, likes: newLikes };
        }
        return m;
      })
    );

    try {
      const res = await homeService.likePost(postId);
      if (res.data.success) {
        const updatedLikes = res.data.memory?.likes || res.data.post?.likes;
        if (updatedLikes) {
          setMemories((prev) =>
            prev.map((m) => (m._id === postId ? { ...m, likes: updatedLikes } : m))
          );
        }
      }
    } catch (err) {
      showToast.error("Failed to update like");
    } finally {
      setLikeLoadingMap((prev) => ({ ...prev, [postId]: false }));
      lastTapTime.current[`like_${postId}`] = false;
    }
  }, [myUserId, setMemories]);

  const handleDoubleTapLike = useCallback((postId, likes, tapPoint) => {
    const hasLiked = likes?.some(
      (id) => (id?._id || id)?.toString() === myUserId
    );
    if (!hasLiked) handleLike(postId);

    setJourneyLikeAnim({
      postId,
      x: tapPoint?.x ?? 50,
      y: tapPoint?.y ?? 50,
      key: Date.now(),
    });

    window.setTimeout(() => setJourneyLikeAnim(null), 1150);
  }, [myUserId, handleLike]);

  const handlePostTap = useCallback((e, postId, likes) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[postId] || 0;

    if (now - lastTap < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapPoint = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
      handleDoubleTapLike(postId, likes, tapPoint);
      lastTapTime.current[postId] = 0;
    } else {
      lastTapTime.current[postId] = now;
    }
  }, [handleDoubleTapLike]);

  return {
    likeLoadingMap,
    setLikeLoadingMap,
    journeyLikeAnim,
    setJourneyLikeAnim,
    handleLike,
    handleDoubleTapLike,
    handlePostTap,
  };
};

export default useLikes;
