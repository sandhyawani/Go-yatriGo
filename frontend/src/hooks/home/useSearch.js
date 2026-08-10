import { useState, useCallback, useRef, useEffect } from "react";
import homeService from "../../services/homeService";

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setShowSearchDropdown(true);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await homeService.search(q);
        if (res.data.success) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error("search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => clearTimeout(searchDebounceRef.current);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    showSearchDropdown,
    setShowSearchDropdown,
    searchRef,
  };
};

export default useSearch;
