import { useState, useCallback } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";

export const useSavePost = () => {
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [saveLoadingMap, setSaveLoadingMap] = useState({});

  const fetchSavedPostIds = useCallback(async () => {
    try {
      const res = await homeService.fetchSavedPostIds();
      if (res.data.success) {
        setSavedPostIds(new Set((res.data.savedIds || []).map((id) => id.toString())));
      }
    } catch (err) {
      console.error("fetchSavedPostIds error:", err);
    }
  }, []);

  const handleSaveToggle = useCallback(async (postId) => {
    const postIdStr = postId.toString();
    const isSaved = savedPostIds.has(postIdStr);
    setSaveLoadingMap((prev) => ({ ...prev, [postIdStr]: true }));

    try {
      const res = isSaved
        ? await homeService.deleteSavedPost(postIdStr)
        : await homeService.savePost(postIdStr);

      if (res.data.success) {
        showToast.success(res.data.message);
        setSavedPostIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.delete(postIdStr);
          else next.add(postIdStr);
          return next;
        });
      }
    } catch (err) {
      showToast.error("Failed to update saved posts");
    } finally {
      setSaveLoadingMap((prev) => ({ ...prev, [postIdStr]: false }));
    }
  }, [savedPostIds]);

  return {
    savedPostIds,
    setSavedPostIds,
    saveLoadingMap,
    setSaveLoadingMap,
    fetchSavedPostIds,
    handleSaveToggle,
  };
};

export default useSavePost;
