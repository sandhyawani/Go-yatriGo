import { useState, useEffect } from "react";
import { notificationService } from "../../services/notificationService";

export const useSocialSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchTab, setSearchTab] = useState("all");

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await notificationService.searchSocial(searchQuery);
        if (res.success) {
          setSearchResults(res);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchResults,
    searchTab,
    setSearchTab
  };
};
export default useSocialSearch;
