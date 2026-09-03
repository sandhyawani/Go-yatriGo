import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Plane,
  Train,
  Car,
  Compass,
  ChevronRight,
  Clock,
  Share2,
  Check,
  Sparkles,
  Users
} from "lucide-react";
import moment from "moment";
import { motion } from "framer-motion";
import Card from "../common/Card";
import Avatar from "../common/Avatar";
import { getAvatarUrl } from "../../utils/avatar";
import { showToast } from "../../utils/showToast";

const getTransportIcon = (mode) => {
  const m = String(mode || "").toLowerCase();
  if (m.includes("flight") || m.includes("plane") || m.includes("air")) {
    return <Plane className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
  }
  if (m.includes("train") || m.includes("rail")) {
    return <Train className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
  }
  if (m.includes("car") || m.includes("drive") || m.includes("road")) {
    return <Car className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  }
  return <Compass className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
};

const getCountdownBadge = (startDate) => {
  if (!startDate) return null;
  const now = moment().startOf("day");
  const start = moment(startDate).startOf("day");
  const diffDays = Math.ceil(start.diff(now, "days"));

  if (diffDays <= 0) {
    return {
      label: "Starts Today",
      style: "bg-emerald-500/90 text-white border-emerald-400/40 shadow-xs",
      pulse: true
    };
  }
  if (diffDays === 1) {
    return {
      label: "Starts Tomorrow",
      style: "bg-amber-500/90 text-white border-amber-400/40 shadow-xs",
      pulse: true
    };
  }
  if (diffDays < 7) {
    return {
      label: `In ${diffDays} days`,
      style: "bg-brand/90 text-white border-brand-400/40 shadow-xs",
      pulse: false
    };
  }
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return {
      label: `In ${weeks} ${weeks === 1 ? "week" : "weeks"}`,
      style: "bg-slate-900/80 text-white border-white/20 shadow-xs",
      pulse: false
    };
  }
  return {
    label: moment(startDate).format("MMM DD"),
    style: "bg-slate-900/80 text-white border-white/20 shadow-xs",
    pulse: false
  };
};

