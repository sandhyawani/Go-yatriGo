import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Compass, ChevronDown, ChevronLeft, Globe, Navigation, Search, RefreshCw, AlertCircle, X } from "lucide-react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/authContext";
import { showToast } from "../../utils/showToast";
import TripCard from "../../components/social/TripCard";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";

const DestinationSkeleton = () => (
  <div className="animate-pulse flex gap-3 overflow-x-auto pb-2 scrollbar-none">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="shrink-0 w-36 h-20 rounded-2xl bg-slate-100 border border-slate-100"
      />
    ))}
  </div>
);

const TripSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-[24px] border border-slate-100 overflow-hidden"
      >
        <div className="h-48 bg-slate-100" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-50 rounded w-1/2" />
          <div className="h-3 bg-slate-50 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

const ActiveTravelsByLocation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [locationGroups, setLocationGroups] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const pickerRef = useRef(null);

  const [expandedDest, setExpandedDest] = useState(null);

  const urlScope = searchParams.get("scope") || "all";
  const urlCity = searchParams.get("city") || "";
  const urlState = searchParams.get("state") || "";

  const activeFilterLabel = useMemo(() => {
    if (urlScope === "city" && urlCity) return urlCity;
    if (urlScope === "state" && urlState) return urlState;
    if (urlScope === "city" && !urlCity && user?.city)
      return `${user.city}${user.state ? `, ${user.state}` : ""}`;
    if (urlScope === "state" && !urlState && user?.state) return user.state;
    return "Everywhere";
  }, [urlScope, urlCity, urlState, user?.city, user?.state]);

  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowLocationPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchActiveTrips();
  }, [urlScope, urlCity, urlState, user?.city, user?.state]);

  const fetchActiveTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (urlScope === "city") {
        params.set("scope", "city");
        params.set("city", urlCity || user?.city || "");
        if (urlState || user?.state) params.set("state", urlState || user?.state || "");
      } else if (urlScope === "state") {
        params.set("scope", "state");
        params.set("state", urlState || user?.state || "");
      } else {
        params.set("scope", "all");
      }

      // Skip if required params are missing
      const finalScope = params.get("scope");
      if (finalScope === "city" && !params.get("city")) {
        setTrips([]);
        setLocationGroups([]);
        setSummary({ totalTrips: 0, totalDestinations: 0 });
        setLoading(false);
        return;
      }
      if (finalScope === "state" && !params.get("state")) {
        setTrips([]);
        setLocationGroups([]);
        setSummary({ totalTrips: 0, totalDestinations: 0 });
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `/social/buddy/active-by-location?${params.toString()}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        setTrips(res.data.trips || []);
        setLocationGroups(res.data.locationGroups || []);
        setSummary(res.data.summary || { totalTrips: 0, totalDestinations: 0 });
        // Auto-expand first destination if there's only one
        if (res.data.locationGroups?.length === 1) {
          setExpandedDest(res.data.locationGroups[0].destination);
        } else {
          setExpandedDest(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch active travels:", err);
      setError(err.response?.data?.message || "Failed to load active travels");
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = (scope, city = "", state = "") => {
    const newParams = new URLSearchParams();
    newParams.set("scope", scope);
    if (city) newParams.set("city", city);
    if (state) newParams.set("state", state);
    setSearchParams(newParams);
    setShowLocationPicker(false);
    setExpandedDest(null);
  };

  const handleNearMe = () => {
    if (user?.city) {
      handleScopeChange("city", user.city, user.state || "");
    } else if (user?.state) {
      handleScopeChange("state", "", user.state);
    } else {
      showToast.info("Location not set", "Update your profile with your city to use this filter.");
    }
  };

  const handleMyCity = () => {
    if (user?.city) {
      handleScopeChange("city", user.city, user.state || "");
    } else {
      showToast.info("City not set", "Add your city in your profile.");
    }
  };

  const handleMyState = () => {
    if (user?.state) {
      handleScopeChange("state", "", user.state);
    } else {
      showToast.info("State not set", "Add your state in your profile.");
    }
  };

  const handleEverywhere = () => {
    handleScopeChange("all");
  };

  const handleCustomLocationSelect = () => {
    if (customCity && customState) {
      handleScopeChange("city", customCity, customState);
    } else if (customState) {
      handleScopeChange("state", "", customState);
    }
    setCustomState("");
    setCustomCity("");
    setStateSearch("");
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
      return prev.map((t) => {
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
          prev.map((t) => {
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
      }
    } catch (err) {
      setTrips(prevTripsSnapshot);
      showToast.error(err.response?.data?.message || "Failed to update reaction");
    }
  };

  const tripsForDestination = useMemo(() => {
    if (!expandedDest) return [];
    const destLower = expandedDest.toLowerCase();
    return trips.filter((t) => {
      const tripDest = (t.destination || "").trim().split(",")[0].trim().toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return tripDest.toLowerCase() === destLower;
    });
  }, [expandedDest, trips]);

  const filteredStates = useMemo(() => {
    const allStates = Object.keys(INDIAN_STATES_AND_CITIES);
    if (!stateSearch.trim()) return allStates;
    const q = stateSearch.trim().toLowerCase();
    return allStates.filter((s) => s.toLowerCase().includes(q));
  }, [stateSearch]);

  const citiesForState = useMemo(() => {
    if (!customState) return [];
    return INDIAN_STATES_AND_CITIES[customState] || [];
  }, [customState]);

  const scopeButtons = [
    {
      id: "near",
      label: "Near Me",
      icon: Navigation,
      onClick: handleNearMe,
      isActive: urlScope === "city" && urlCity === (user?.city || "") && !searchParams.get("custom")
    },
    {
      id: "city",
      label: user?.city ? `My City` : "My City",
      icon: MapPin,
      onClick: handleMyCity,
      isActive: urlScope === "city" && urlCity === user?.city
    },
    {
      id: "state",
      label: user?.state ? `My State` : "My State",
      icon: Globe,
      onClick: handleMyState,
      isActive: urlScope === "state" && urlState === user?.state
    },
    {
      id: "all",
      label: "Everywhere",
      icon: Compass,
      onClick: handleEverywhere,
      isActive: urlScope === "all"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-800 tracking-tight">
              Active Travels
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 truncate">
              Discover where travelers are heading
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {summary && !loading && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                {summary.totalTrips} {summary.totalTrips === 1 ? "trip" : "trips"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-20">
        {/* ── Scope filter buttons ── */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none snap-x">
          {scopeButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={btn.onClick}
                className={`snap-start flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  btn.isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-brand-200 hover:bg-brand-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {btn.label}
              </button>
            );
          })}

          {/* Custom location picker toggle */}
          <div className="relative shrink-0" ref={pickerRef}>
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className={`snap-start flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                (urlScope === "city" && urlCity && urlCity !== user?.city) ||
                (urlScope === "state" && urlState && urlState !== user?.state)
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-brand-200 hover:bg-brand-50"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              {(urlScope === "city" && urlCity && urlCity !== user?.city)
                ? urlCity
                : (urlScope === "state" && urlState && urlState !== user?.state)
                ? urlState
                : "Select Location"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showLocationPicker ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown picker */}
            <AnimatePresence>
              {showLocationPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 right-0 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                      Select Location
                    </span>
                    <button
                      onClick={() => setShowLocationPicker(false)}
                      className="p-1 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* State search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={stateSearch}
                      onChange={(e) => {
                        setStateSearch(e.target.value);
                        setCustomState("");
                        setCustomCity("");
                      }}
                      placeholder="Search state..."
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                    />
                  </div>

                  {/* State list */}
                  <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-none">
                    {filteredStates.map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setCustomState(st);
                          setCustomCity("");
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                          customState === st
                            ? "bg-brand-50 text-brand-700 border border-brand-200"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    {filteredStates.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-2">No states found</p>
                    )}
                  </div>

                  {/* City list */}
                  {customState && citiesForState.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cities in {customState}
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 scrollbar-none">
                        {citiesForState.map((ct) => (
                          <button
                            key={ct}
                            onClick={() => setCustomCity(ct)}
                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              customCity === ct
                                ? "bg-brand-50 text-brand-700 border border-brand-200"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {ct}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Apply buttons */}
                  <div className="flex gap-2 pt-1">
                    {customState && !customCity && (
                      <button
                        onClick={() => {
                          handleScopeChange("state", "", customState);
                          setCustomState("");
                          setStateSearch("");
                        }}
                        className="flex-1 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl py-2 transition-colors"
                      >
                        All {customState}
                      </button>
                    )}
                    {customCity && customState && (
                      <button
                        onClick={handleCustomLocationSelect}
                        className="flex-1 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl py-2 transition-colors"
                      >
                        {customCity}, {customState}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Current filter indicator */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-xs font-bold text-slate-500">
            Showing travels {urlScope === "all" ? "everywhere" : `in `}
            {urlScope !== "all" && (
              <span className="text-slate-800">{activeFilterLabel}</span>
            )}
          </span>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-6">
            <DestinationSkeleton />
            <TripSkeleton />
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              Something went wrong
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs">{error}</p>
            <button
              onClick={fetchActiveTrips}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Compass className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              {urlScope === "all"
                ? "No active travels available right now"
                : `No upcoming travels from ${activeFilterLabel} yet`}
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs">
              {urlScope !== "all"
                ? "Try exploring everywhere or select a different location."
                : "Check back later — new travel plans are created every day!"}
            </p>
            {urlScope !== "all" && (
              <button
                onClick={handleEverywhere}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Explore Everywhere
              </button>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && trips.length > 0 && (
          <div className="space-y-6">
            {/* Destination summary cards */}
            <div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-brand-500" />
                Destinations
              </h2>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
                {locationGroups.map((group) => {
                  const isActive = expandedDest === group.destination;
                  return (
                    <motion.button
                      key={group.destination}
                      layout
                      onClick={() =>
                        setExpandedDest(isActive ? null : group.destination)
                      }
                      className={`snap-start shrink-0 flex flex-col items-start px-4 py-3 rounded-2xl border transition-all duration-200 min-w-[140px] ${
                        isActive
                          ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20"
                          : "bg-white text-slate-700 border-slate-200 hover:border-brand-200 hover:shadow-sm"
                      }`}
                    >
                      <span
                        className={`text-sm font-black leading-tight truncate max-w-full ${
                          isActive ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {group.destination}
                      </span>
                      <span
                        className={`text-[11px] font-bold mt-1 ${
                          isActive ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        {group.tripCount}{" "}
                        {group.tripCount === 1 ? "trip" : "trips"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Expanded destination trips */}
            <AnimatePresence mode="wait">
              {expandedDest && tripsForDestination.length > 0 && (
                <motion.div
                  key={expandedDest}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      {expandedDest}
                      <span className="text-slate-400 font-bold">
                        · {tripsForDestination.length}{" "}
                        {tripsForDestination.length === 1 ? "trip" : "trips"}
                      </span>
                    </h3>
                    <button
                      onClick={() => setExpandedDest(null)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tripsForDestination.map((trip) => (
                      <TripCard
                        key={trip._id}
                        trip={trip}
                        user={user}
                        handleFelt={handleFelt}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* All trips when no destination is selected */}
            {!expandedDest && (
              <div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  All Trips
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trips.map((trip) => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      user={user}
                      handleFelt={handleFelt}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTravelsByLocation;
