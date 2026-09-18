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
import { resolveWeatherQuery } from "../../utils/locationUtils";
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

  const destName = resolveWeatherQuery(journey?.destination);

  useEffect(() => {
    if (!destName) return;
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
        if (apiKey) {
          const queriesToTry = [destName];
          if (!destName.toLowerCase().includes(",in") && !destName.toLowerCase().includes(", india")) {
            queriesToTry.push(`${destName},IN`);
          }
          for (const q of queriesToTry) {
            try {
              const res = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
                  q
                )}&appid=${apiKey}&units=metric`
              );
              if (res.ok) {
                const data = await res.json();
                if (data?.main && isMounted) {
                  setWeather({
                    temp: Math.round(data.main.temp),
                    desc: data.weather?.[0]?.description || "Clear sky"
                  });
                  return;
                }
              }
            } catch (e) {}
          }
        }
      } catch (err) {}
      if (isMounted) {
        setWeather({ temp: 28, desc: "Clear sky" });
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
        className={`overflow-hidden group border border-slate-200/80 shadow-xs hover:shadow-md ${statusConfig.borderHover} transition-all duration-300 relative bg-white rounded-2xl sm:rounded-3xl cursor-pointer`}
      >
        {/* Card Image Area */}
        <div className="relative h-44 sm:h-50 w-full overflow-hidden bg-slate-950">
          <img
            src={tripImage}
            alt={journey.title || "Journey"}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_TRIP_COVER;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/25 pointer-events-none" />

          {/* Card Header Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
            <span
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs ${statusConfig.badge}`}
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

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenChat}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 transition-all duration-200 shadow-xs cursor-pointer active:scale-95"
                title="Open Group Chat"
              >
                <MessageSquare className="w-3 h-3 text-sky-300" />
                <span>Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            </div>
          </div>

          {/* Route & Title Overlay */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 z-10 text-white space-y-1">
            <div className="inline-flex items-center gap-1 text-sky-200 text-xs font-semibold tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">
                {routeParts.from} → {routeParts.to}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate drop-shadow-sm font-heading group-hover:text-sky-100 transition-colors">
                {journey.title || "Weekend Escape to Manali"}
              </h3>

              {weather && (
                <div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white shrink-0"
                  title={`Weather in ${routeParts.to}`}
                >
                  {getWeatherIcon(weather?.desc)}
                  <span>{weather.temp}°C</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Body Area */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-3 bg-white">
          
          {/* Progress Bar (if active/scheduled) */}
          {durationInfo && isOngoing && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.pulseDot} animate-pulse`} />
                  <span>{durationInfo.text}</span>
                </span>
                <span className={`text-[11px] font-bold ${statusConfig.progressText}`}>
                  {Math.round(durationInfo.progressPercentage)}% Completed
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${statusConfig.progressGradient} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(5, Math.min(100, durationInfo.progressPercentage))}%` }}
                />
              </div>
            </div>
          )}

          {/* Consistent Metadata & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
            
            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-slate-600 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {dateDisplay}
                </span>
              </div>

              <span className="text-slate-300 shrink-0">·</span>

              <div
                className="flex items-center gap-1.5 shrink-0"
                title={`${travelerCount} confirmed travelers`}
              >
                <div className="flex -space-x-1.5 overflow-hidden items-center py-0.5">
                  {displayMembers.length > 0 ? (
                    displayMembers.slice(0, 3).map((m, idx) => (
                      <img
                        key={idx}
                        src={getAvatarUrl(m.user?.pic, m.user?.img, m.user?.name)}
                        alt={m.user?.name || "Traveler"}
                        className="inline-block w-5 h-5 rounded-full ring-2 ring-white object-cover"
                      />
                    ))
                  ) : (
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {travelerCount} {travelerCount === 1 ? "Traveler" : "Travelers"}
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleToggleFelt}
                className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                  hasFelt
                    ? "bg-sky-50 border-sky-200 text-brand"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/80"
                }`}
                title={hasFelt ? "Saved" : "Save trip"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${hasFelt ? "fill-brand" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer"
                title="Share trip"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateWorkspace();
                }}
                className="h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-brand text-white font-semibold text-xs transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Trip Details"
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