const getDestinationCover = (trip) => {
  if (trip?.coverImage || trip?.image || trip?.coverPic || trip?.img) {
    return trip.coverImage || trip.image || trip.coverPic || trip.img;
  }
  const dest = String(trip?.destination || trip?.title || "").toLowerCase();
  if (dest.includes("rajgad") || dest.includes("fort") || dest.includes("sinhagad") || dest.includes("torna")) {
    return "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80"; // Maharashtra hill fort
  }
  if (dest.includes("manali") || dest.includes("himalaya") || dest.includes("mountain") || dest.includes("kalsubai")) {
    return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80";
  }
  if (dest.includes("goa") || dest.includes("beach") || dest.includes("gokarna")) {
    return "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80";
  }
  if (dest.includes("panchgani") || dest.includes("mahabaleshwar")) {
    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
};

const UpcomingTripsWidget = ({ upcomingTrips = [], title = "Upcoming Trip" }) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);

  if (!upcomingTrips || upcomingTrips.length === 0) return null;

  const handleShare = (e, trip, isBuddy, tripId) => {
    e.stopPropagation();
    const url = `${window.location.origin}${
      isBuddy && !trip.sourceId ? `/social/buddy/${tripId}` : `/social/journeys/${tripId}`
    }`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedId(tripId);
      showToast.success("Trip link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between pl-1">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
          <Calendar className="w-3.5 h-3.5 text-brand" />
          <span>{title}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-brand border border-sky-200">
            {upcomingTrips.length}
          </span>
        </h3>
        <Link
          to="/social/journeys"
          className="text-xs font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          <span>View Hub</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Trips Grid / List */}
      <div className={`grid gap-4 ${upcomingTrips.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {upcomingTrips.map((trip) => {
          const tripId = trip._id || trip.id;
          const countdown = getCountdownBadge(trip.startDate);
          const isBuddy = trip.isBuddyTrip || trip.sourceType === "explore";
          const destinationName = (trip.destination || "TBD").split(",")[0].trim();
          const fromName = trip.from ? trip.from.split(",")[0].trim() : "";
          const startDateFormatted = trip.startDate ? moment(trip.startDate).format("MMM DD") : "TBD";
          const endDateFormatted = trip.endDate ? moment(trip.endDate).format("MMM DD, YYYY") : "";
          const dateRangeStr = endDateFormatted ? `${startDateFormatted} – ${endDateFormatted}` : startDateFormatted;

          const durationDays =
            trip.durationDays ||
            (trip.startDate && trip.endDate
              ? Math.max(1, Math.ceil(moment(trip.endDate).diff(moment(trip.startDate), "days")) + 1)
              : 2);

          const membersList = Array.isArray(trip.members) ? trip.members : [];
          const memberCount = Math.max(1, membersList.length || trip.memberCount || 3);
          const tripCover = getDestinationCover(trip);

          const handleCardClick = () => {
            if (isBuddy && !trip.sourceId) {
              navigate(`/social/buddy/${tripId}`);
            } else {
              navigate(`/social/journeys/${tripId}`);
            }
          };

          return (
            <motion.div
              key={tripId}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Card
                variant="default"
                padding="none"
                interactive
                onClick={handleCardClick}
                className="overflow-hidden group border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between rounded-3xl bg-white cursor-pointer"
              >
                {/* =====================================================================
                    TOP HERO IMAGE BANNER: HIGH-END EDITORIAL VISUAL
                    ===================================================================== */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                  <img
                    src={tripCover}
                    alt={trip.title || "Upcoming Trip"}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />

                  {/* Cinematic Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/25 pointer-events-none" />

                  {/* Top Floating Glass Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 gap-2">
                    {/* Category & Transport Pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
                      {getTransportIcon(trip.transportation)}
                      <span className="capitalize">
                        {trip.journeyType || (isBuddy ? "Group Trip" : "Expedition")}
                      </span>
                    </div>

                    {/* Countdown Pill */}
                    {countdown && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-xs ${countdown.style}`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{countdown.label}</span>
                        {countdown.pulse && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Overlay: Route, Title & Schedule Badges on Image */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 z-10 text-white space-y-1.5">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1 text-sky-200 text-xs font-semibold tracking-wide">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">
                          {fromName ? `${fromName} → ` : ""}{destinationName}
                        </span>
                      </div>

                      <h4
                        className="text-base sm:text-lg font-black text-white group-hover:text-sky-100 transition-colors font-heading leading-tight truncate drop-shadow-md"
                        title={trip.title}
                      >
                        {trip.title || "Rajgad Fort Expedition"}
                      </h4>
                    </div>

                    {/* Departure Date & Trip Days directly on image */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md border border-white/20 shadow-xs">
                        <Calendar className="w-3 h-3 text-sky-300 shrink-0" />
                        <span>{dateRangeStr}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 backdrop-blur-md border border-emerald-400/30 shadow-xs">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{durationDays} {durationDays === 1 ? "Day" : "Days"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* =====================================================================
                    CARD BODY: TRAVELERS & QUICK ACTIONS (No separate date row)
                    ===================================================================== */}
                <div className="px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center justify-between gap-2 bg-white">
                  {/* Travelers Avatar Stack */}
                  <div
                    className="flex items-center gap-2 group/travelers"
                    title={`${memberCount} companions traveling`}
                  >
                    <div className="flex -space-x-1.5 overflow-hidden items-center py-0.5">
                      {membersList.length > 0 ? (
                        membersList.slice(0, 3).map((m, idx) => (
                          <img
                            key={idx}
                            src={getAvatarUrl(m.user?.pic, m.user?.img, m.user?.name || m.name)}
                            alt="Companion"
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
                    <span className="text-xs font-semibold text-slate-700">
                      {memberCount} {memberCount === 1 ? "Traveler" : "Travelers"}
                    </span>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, trip, isBuddy, tripId)}
                        className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/70 transition-all cursor-pointer"
                        title="Share trip"
                      >
                        {copiedId === tripId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Primary Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-brand text-white font-semibold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>{isBuddy && !trip.sourceId ? "View Group" : "Workspace"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingTripsWidget;
