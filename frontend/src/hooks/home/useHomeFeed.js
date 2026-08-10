import { useState, useCallback } from "react";
import homeService from "../../services/homeService";

export const useHomeFeed = () => {
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [errorMemories, setErrorMemories] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMemories = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoadingMemories(true);
      setErrorMemories(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await homeService.fetchMemories(pageNum);
      if (res.data.success) {
        const fetchedMemories = res.data.memories || [];
        if (append) {
          setMemories((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const uniqueNew = fetchedMemories.filter((m) => !existingIds.has(m._id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setMemories(fetchedMemories);
        }
        setHasMore(fetchedMemories.length === 10);
        setPage(pageNum);
      } else {
        if (pageNum === 1) setErrorMemories(true);
      }
    } catch (err) {
      console.error("fetchMemories error:", err);
      if (pageNum === 1) setErrorMemories(true);
    } finally {
      setLoadingMemories(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMemories || loadingMore || !hasMore) return;
    fetchMemories(page + 1, true);
  }, [loadingMemories, loadingMore, hasMore, page, fetchMemories]);

  return {
    memories,
    setMemories,
    loadingMemories,
    setLoadingMemories,
    errorMemories,
    setErrorMemories,
    page,
    setPage,
    hasMore,
    setHasMore,
    loadingMore,
    fetchMemories,
    loadMore,
  };
};

export default useHomeFeed;
