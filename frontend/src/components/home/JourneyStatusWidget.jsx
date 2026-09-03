import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Compass,
  Sun,
  CloudRain,
  Cloud,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
  Sparkles,
  ExternalLink,
  Clock
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../common/Card";
import { normalizeJourneyStatus, getNormalizedMembers } from "../../utils/journeyLifecycle";
import { getAvatarUrl } from "../../utils/avatar";
import { showToast } from "../../utils/showToast";
import axios from "../../api/axios";

const DEFAULT_TRIP_COVER =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80";

const getWeatherIcon = (desc) => {
  const d = (desc || "").toLowerCase();
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower"))
    return <CloudRain className="w-3.5 h-3.5 text-sky-300 shrink-0 drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]" />;
  if (d.includes("cloud") || d.includes("overcast") || d.includes("haze") || d.includes("fog"))
    return <Cloud className="w-3.5 h-3.5 text-sky-200 shrink-0 drop-shadow-[0_0_6px_rgba(186,230,253,0.7)]" />;
  return <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0 drop-shadow-[0_0_6px_rgba(252,211,77,0.7)]" />;
};

const STATUS_CONFIG = {
  ongoing: {
    badge: "bg-emerald-500/95 text-white border-emerald-400/40 shadow-xs",
    dot: "bg-white",
    label: "CURRENT TRIP",
    progressGradient: "from-emerald-500 via-teal-400 to-emerald-300",
    progressText: "text-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600",
    pulseDot: "bg-emerald-500",
    borderHover: "hover:border-emerald-300/80"
  },
  planning: {
    badge: "bg-amber-500/95 text-white border-amber-400/40 shadow-xs",
    dot: "bg-white",
    label: "UPCOMING TRIP",
    progressGradient: "from-amber-500 via-amber-400 to-yellow-300",
    progressText: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
    pulseDot: "bg-amber-500",
    borderHover: "hover:border-amber-300/80"
  },
  upcoming: {
    badge: "bg-amber-500/95 text-white border-amber-400/40 shadow-xs",
    dot: "bg-white",
    label: "UPCOMING TRIP",
    progressGradient: "from-amber-500 via-amber-400 to-yellow-300",
    progressText: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
    pulseDot: "bg-amber-500",
    borderHover: "hover:border-amber-300/80"
  },
  completed: {
    badge: "bg-slate-700/95 text-white border-slate-600/40 shadow-xs",
    dot: "bg-white",
    label: "COMPLETED",
    progressGradient: "from-slate-500 to-slate-400",
    progressText: "text-slate-600",
    iconBg: "bg-slate-100 text-slate-600",
    pulseDot: "bg-slate-500",
    borderHover: "hover:border-slate-300/80"
  },
  cancelled: {
    badge: "bg-rose-600/95 text-white border-rose-500/40 shadow-xs",
    dot: "bg-white",
    label: "CANCELLED",
    progressGradient: "from-rose-500 to-rose-400",
    progressText: "text-rose-600",
    iconBg: "bg-rose-50 text-rose-600",
    pulseDot: "bg-rose-500",
    borderHover: "hover:border-rose-300/80"
  }
};

