import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback
} from "react";
import axios from "../../api/axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Compass, 
  BadgeCheck, 
  ChevronDown, 
  CalendarClock, 
  Flame, 
  Star, 
  Clock, 
  Check, 
  ChevronLeft,
  Search,
  X,
  Sparkles,
  MapPin,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import CustomSelect from "../../components/ui/CustomSelect";
import { AuthContext } from "../../context/authContext";
import TripCard from "../../components/social/TripCard";
import { GROUP_CATEGORIES } from "../../constants/groupCategories";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";
import {
  STATUS_DISPLAY_LABELS,
  STATUS_DROPDOWN_OPTIONS,
  normalizeFilterStatus,
  normalizeJourneyStatus
} from "../../utils/journeyLifecycle";

const CATEGORY_EMOJI_MAP = {
  "All": "🌐",
  "Trekking": "⛰️",
  "Roadtrip": "🚗",
  "Heritage & Culture": "🏛️",
  "Spiritual": "🛕",
  "Beach": "🏖️",
  "Wildlife & Safari": "🦁",
  "Backpacking": "🎒",
  "Wellness & Retreat": "🧘",
  "City Exploration": "🏙️",
  "Journey": "✈️"
};

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


  const [searchQuery, setSearchQuery] = useState(
  searchParams.get("search") || ""
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const selectedCategory = searchParams.get("category") || "All";
  const selectedStatus = normalizeFilterStatus(searchParams.get("status"));
  const rawSort =
    searchParams.get("sortBy") ||
    sessionStorage.getItem("explore_sortBy") ||
    "Starting Soon";
  const selectedSort = [
    "Starting Soon",
    "Trending",
    "Popular",
    "Highest Rated",
    "Newest"
  ].includes(rawSort)
    ? rawSort
    : rawSort === "Most Travelers" || rawSort === "Most Joined"
    ? "Popular"
    : "Starting Soon";
  const [showSort, setShowSort] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isCustomSelecting, setIsCustomSelecting] = useState(false);
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");

  const statusFilterRef = useRef(null);
  const sortFilterRef = useRef(null);
  const locationFilterRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowStatusFilter(false);
        setShowSort(false);
        setShowLocationDropdown(false);
      }
    };

    const handleClickOutside = (e) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target)) {
        setShowStatusFilter(false);
      }
      if (sortFilterRef.current && !sortFilterRef.current.contains(e.target)) {
        setShowSort(false);
      }
      if (locationFilterRef.current && !locationFilterRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const urlExploreCity = searchParams.get("exploreCity");
  const urlExploreState = searchParams.get("exploreState");

  const isEverywhere = urlExploreCity === "none";
  const isUsingProfile = !urlExploreCity && user?.city;
  const isCustomLocation = urlExploreCity && urlExploreCity !== "none";

  let currentLocationLabel = "Explore everywhere";
  if (isUsingProfile) {
    currentLocationLabel = `${user.city}, ${user.state}`;
  } else if (isCustomLocation) {
    currentLocationLabel = `${urlExploreCity}, ${urlExploreState || ""}`;
  }

  const dynamicCityName = isUsingProfile ? user?.city?.trim() : isCustomLocation ? urlExploreCity?.trim() : "";

  const handleSelectLocation = (city, state) => {
    const newParams = new URLSearchParams(searchParams);
    if (city === "none") {
      newParams.set("exploreCity", "none");
      newParams.delete("exploreState");
    } else if (city && state) {
      newParams.set("exploreCity", city);
      newParams.set("exploreState", state);
    } else {
      newParams.delete("exploreCity");
      newParams.delete("exploreState");
    }
    setSearchParams(newParams);
    setPage(1);
    setTrips([]);
  };


  const [trips, setTrips] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);


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
    [loading, loadingMore, hasMore]
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
    { id: "Newest", label: "Newest", icon: Clock }
  ];

  const updateUrlParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "All" && value !== "all" && value !== "") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(1);
    setTrips([]);
  };

  const handleClearFilters = () => {
    sessionStorage.removeItem("explore_sortBy");
    setSearchParams(new URLSearchParams());
    setSearchQuery("");
    setPage(1);
    setTrips([]);
  };


  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axios.get("/social/explore-metadata", {
          withCredentials: true
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


  useEffect(() => {
    fetchExploreData(page === 1);
  }, [
  debouncedSearchQuery,
  selectedCategory,
  selectedStatus,
  selectedSort,
  page,
  urlExploreCity,
  urlExploreState,
  user?.city,
  user?.state]
  );

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
      if (selectedCategory && selectedCategory !== "All" && selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "all" && selectedStatus !== "All")
        params.append("lifecycleStatus", selectedStatus);
      if (selectedSort) params.append("sortBy", selectedSort);
      if (debouncedSearchQuery)
        params.append("destination", debouncedSearchQuery);

      if (urlExploreCity) {
        params.append("exploreCity", urlExploreCity);
        if (urlExploreState) params.append("exploreState", urlExploreState);
      } else if (user?.city && urlExploreCity !== "none") {
        params.append("exploreCity", user.city);
        if (user?.state) params.append("exploreState", user.state);
      }

      params.append("page", isNewSearch ? 1 : page);
      params.append("limit", 10);

      const res = await axios.get(`/social/buddy?${params.toString()}`, {
        withCredentials: true
      });
      if (res.data.success) {
        if (isNewSearch) {
          setTrips(res.data.trips || []);
        } else {
          setTrips((prev) => [...prev, ...(res.data.trips || [])]);
        }
        setHasMore(res.data.pagination?.hasMore ?? false);
        setTotalFilteredTrips(
          res.data.pagination?.total ?? res.data.trips?.length ?? 0
        );
      }
    } catch (err) {
      showToast.error("Failed to load explore hub");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFelt = async (tripId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanTripId = (tripId?._id || tripId?.id || tripId)?.toString();
    if (!cleanTripId) return;

    if (!user) {
      showToast.error("Please login to save groups");
      return;
    }

    const currentUserId = (user._id || user.id)?.toString();

    let prevTripsSnapshot = [];
    setTrips((prev) => {
      prevTripsSnapshot = prev;
      return prev?.map((t) => {
        const tId = (t._id || t.id)?.toString();
        if (tId === cleanTripId) {
          const currentLikes = Array.isArray(t.likes) ? t.likes : [];
          const hasLiked = currentLikes.some(
            (id) => (id?._id || id)?.toString() === currentUserId
          );
          const updatedLikes = hasLiked
            ? currentLikes.filter(
                (id) => (id?._id || id)?.toString() !== currentUserId
              )
            : [...currentLikes, user._id || user.id];
          return { ...t, likes: updatedLikes, likesCount: updatedLikes.length };
        }
        return t;
      });
    });

    try {
      const res = await axios.post(
        `/social/buddy/like/${cleanTripId}`,
        {},
        { withCredentials: true }
      );
      if (res.data && res.data.success) {
        const isLikedNow = res.data.isLiked;
        const serverLikes = res.data.likes;
        setTrips((prev) =>
          prev?.map((t) => {
            const tId = (t._id || t.id)?.toString();
            if (tId === cleanTripId) {
              if (Array.isArray(serverLikes)) {
                return { ...t, likes: serverLikes, likesCount: serverLikes.length };
              }
              const currentLikes = Array.isArray(t.likes) ? t.likes : [];
              const updatedLikes = isLikedNow
                ? currentLikes.some((id) => (id?._id || id)?.toString() === currentUserId)
                  ? currentLikes
                  : [...currentLikes, user._id || user.id]
                : currentLikes.filter((id) => (id?._id || id)?.toString() !== currentUserId);
              return { ...t, likes: updatedLikes, likesCount: updatedLikes.length };
            }
            return t;
          })
        );
        showToast.success(
          isLikedNow ? "You felt this vibe!" : "Removed from Felt Vibes"
        );
      }
    } catch (err) {
      setTrips(prevTripsSnapshot);
      showToast.error(err.response?.data?.message || "Failed to update reaction");
    }
  };


  const getStatusColor = (status) => {
    const s = normalizeJourneyStatus(status);
    switch (s) {
      case "active":
        return "bg-green-500/90 text-white border border-white/20";
      case "upcoming":
        return "bg-white/95 text-text-primary border border-white/40 shadow-sm";
      case "completed":
        return "bg-black/60 text-white border border-white/20";
      case "cancelled":
        return "bg-red-500/90 text-white border border-white/20";
      default:
        return "bg-white/90 text-text-primary border border-white/20";
    }
  };

  const getEmptyStateMessage = () => {
    if (selectedStatus === "active") return "No active journeys found";
    if (selectedStatus === "upcoming") return "No upcoming journeys found";
    if (selectedStatus === "completed") return "No completed journeys found";
    if (selectedStatus === "cancelled") return "No cancelled journeys found";
    if (selectedCategory && selectedCategory !== "All" && selectedCategory !== "all")
      return `No ${selectedCategory.toLowerCase()} journeys found`;
    if (debouncedSearchQuery)
      return `No journeys found for "${debouncedSearchQuery}"`;
    return "No matching journeys found";
  };

  const renderFilterChips = () => {
    const chips = [
      {
        id: "all-cats",
        label: "All Categories",
        emoji: "🌐",
        onClick: () => {
          updateUrlParams("category", "All");
        },
        isActive: selectedCategory === "All" || !selectedCategory
      }
    ];

    const otherCats =
      metadata?.categories?.filter((c) => GROUP_CATEGORIES.includes(c.name)) ||
      GROUP_CATEGORIES.map(name => ({ name }));

    otherCats.forEach((c) => {
      chips.push({
        id: `cat-${c.name}`,
        label: c.name,
        emoji: CATEGORY_EMOJI_MAP[c.name] || "🎒",
        onClick: () => {
          updateUrlParams("category", c.name);
        },
        isActive: selectedCategory === c.name
      });
    });

    return (
      <div className="flex overflow-x-auto gap-2 pb-1 pt-1 hide-scrollbar snap-x flex-1 min-w-0 whitespace-nowrap items-center">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onClick}
            className={`snap-start tab-pill shrink-0 ${
              chip.isActive ? "tab-pill-active" : "tab-pill-inactive"
            }`}
          >
            <span>{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const isAnyFilterActive = (selectedCategory && selectedCategory !== "All" && selectedCategory !== "all") || 
    (selectedStatus && selectedStatus !== "all" && selectedStatus !== "All") || 
    debouncedSearchQuery || 
    isCustomLocation;

  return (
    <main className="w-full min-w-0 min-h-[100dvh] overflow-x-hidden pb-6 lg:pb-8 max-w-none lg:max-w-7xl lg:mx-auto font-sans antialiased">
      <div className="w-full min-w-0 px-0 sm:px-2 lg:px-4 space-y-4">
        
        {/* Sleek, Light & Airy Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-5 md:p-6 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="max-w-2xl space-y-1 sm:space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[10px] sm:text-xs font-semibold text-sky-700">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 shrink-0" />
                <span>Social Travel & Adventure</span>
              </div>

              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight font-heading leading-snug sm:leading-tight text-slate-900">
                Explore <span className="text-sky-600">journeys</span> & meet travelers
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
                {!loading && totalFilteredTrips === 0
                  ? (dynamicCityName
                      ? `No active trips near ${dynamicCityName} yet. Create one and invite fellow travelers.`
                      : "No active trips yet. Create one and invite fellow travelers.")
                  : "Discover active trips and find people heading your way."}
              </p>
            </div>

            {/* Create Trip CTA - Matches Brand Button */}
            <div className="shrink-0 w-full sm:w-auto pt-0.5 sm:pt-0">
              <Link
                to="/social/buddy/new"
                className="btn-primary w-full sm:w-auto !min-h-[42px] !py-2 sm:!py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-white stroke-[2.5] shrink-0" />
                <span>Create Trip Group</span>
              </Link>
            </div>
          </div>

          {/* Highlights & Live Stats Row */}
          <div className="mt-3 pt-2.5 sm:mt-3.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 sm:flex-wrap text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
              <span className="font-bold text-slate-900">{totalFilteredTrips}</span>
              <span className="text-slate-500 font-medium">Trips Available</span>
            </div>

            {metadata?.onlineTravelers > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-emerald-700">{metadata.onlineTravelers} Travelers Online</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg text-slate-600 shrink-0 max-w-[220px] sm:max-w-none">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-medium truncate">{currentLocationLabel}</span>
            </div>
          </div>
        </div>

        {/* Category Pills Sticky Bar */}
        <div className="sticky top-12 sm:top-16 z-30 bg-background/95 backdrop-blur-xl pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-between gap-2 sm:gap-3 select-none">
          {renderFilterChips()}
        </div>

        {/* Search Bar & Filter Controls Container */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Sleek Search Box Row */}
          <div className="flex items-center gap-2 flex-1 max-w-none lg:max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search destination, trek, fort (e.g. Manali, Rajgad)..."
                className="input-field !pl-10 !pr-9 !text-xs sm:!text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isAnyFilterActive && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-2 rounded-xl transition-colors shrink-0 h-[38px]"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Filters 3-column grid on mobile, flex on desktop */}
          <div className="grid grid-cols-3 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <div className="relative z-45" ref={locationFilterRef}>
              <button
                onClick={() => {
                  setShowLocationDropdown(!showLocationDropdown);
                  setIsCustomSelecting(false);
                }}
                className="w-full text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5 hover:text-brand transition-colors bg-slate-50 hover:bg-slate-100/80 px-2.5 sm:px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:border-brand-300 duration-150 h-[38px]"
              >
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="hidden sm:inline truncate">
                  {isEverywhere ? "Explore Everywhere" : currentLocationLabel}
                </span>
                <span className="sm:hidden truncate">
                  {isEverywhere ? "Everywhere" : (urlExploreCity || user?.city || "Everywhere")}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {showLocationDropdown &&
                <>
                    <motion.div
                  key="loc-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLocationDropdown(false)} />

                    <motion.div
                  key="loc-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden p-3 flex flex-col gap-2">

                      {!isCustomSelecting ?
                    <>
                          <div className="px-2 py-1 text-text-muted font-extrabold text-[10px] uppercase tracking-wider">
                            Explore Location
                          </div>
                          
                          {user?.city &&
                      <button
                      onClick={() => {
                        handleSelectLocation();
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold transition-all text-left ${
                      isUsingProfile ?
                      "bg-brand-50 text-brand-dark" :
                      "text-text-primary hover"
                      }`}>

                              <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-text-muted">Profile Location</span>
                                <span className="truncate">📍 {user.city}, {user.state}</span>
                              </div>
                              {isUsingProfile && <Check className="w-4 h-4 text-brand" />}
                            </button>}


                          <button
                      onClick={() => {
                        handleSelectLocation("none", "");
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold transition-all text-left ${
                      isEverywhere ?
                      "bg-brand-50 text-brand-dark" :
                      "text-text-primary hover"
                      }`}>

                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-text-muted">Everywhere</span>
                              <span>🌐 Explore Everywhere</span>
                            </div>
                            {isEverywhere && <Check className="w-4 h-4 text-brand" />}
                          </button>

                          <div className="border-t border-slate-100 my-1"></div>

                          <button
                      onClick={() => {
                        setIsCustomSelecting(true);
                        setCustomState("");
                        setCustomCity("");
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold text-text-primary hover transition-all text-left">

                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-text-muted">Custom</span>
                              <span>🔍 Choose another city</span>
                            </div>
                            <ChevronDown className="w-4 h-4 -rotate-90 text-text-muted" />
                          </button>
                        </> :

                    <div className="space-y-3 p-1">
                          <button
                      onClick={() => setIsCustomSelecting(false)}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-brand hover:text-brand-dark transition-colors uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer">

                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                          </button>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[11px] font-bold text-text-muted mb-1 block">Select State</label>
                              <CustomSelect
                          value={customState}
                          onChange={(e) => {
                            setCustomState(e.target.value);
                            setCustomCity("");
                          }}
                          className="input-field"
                          placeholder="-- Choose State --"
                          options={Object.keys(INDIAN_STATES_AND_CITIES).map((s) => ({ label: s, value: s }))}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-text-muted mb-1 block">Select City</label>
                              <CustomSelect
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          disabled={!customState}
                          className="input-field"
                          placeholder="-- Choose City --"
                          options={customState ? INDIAN_STATES_AND_CITIES[customState].map((c) => ({ label: c, value: c })) : []}
                              />
                            </div>
                          </div>

                          <button
                      onClick={() => {
                        if (customCity && customState) {
                          handleSelectLocation(customCity, customState);
                          setShowLocationDropdown(false);
                        }
                      }}
                      disabled={!customCity}
                      className="w-full mt-2 py-2 bg-slate-800 text-white hover:bg-black font-bold text-[13px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center">

                            Apply Location
                          </button>
                        </div>}

                    </motion.div>
                  </>}

              </AnimatePresence>
            </div>

            <div className="relative z-40" ref={statusFilterRef}>
              {(() => {
                const currentStatusObj = STATUS_DROPDOWN_OPTIONS.find(s => s.id === selectedStatus) || STATUS_DROPDOWN_OPTIONS[0];
                return (
                  <button
                    onClick={() => setShowStatusFilter(!showStatusFilter)}
                    className="w-full text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5 hover:text-brand transition-colors bg-slate-50 hover:bg-slate-100/80 px-2.5 sm:px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:border-brand-300 duration-150 h-[38px]"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${currentStatusObj.colorDot || "bg-brand"}`} />
                    <span className="hidden sm:inline truncate">
                      {currentStatusObj.label}
                    </span>
                    <span className="sm:hidden truncate">
                      {currentStatusObj.id === "all" ? "Status" : currentStatusObj.label}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        showStatusFilter ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })()}
              <AnimatePresence>
                {showStatusFilter && (
                  <motion.div
                    key="status-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5"
                  >
                    {STATUS_DROPDOWN_OPTIONS.map(({ id, label, colorDot }) => {
                      const isSelected = selectedStatus === id;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            updateUrlParams("status", id);
                            setShowStatusFilter(false);
                          }}
                          className={`w-full flex text-left items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors ${
                            isSelected
                              ? "bg-brand-50 text-brand-dark"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${colorDot || "bg-slate-300"}`} />
                            <span>{label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-brand" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="relative z-30" ref={sortFilterRef}>
              {(() => {
                const currentSortObj =
                  sortOptionsConfig.find((s) => s.id === selectedSort) ||
                  sortOptionsConfig[0];
                const ActiveIcon = currentSortObj.icon;
                return (
                  <button
                    onClick={() => setShowSort(!showSort)}
                    className="w-full text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5 hover:text-brand transition-colors bg-slate-50 hover:bg-slate-100/80 px-2.5 sm:px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:border-brand-300 duration-150 h-[38px]"
                  >
                    <ActiveIcon className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span className="hidden sm:inline truncate">{currentSortObj.label}</span>
                    <span className="sm:hidden truncate">
                      {selectedSort === "Starting Soon" ? "Soon" :
                       selectedSort === "Highest Rated" ? "Top" :
                       currentSortObj.label}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        showSort ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })()}
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    key="sort-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5"
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
                              ? "bg-brand-50 text-brand"
                              : "text-text-secondary hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${
                                isSelected ? "text-brand" : "text-text-muted"
                              }`}
                            />
                            <span>{label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-brand" />
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

        {/* Trips Found Header */}
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
              {totalFilteredTrips} {totalFilteredTrips === 1 ? 'Trip Available' : 'Trips Available'}
            </h3>
            {debouncedSearchQuery && (
              <span className="text-xs font-semibold text-brand bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                Searching for "{debouncedSearchQuery}"
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 pb-8">

          {loading ?

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
              {[1, 2, 3, 4].map((n) =>
            <div
            key={n}
            className="bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm animate-pulse flex flex-col gap-4">

                  <div className="w-full h-44 bg-slate-200 rounded-[18px]"></div>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
            )}
            </div> :
          trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-3xl text-center p-8 sm:p-14 shadow-sm mt-4 w-full"
            >
              <div className="w-20 h-20 bg-brand-50 border border-brand-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                🧭
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
                {getEmptyStateMessage()}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                No trips matching this criteria right now. Be the first to start an adventure or adjust your search filters!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 text-xs sm:text-sm"
                >
                  Reset All Filters
                </button>
                <Link
                  to="/social/buddy/new"
                  className="px-6 py-2.5 bg-gradient-to-r from-brand to-brand-dark hover:brightness-110 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-xs sm:text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Trip Group
                </Link>
              </div>
            </motion.div>
          ) : (


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch w-full">
              <AnimatePresence>
                {trips?.map((trip, index) => {
                const showHeader = trips.length >= 3 && trip.exploreSectionHeader && (index === 0 || trips[index - 1].exploreSection !== trip.exploreSection);
                return (
                  <React.Fragment key={trip._id}>
                      {showHeader &&
                    <div className="col-span-full mt-4 mb-1 first:mt-1">
                          <h2 className="text-[11px] font-black text-text-muted flex items-center gap-2 select-none uppercase tracking-widest">
                            <span className="w-1.5 h-3 bg-brand rounded-full"></span>
                            {trip.exploreSectionHeader}
                          </h2>
                        </div>}

                      <TripCard
                    trip={trip}
                    user={user}
                    handleFelt={handleFelt} />

                    </React.Fragment>);

              })}
              </AnimatePresence>
            </div>
          )}


          {!loading && trips.length > 0 && hasMore &&
          <div ref={lastTripElementRef} className="h-1 w-full" />}


          {loadingMore &&
          <div className="flex justify-center py-6">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin"></div>
            </div>}

        </div>
      </div>
    </main>);

};

export default TravelBuddyHub;
