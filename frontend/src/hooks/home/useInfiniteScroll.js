import { useEffect, useRef } from "react";

export const useInfiniteScroll = (loadMore, loadingMore, hasMore) => {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, loadingMore, hasMore]);

  return loadMoreRef;
};

export default useInfiniteScroll;