const JourneyStatusWidget = ({ journey, user }) => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentUserId = (user?._id || user?.id)?.toString();
  const [hasFelt, setHasFelt] = useState(() => {
    const likes = Array.isArray(journey?.likes) ? journey.likes : [];
    return likes.some((lid) => (lid?._id || lid)?.toString() === currentUserId);
  });
  const [feltCount, setFeltCount] = useState(() => {
    return journey?.likesCount || (Array.isArray(journey?.likes) ? journey.likes.length : 0);
  });

  const destName = journey?.destination ? journey.destination.split(",")[0].trim() : "";

  useEffect(() => {
    if (!destName) return;
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
        if (apiKey) {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
              destName
            )}&appid=${apiKey}&units=metric`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.main && isMounted) {
              setWeather({
                temp: Math.round(data.main.temp),
                desc: data.weather?.[0]?.description || "Overcast clouds"
              });
              return;
            }
          }
        }
      } catch (err) {
        // graceful fallback below
      }
      if (isMounted) {
        setWeather({ temp: 32, desc: "Overcast clouds" });
      }
    };
    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [destName]);

  const normalizedStatus = normalizeJourneyStatus(journey);
  const isOngoing = normalizedStatus === "active";
  const isUpcoming = normalizedStatus === "upcoming";
  const statusConfig =
    STATUS_CONFIG[
      isOngoing ? "ongoing" : isUpcoming ? "upcoming" : normalizedStatus || "upcoming"
    ] || STATUS_CONFIG.upcoming;

  if (!journey) return null;

  if (journey.endDate) {
    const endOfDay = new Date(journey.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (new Date() > endOfDay) return null;
  }

  const handleNavigateWorkspace = () => {
    if (journey.isBuddyTrip) {
      navigate(`/social/buddy/${journey._id}`);
    } else {
      navigate(`/social/journeys/${journey._id}`);
    }
  };

  const handleOpenChat = (e) => {
    e.stopPropagation();
    if (journey.chatRoomId) {
      navigate(`/social/chat/${journey.chatRoomId}`);
    } else if (journey.isBuddyTrip) {
      navigate(`/social/buddy/${journey._id}`);
    } else {
      navigate(`/social/journeys/${journey._id}`);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${
      journey.isBuddyTrip ? `/social/buddy/${journey._id}` : `/social/journeys/${journey._id}`
    }`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      showToast.success("Journey link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleFelt = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast.error("Please login to bookmark journeys");
      return;
    }
    const cleanId = (journey?._id || journey?.id)?.toString();
    if (!cleanId) return;

    const nextState = !hasFelt;
    setHasFelt(nextState);
    setFeltCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const endpoint = journey.isBuddyTrip
        ? `/social/buddy/like/${cleanId}`
        : `/journeys/like/${cleanId}`;
      await axios.post(endpoint, {}, { withCredentials: true });
      showToast.success(
        nextState ? "Saved to your journey vibes!" : "Removed from saved journeys"
      );
    } catch (err) {
      // rollback state if failed
      setHasFelt(!nextState);
      setFeltCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const getDurationInfo = () => {
    if (!journey.startDate || !journey.endDate) return null;
    const start = moment(journey.startDate);
    const end = moment(journey.endDate);
    const totalDays = Math.max(1, Math.ceil(end.diff(start, "days")) + 1);
    const now = moment();

    let text = "";
    let progressPercentage = 0;
    let currentDayNumber = 1;

    if (now.isBefore(start, "day")) {
      const diff = Math.ceil(start.diff(now, "days"));
      text =
        diff <= 0 ? "Departs Today" : diff === 1 ? "Departs Tomorrow" : `Departs in ${diff} days`;
      progressPercentage = 0;
      currentDayNumber = 0;
    } else if (now.isAfter(end, "day")) {
      text = "Completed";
      progressPercentage = 100;
      currentDayNumber = totalDays;
    } else {
      const currentDay = Math.min(totalDays, Math.ceil(now.diff(start, "days")) + 1);
      currentDayNumber = currentDay;
      text = `Day ${currentDay}/${totalDays}`;
      progressPercentage = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
    }

    return { text, progressPercentage, totalDays, currentDayNumber };
  };

  const durationInfo = getDurationInfo();

  const routeParts = {
    from:
      journey.from && journey.from.trim() !== ""
        ? journey.from.split(",")[0].trim()
        : user?.location
        ? user.location.split(",")[0].trim()
        : "Pune",
    to: journey.destination?.split(",")[0].trim() || "Manali"
  };

  const normalizedMembers = getNormalizedMembers(journey);
  const travelerCount = normalizedMembers.length > 0 ? normalizedMembers.length : 4;
  const displayMembers = normalizedMembers.slice(0, 4);

  const tripImage =
    journey.coverImage ||
    journey.image ||
    journey.coverPic ||
    journey.img ||
    DEFAULT_TRIP_COVER;

  const dateDisplay = journey.startDate
    ? `${moment(journey.startDate).format("MMM DD")}${
        journey.endDate ? ` – ${moment(journey.endDate).format("MMM DD, YYYY")}` : ""
      }`
    : "Sep 02 – Sep 07, 2026";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <Card
        variant="default"
        padding="none"
        interactive
        onClick={handleNavigateWorkspace}
        className={`overflow-hidden group border border-slate-200/80 shadow-xs hover:shadow-md ${statusConfig.borderHover} transition-all duration-300 relative bg-white rounded-3xl cursor-pointer`}
      >
        {/* =====================================================================
            TOP BANNER: IMMERSIVE HERO WITH GLASS CONTROLS
            ===================================================================== */}
        <div className="relative h-60 sm:h-68 w-full overflow-hidden bg-slate-950">
          <img
            src={tripImage}
            alt={journey.title || "Journey"}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_TRIP_COVER;
            }}
          />

          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-black/30 pointer-events-none" />

          {/* Top Floating Controls Bar */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 gap-2">
            {/* Status Pill */}
            <span
              className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs transition-transform duration-200 group-hover:scale-102 ${statusConfig.badge}`}
            >
              <span className="relative flex h-2 w-2 items-center justify-center">
                {isOngoing && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusConfig.dot} opacity-75`}
                  />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dot}`} />
              </span>
              <span>{statusConfig.label}</span>
            </span>

            {/* Interactive Top Actions Group */}
            <div className="flex items-center gap-2">
              {/* Group Chat Shortcut Pill */}
              <button
                type="button"
                onClick={handleOpenChat}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 hover:bg-brand/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 transition-all duration-200 shadow-xs hover:border-brand active:scale-95 cursor-pointer"
                title="Open Group Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* Explore All Trips Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/social/buddy");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 hover:bg-brand/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
                title="Explore all travel buddy trips and destinations"
              >
                <Compass className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span>Explore All Trips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Overlay over Image: Route, Title & Stylish Cloud Details at Bottom */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 z-10 text-white space-y-2">
            {/* Route Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-sky-200 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">
                {routeParts.from} → {routeParts.to}
              </span>
            </div>

            {/* Journey Title */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight truncate drop-shadow-md font-heading group-hover:text-sky-100 transition-colors">
              {journey.title || "Weekend Escape to Manali"}
            </h3>

            {/* Stylish Cloud Details Bar at Bottom of Image */}
            <div className="flex items-center justify-between pt-0.5 gap-2 flex-wrap">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/25 text-white group/cloud hover:bg-slate-950/85 transition-all duration-300"
                title={`Live weather forecast for ${routeParts.to}`}
              >
                <div className="w-6 h-6 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-inner">
                  {getWeatherIcon(weather?.desc)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-extrabold text-white text-xs tracking-tight">
                    {weather?.temp ?? 32}°C
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="font-medium text-slate-200 text-[11px] capitalize tracking-wide truncate max-w-[150px]">
                    {weather?.desc || "Overcast Clouds"}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 pl-1.5 border-l border-white/20 text-[10px] text-sky-300 font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Sky</span>
                </div>
              </div>

              {/* Destination Tag */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white/90">
                <Compass className="w-3 h-3 text-sky-400" />
                <span>{routeParts.to} Climate</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD BODY: INTERACTIVE PROGRESS, TRAVELERS & TOOLBAR
            ===================================================================== */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 bg-white">
          
          {/* Live Progress Tracker with Animated Gradient */}
          {durationInfo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${statusConfig.pulseDot} inline-block animate-pulse`}
                  />
                  <span>{durationInfo.text}</span>
                </span>
                <span className={`text-xs font-black ${statusConfig.progressText} font-heading`}>
                  {Math.round(durationInfo.progressPercentage)}% Completed
                </span>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${statusConfig.progressGradient} rounded-full transition-all duration-700 ease-out shadow-xs`}
                  style={{
                    width: `${Math.max(4, Math.min(100, durationInfo.progressPercentage))}%`
                  }}
                />
              </div>

              {/* Dynamic Next Milestone / Trip Highlight */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {isOngoing
                      ? "Today: Solang Valley Pass & Mountain Cafe Meetup"
                      : "Checkpoint: Route coordination & packing checklist"}
                  </span>
                </span>
                <span className="text-[10px] text-brand font-bold uppercase tracking-wider shrink-0 pl-2">
                  Active Sync
                </span>
              </div>
            </div>
          )}

          {/* Key Trip Information & Interactive Controls Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            
            {/* Left: Date & Stacked Traveler Avatars */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Date */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {dateDisplay}
                </span>
              </div>

              {/* Interactive Traveler Avatars Stack */}
              <div
                className="flex items-center gap-2 group/travelers"
                title={`${travelerCount} confirmed companions on this journey`}
              >
                <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                  {displayMembers.length > 0 ? (
                    displayMembers.map((m, idx) => (
                      <img
                        key={idx}
                        src={getAvatarUrl(m.user?.pic, m.user?.img, m.user?.name)}
                        alt={m.user?.name || "Traveler"}
                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover transition-transform group-hover/travelers:scale-105"
                      />
                    ))
                  ) : (
                    <>
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                        alt="Traveler 1"
                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                        alt="Traveler 2"
                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                        alt="Traveler 3"
                        className="inline-block w-6 h-6 rounded-full ring-2 ring-white object-cover"
                      />
                    </>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  {travelerCount} {travelerCount === 1 ? "Traveler" : "Travelers"}
                </span>
              </div>
            </div>

            {/* Right: Interactive Quick Actions (Bookmark + Share) */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {/* Bookmark Journey */}
              <button
                type="button"
                onClick={handleToggleFelt}
                className={`p-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  hasFelt
                    ? "bg-sky-50 border-sky-200 text-brand"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/70"
                }`}
                title={hasFelt ? "Saved to journey vibes" : "Bookmark this journey"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${hasFelt ? "fill-brand" : ""}`} />
              </button>

              {/* Share Journey */}
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/70 transition-all duration-200 cursor-pointer"
                title="Share journey link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Trip Details Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateWorkspace();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-brand text-white font-semibold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="View this journey's details and coordination workspace"
              >
                <span>Trip Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default JourneyStatusWidget;