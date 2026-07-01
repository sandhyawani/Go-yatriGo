import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import axios from "../../api/axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Calendar,
  Search,
  Plus,
  Compass,
  Heart,
  X,
  BadgeCheck,
  ChevronDown,
  CalendarClock,
  Flame,
  Star,
  Clock,
  Check,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";
import TripCard from "../../components/social/TripCard";
import { getAvatarUrl } from "../../utils/avatar";
import { GROUP_CATEGORIES } from "../../constants/groupCategories";
// Delay search requests until typing stops.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const TravelBuddyHub = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State Management linked to URL
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const selectedCategory = searchParams.get("category") || "All";
  const selectedStatus = searchParams.get("status") || "All";
  const rawSort =
    searchParams.get("sortBy") ||
    sessionStorage.getItem("explore_sortBy") ||
    "Starting Soon";
  const selectedSort = [
    "Starting Soon",
    "Trending",
    "Popular",
    "Highest Rated",
    "Newest",
  ].includes(rawSort)
    ? rawSort
    : rawSort === "Most Travelers" || rawSort === "Most Joined"
      ? "Popular"
      : "Starting Soon";
  const [showSort, setShowSort] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  // Data States
  const [trips, setTrips] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFilteredTrips, setTotalFilteredTrips] = useState(0);

  const observer = useRef();
  const lastTripElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore],
  );

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  const sortOptionsConfig = [
    { id: "Starting Soon", label: "Starting Soon", icon: CalendarClock },
    { id: "Trending", label: "Trending", icon: Flame },
    { id: "Popular", label: "Popular", icon: Users },
    { id: "Highest Rated", label: "Highest Rated", icon: Star },
    { id: "Newest", label: "Newest", icon: Clock },
  ];

  // Update URL Params when filters change
  const updateUrlParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "All" && value !== "") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(1); // Reset page on filter change
    setTrips([]);
  };

  const handleClearFilters = () => {
    sessionStorage.removeItem("explore_sortBy");
    setSearchParams(new URLSearchParams());
    setSearchQuery("");
    setPage(1);
    setTrips([]);
  };

  // Load filter options.
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axios.get("/social/explore-metadata", {
          withCredentials: true,
        });
        if (res.data.success) {
          setMetadata(res.data);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Data
  useEffect(() => {
    fetchExploreData(page === 1);
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedStatus,
    selectedSort,
    page,
  ]);

  const fetchExploreData = async (isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
      setTrips([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "All")
        params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "All")
        params.append("lifecycleStatus", selectedStatus);
      if (selectedSort) params.append("sortBy", selectedSort);
      if (debouncedSearchQuery)
        params.append("destination", debouncedSearchQuery);

      params.append("page", isNewSearch ? 1 : page);
      params.append("limit", 10);

      const res = await axios.get(`/social/buddy?${params.toString()}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        if (isNewSearch) {
          setTrips(res.data.trips || []);
        } else {
          setTrips((prev) => [...prev, ...(res.data.trips || [])]);
        }
        setHasMore(res.data.pagination?.hasMore ?? false);
        setTotalFilteredTrips(
          res.data.pagination?.total ?? res.data.trips?.length ?? 0,
        );
      }
    } catch (err) {
      showToast.error("Failed to load explore hub");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (tripId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(
        `/social/buddy/like/${tripId}`,
        {},
        { withCredentials: true },
      );
      setTrips((prev) =>
        prev?.map((t) => {
          if (t._id === tripId) {
            const isLikedNow = res.data.isLiked;
            const currentLikes = t.likes || [];
            const updatedLikes = isLikedNow
              ? [...currentLikes, user?._id]
              : currentLikes.filter((id) => id !== user?._id);
            return { ...t, likes: updatedLikes };
          }
          return t;
        }),
      );
      showToast.success(
        res.data.isLiked ? "You felt this vibe!" : "Removed from Felt Vibes",
      );
    } catch (err) {
      showToast.error("Action failed");
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active now":
      case "active":
        return "bg-green-500/90 text-white border border-white/20";
      case "upcoming":
        return "bg-white/95 text-[#111827] border border-white/40 shadow-sm";
      case "completed":
        return "bg-black/60 text-white border border-white/20";
      case "cancelled":
        return "bg-red-500/90 text-white border border-white/20";
      default:
        return "bg-white/90 text-slate-700 border border-white/20";
    }
  };

  const getEmptyStateMessage = () => {
    if (selectedStatus === "Cancelled")
      return "No cancelled travel groups found";
    if (selectedStatus === "Active Now") return "No active travel groups found";
    if (selectedCategory !== "All")
      return `No ${selectedCategory.toLowerCase()} travel groups found`;
    if (debouncedSearchQuery)
      return `No travel groups found for "${debouncedSearchQuery}"`;
    return "No matching travel groups found";
  };

  const renderFilterChips = () => {
    const chips = [
      {
        id: "all-cats",
        label: "All Categories",
        onClick: () => {
          updateUrlParams("category", "All");
        },
        isActive: selectedCategory === "All",
      },
    ];

    const otherCats =
      metadata?.categories?.filter((c) => GROUP_CATEGORIES.includes(c.name)) ||
      [];
    otherCats.forEach((c) => {
      chips.push({
        id: `cat-${c.name}`,
        label: c.name,
        onClick: () => {
          updateUrlParams("category", c.name);
        },
        isActive: selectedCategory === c.name,
      });
    });

    return (
      <div className="flex overflow-x-auto gap-2 pb-2 pt-1 hide-scrollbar snap-x flex-1">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={chip.onClick}
            className={`snap-start px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300 active:scale-95 hover:-translate-y-0.5 ${
              chip.isActive
                ? "bg-[#111827] text-white shadow-md shadow-black/10 scale-105"
                : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-24 lg:pb-6 max-w-7xl mx-auto font-sans antialiased">
      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
        {/* 1. Header Title */}
        <div className="flex justify-between items-center gap-4 select-none pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-tight">
              Travel <span className="text-[#6C4DF6]">Groups</span>
            </h1>
          </div>
        </div>

        {/* 2. Search & Filter Experience with Create Button */}
        <div className="sticky top-12 sm:top-16 z-30 bg-[#FAFAFA]/95 backdrop-blur-xl pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-b border-slate-100 sm:border-none sm:shadow-none flex items-center justify-between gap-3">
          {/* Dynamic Filter Chips */}
          {renderFilterChips()}

          <Link
            to="/social/buddy/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#111827] hover:bg-black text-white font-bold text-[13px] rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 shrink-0 mb-1"
          >
            <Plus className="w-4 h-4" /> <span>Create Group</span>
          </Link>
        </div>

        {/* 3. Sort & Count Header */}
        <div className="flex justify-between items-center py-1 mt-2">
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold text-slate-600">
              {totalFilteredTrips} Groups
            </h3>
            {metadata?.onlineTravelers > 0 && (
              <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {metadata.onlineTravelers} online
              </span>
            )}
          </div>

          {/* Inline Filters & Sort */}
          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative z-40">
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:text-[#6C4DF6] transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95"
              >
                <BadgeCheck className="w-4 h-4 text-[#6C4DF6]" />
                <span className="hidden sm:inline">
                  {selectedStatus === "All" ? "All Status" : selectedStatus}
                </span>
                <span className="sm:hidden">
                  {selectedStatus === "All" ? "Status" : selectedStatus}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showStatusFilter ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {showStatusFilter && (
                  <motion.div
                    key="status-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStatusFilter(false)}
                  ></motion.div>
                )}
                {showStatusFilter && (
                  <motion.div
                    key="status-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-44 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5"
                  >
                    {[
                      { id: "All", label: "All Status" },
                      { id: "Active Now", label: "Active" },
                      { id: "Upcoming", label: "Upcoming" },
                    ].map(({ id, label }) => {
                      const isSelected = selectedStatus === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            updateUrlParams("status", id);
                            setShowStatusFilter(false);
                          }}
                          className={`w-full flex text-left items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                            isSelected
                              ? "bg-[#6C4DF6]/10 text-[#6C4DF6]"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#6C4DF6]" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inline Sort Dropdown */}
            <div className="relative z-30">
              {(() => {
                const currentSortObj =
                  sortOptionsConfig.find((s) => s.id === selectedSort) ||
                  sortOptionsConfig[0];
                const ActiveIcon = currentSortObj.icon;
                return (
                  <button
                    onClick={() => setShowSort(!showSort)}
                    className="text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:text-[#6C4DF6] transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95"
                  >
                    <ActiveIcon className="w-4 h-4 text-[#6C4DF6]" />
                    <span>{currentSortObj.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`}
                    />
                  </button>
                );
              })()}
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    key="sort-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSort(false)}
                  ></motion.div>
                )}
                {showSort && (
                  <motion.div
                    key="sort-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5"
                  >
                    {sortOptionsConfig.map(({ id, label, icon: Icon }) => {
                      const isSelected = selectedSort === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            sessionStorage.setItem("explore_sortBy", id);
                            updateUrlParams("sortBy", id);
                            setShowSort(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                            isSelected
                              ? "bg-[#6C4DF6]/10 text-[#6C4DF6]"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${isSelected ? "text-[#6C4DF6]" : "text-slate-400"}`}
                            />
                            <span>{label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#6C4DF6]" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 4. Main Content Area */}
        <div className="space-y-4 pb-8">
          {loading ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm animate-pulse flex flex-col gap-4"
                >
                  <div className="w-full h-44 bg-slate-200 rounded-[18px]"></div>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-[24px] text-center p-6 sm:p-12 shadow-sm mt-4 mx-4 sm:mx-0"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-[#111827] mb-2">
                {getEmptyStateMessage()}
              </h3>
              <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-6">
                Try changing your filters, or start your own adventure.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full transition-all shadow-sm active:scale-95 text-[13px]"
                >
                  Clear Filters
                </button>
                <Link
                  to="/social/buddy/new"
                  className="px-6 py-2.5 bg-[#111827] hover:bg-black text-white font-bold rounded-full transition-all shadow-md active:scale-95 text-[13px] flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Travel Group
                </Link>
              </div>
            </motion.div>
          ) : (
            // Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              <AnimatePresence>
                {trips?.map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    user={user}
                    handleLike={handleLike}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          {!loading && trips.length > 0 && hasMore && (
            <div ref={lastTripElementRef} className="h-1 w-full" />
          )}

          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#6C4DF6] animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelBuddyHub;
