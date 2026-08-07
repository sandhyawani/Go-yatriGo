import React, {
useState,
useEffect,
useContext,
useRef,
useCallback } from
"react";
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
Globe,
ChevronLeft } from
"lucide-react";
import { showToast } from "../../utils/showToast";
import CustomSelect from "../../components/ui/CustomSelect";
import { AuthContext } from "../../context/authContext";
import TripCard from "../../components/social/TripCard";
import { getAvatarUrl } from "../../utils/avatar";
import { GROUP_CATEGORIES } from "../../constants/groupCategories";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";

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
  "Newest"].
  includes(rawSort) ?
  rawSort :
  rawSort === "Most Travelers" || rawSort === "Most Joined" ?
  "Popular" :
  "Starting Soon";
  const [showSort, setShowSort] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isCustomSelecting, setIsCustomSelecting] = useState(false);
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");

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
  { id: "Newest", label: "Newest", icon: Clock }];



  const updateUrlParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "All" && value !== "") {
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
  urlExploreState]
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
      if (selectedCategory && selectedCategory !== "All")
      params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "All")
      params.append("lifecycleStatus", selectedStatus);
      if (selectedSort) params.append("sortBy", selectedSort);
      if (debouncedSearchQuery)
      params.append("destination", debouncedSearchQuery);

      if (urlExploreCity) {
        params.append("exploreCity", urlExploreCity);
      }
      if (urlExploreState) {
        params.append("exploreState", urlExploreState);
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
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(
      `/social/buddy/like/${tripId}`,
      {},
      { withCredentials: true }
      );
      setTrips((prev) =>
      prev?.map((t) => {
        if (t._id === tripId) {
          const isLikedNow = res.data.isLiked;
          const currentLikes = t.likes || [];
          const updatedLikes = isLikedNow ?
          [...currentLikes, user?._id] :
          currentLikes.filter((id) => id !== user?._id);
          return { ...t, likes: updatedLikes };
        }
        return t;
      })
      );
      showToast.success(
      res.data.isLiked ? "You felt this vibe!" : "Removed from Felt Vibes"
      );
    } catch (err) {
      showToast.error("Action failed");
    }
  };


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active now":
      case "active":
        return "bg-green-500/90 text-white border border-white/20";
      case "upcoming":
        return "bg-white/95 text-[#1E293B] border border-white/40 shadow-sm";
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
      isActive: selectedCategory === "All"
    }];


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
        isActive: selectedCategory === c.name
      });
    });

    return (
      <div className="flex overflow-x-auto gap-2 pb-2 pt-1 hide-scrollbar snap-x flex-1 min-w-0">
        {chips.map((chip) =>
        <button
        key={chip.id}
        onClick={chip.onClick}
        className={`snap-start px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 ${
        chip.isActive ?
        "bg-[#7C3AED] text-white shadow-soft" :
        "bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50"
        }`}>

            {chip.label}
          </button>
        )}
      </div>);

  };

  return (
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-24 lg:pb-6 max-w-7xl mx-auto font-sans antialiased">
      <div className="px-4 sm:px-6 lg:px-8 space-y-4">
        {}
        <div className="flex justify-between items-center gap-4 select-none pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight leading-tight">
              Explore <span className="text-[#7C3AED]">Journey</span>
            </h1>
            <p className="text-xs text-[#64748B] font-semibold mt-1">
              {isUsingProfile && `Groups starting near ${user.city} and across ${user.state}.`}
              {isCustomLocation && `Groups starting near ${urlExploreCity} and across ${urlExploreState}.`}
              {isEverywhere && "Find groups and travelers heading somewhere you'll love."}
              {!user?.city && !urlExploreCity && "Find groups and travelers heading somewhere you'll love."}
            </p>
          </div>
        </div>

        {}
        <div className="sticky top-12 sm:top-16 z-30 bg-[#F8FAFC]/95 backdrop-blur-xl pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-between gap-3 select-none">
          {}
          {renderFilterChips()}

          <Link
          to="/social/buddy/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs rounded-xl transition-all duration-200 shadow-soft hover:-translate-y-0.5 shrink-0 mb-1">

            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Create Trip Group</span><span className="sm:hidden">Create</span>
          </Link>
        </div>

        {}
        <div className="flex flex-wrap justify-between items-center gap-y-3 py-1 mt-2">
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-[#64748B]">
              {totalFilteredTrips} Trips
            </h3>
            {metadata?.onlineTravelers > 0 &&
            <span className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
                {metadata.onlineTravelers} online
              </span>}

          </div>

          {}
          <div className="flex flex-wrap items-center gap-2">
            {}
            <div className="relative z-45">
              <button
              onClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
                setIsCustomSelecting(false);
              }}
              className="text-xs font-semibold text-[#1E293B] flex items-center gap-2 hover:text-[#7C3AED] transition-colors bg-white px-3.5 py-2 rounded-xl border border-[#E5E7EB] shadow-soft duration-200">

                <span className="hidden sm:inline">
                  {isEverywhere ? "Explore everywhere" : `📍 ${currentLocationLabel}`}
                </span>
                <span className="sm:hidden max-w-[100px] truncate">
                  {isEverywhere ? "Everywhere" : `📍 ${urlExploreCity || user?.city || "Everywhere"}`}
                </span>
                <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`} />

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
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden p-3 flex flex-col gap-2">

                      {!isCustomSelecting ?
                    <>
                          <div className="px-2 py-1 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                            Explore Location
                          </div>
                          
                          {}
                          {user?.city &&
                      <button
                      onClick={() => {
                        handleSelectLocation();
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold transition-all text-left ${
                      isUsingProfile ?
                      "bg-brand-50 text-brand-700" :
                      "text-slate-700 hover:bg-slate-50"
                      }`}>

                              <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-slate-400">Profile Location</span>
                                <span className="truncate">📍 {user.city}, {user.state}</span>
                              </div>
                              {isUsingProfile && <Check className="w-4 h-4 text-brand-600" />}
                            </button>}


                          {}
                          <button
                      onClick={() => {
                        handleSelectLocation("none", "");
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold transition-all text-left ${
                      isEverywhere ?
                      "bg-brand-50 text-brand-700" :
                      "text-slate-700 hover:bg-slate-50"
                      }`}>

                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-slate-400">Everywhere</span>
                              <span>🌐 Explore Everywhere</span>
                            </div>
                            {isEverywhere && <Check className="w-4 h-4 text-brand-600" />}
                          </button>

                          <div className="border-t border-slate-100 my-1"></div>

                          {}
                          <button
                      onClick={() => {
                        setIsCustomSelecting(true);
                        setCustomState("");
                        setCustomCity("");
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all text-left">

                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-slate-400">Custom</span>
                              <span>🔍 Choose another city</span>
                            </div>
                            <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                          </button>
                        </> :

                    <div className="space-y-3 p-1">
                          <button
                      onClick={() => setIsCustomSelecting(false)}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer">

                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                          </button>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 mb-1 block">Select State</label>
                              <CustomSelect
                          value={customState}
                          onChange={(e) => {
                            setCustomState(e.target.value);
                            setCustomCity("");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-bold text-slate-800 focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
                          placeholder="-- Choose State --"
                          options={Object.keys(INDIAN_STATES_AND_CITIES).map((s) => ({ label: s, value: s }))}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-500 mb-1 block">Select City</label>
                              <CustomSelect
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          disabled={!customState}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-bold text-slate-800 focus:outline-none focus:border-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                      className="w-full mt-2 py-2 bg-[#1E293B] text-white hover:bg-black font-bold text-[13px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center">

                            Apply Location
                          </button>
                        </div>}

                    </motion.div>
                  </>}

              </AnimatePresence>
            </div>

            {}
            <div className="relative z-40">
              <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95">

                <BadgeCheck className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">
                  {selectedStatus === "All" ? "All Status" : selectedStatus}
                </span>
                <span className="sm:hidden">
                  {selectedStatus === "All" ? "Status" : selectedStatus}
                </span>
                <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showStatusFilter ? "rotate-180" : ""}`} />

              </button>
              <AnimatePresence>
                {showStatusFilter &&
                <motion.div
                key="status-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowStatusFilter(false)}>
                </motion.div>}

                {showStatusFilter &&
                <motion.div
                key="status-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-44 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5">

                    {[
                  { id: "All", label: "All Status" },
                  { id: "Active Now", label: "Active" },
                  { id: "Upcoming", label: "Upcoming" },
                  { id: "Completed", label: "Completed" }].
                  map(({ id, label }) => {
                    const isSelected = selectedStatus === id;
                    return (
                      <button
                      key={id}
                      onClick={() => {
                        updateUrlParams("status", id);
                        setShowStatusFilter(false);
                      }}
                      className={`w-full flex text-left items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                      isSelected ?
                      "bg-brand-50 text-brand-600" :
                      "text-slate-600 hover:bg-slate-50"
                      }`}>

                          <span>{label}</span>
                          {isSelected &&
                        <Check className="w-4 h-4 text-brand-600" />}

                        </button>);

                  })}
                  </motion.div>}

              </AnimatePresence>
            </div>

            {}
            <div className="relative z-30">
              {(() => {
                const currentSortObj =
                sortOptionsConfig.find((s) => s.id === selectedSort) ||
                sortOptionsConfig[0];
                const ActiveIcon = currentSortObj.icon;
                return (
                  <button
                  onClick={() => setShowSort(!showSort)}
                  className="text-[13px] font-bold text-slate-700 flex items-center gap-2 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm active:scale-95">

                    <ActiveIcon className="w-4 h-4 text-brand-600" />
                    <span>{currentSortObj.label}</span>
                    <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`} />

                  </button>);

              })()}
              <AnimatePresence>
                {showSort &&
                <motion.div
                key="sort-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowSort(false)}>
                </motion.div>}

                {showSort &&
                <motion.div
                key="sort-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5">

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
                      isSelected ?
                      "bg-brand-50 text-brand-600" :
                      "text-slate-600 hover:bg-slate-50"
                      }`}>

                          <div className="flex items-center gap-2.5">
                            <Icon
                          className={`w-4 h-4 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />

                            <span>{label}</span>
                          </div>
                          {isSelected &&
                        <Check className="w-4 h-4 text-brand-600" />}

                        </button>);

                  })}
                  </motion.div>}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4 pb-8">
          {loading ?

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          trips.length === 0 ?

          <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-[24px] text-center p-6 sm:p-12 shadow-sm mt-4 mx-4 sm:mx-0">

              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-[#1E293B] mb-2">
                {getEmptyStateMessage()}
              </h3>
              <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-6">
                Try changing your filters, or start your own adventure.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full transition-all shadow-sm active:scale-95 text-[13px]">

                  Clear Filters
                </button>
                <Link
              to="/social/buddy/new"
              className="px-6 py-2.5 bg-[#1E293B] hover:bg-black text-white font-bold rounded-full transition-all shadow-md active:scale-95 text-[13px] flex items-center gap-1.5">

                  <Plus className="w-4 h-4" /> Create Trip Group
                </Link>
              </div>
            </motion.div> :


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              <AnimatePresence>
                {trips?.map((trip, index) => {
                const showHeader = trips.length >= 3 && trip.exploreSectionHeader && (index === 0 || trips[index - 1].exploreSection !== trip.exploreSection);
                return (
                  <React.Fragment key={trip._id}>
                      {showHeader &&
                    <div className="col-span-full mt-4 mb-1 first:mt-1">
                          <h2 className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 select-none uppercase tracking-widest">
                            <span className="w-1.5 h-3 bg-brand-600 rounded-full"></span>
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
            </div>}


          {}
          {!loading && trips.length > 0 && hasMore &&
          <div ref={lastTripElementRef} className="h-1 w-full" />}


          {loadingMore &&
          <div className="flex justify-center py-6">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin"></div>
            </div>}

        </div>
      </div>
    </div>);

};

export default TravelBuddyHub;