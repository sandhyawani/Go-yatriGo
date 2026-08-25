import { useState, useCallback } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";
import Swal from "sweetalert2";

export const useStories = () => {
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const fetchStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const res = await homeService.fetchStories();
      if (res.data.success) {
        setStories(res.data.stories || []);
      }
    } catch (err) {
      console.error("fetchStories error:", err);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const handleDeleteStory = useCallback(async (storyId, onComplete) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this Dispatch?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!isConfirmed) return;

    try {
      const res = await homeService.deleteStory(storyId);
      if (res.data.success) {
        showToast.success("Dispatch deleted successfully!");
        if (onComplete) onComplete();
      }
    } catch (err) {
      showToast.error("Failed to delete Dispatch.");
    }
  }, []);

  return {
    stories,
    setStories,
    loadingStories,
    setLoadingStories,
    fetchStories,
    handleDeleteStory,
  };
};

export default useStories;
