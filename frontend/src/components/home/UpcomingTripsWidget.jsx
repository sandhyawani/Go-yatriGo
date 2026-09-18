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

      <div className={`grid gap-4 ${upcomingTrips.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {upcomingTrips.map((trip) => {
          const tripId = trip._id || trip.id;
          const countdown = getCountdownBadge(trip.startDate);
          const isBuddy = trip.isBuddyTrip || trip.sourceType === "explore";
          const destinationName = (trip.destination || "TBD").split(",")[0].trim();
          const fromName = trip.from ? trip.from.split(",")[0].trim() : "Pune";
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
                className="overflow-hidden group border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 relative bg-white rounded-2xl sm:rounded-3xl cursor-pointer"
              >
                {/* Card Image Area */}
                <div className="relative h-44 sm:h-50 w-full overflow-hidden bg-slate-950">
                  <img
                    src={tripCover}
                    alt={trip.title || "Upcoming Trip"}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/25 pointer-events-none" />

                  {/* Card Header Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
                    {countdown ? (
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs ${countdown.style}`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{countdown.label}</span>
                        {countdown.pulse && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-xs bg-amber-500/90 text-white border-amber-400/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>UPCOMING TRIP</span>
                      </span>
                    )}

                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
                      {getTransportIcon(trip.transportation)}
                      <span className="capitalize">
                        {trip.journeyType || (isBuddy ? "Group" : "Trip")}
                      </span>
                    </div>
                  </div>

                  {/* Route & Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 z-10 text-white space-y-1">
                    <div className="inline-flex items-center gap-1 text-sky-200 text-xs font-semibold tracking-wide">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">
                        {fromName} → {destinationName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight truncate drop-shadow-sm font-heading group-hover:text-sky-100 transition-colors"
                        title={trip.title}
                      >
                        {trip.title || "Rajgad Fort Expedition"}
                      </h4>

                      <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-emerald-300 shrink-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{durationDays} {durationDays === 1 ? "Day" : "Days"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body Area */}
                <div className="p-3.5 sm:p-4 flex flex-col gap-3 bg-white">
                  
                  {/* Consistent Metadata & Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                    
                    {/* Metadata Row */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {dateRangeStr}
                        </span>
                      </div>

                      <span className="text-slate-300 shrink-0">·</span>

                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        title={`${memberCount} companions traveling`}
                      >
                        <div className="flex -space-x-1.5 overflow-hidden items-center py-0.5">
                          {membersList.length > 0 ? (
                            membersList.slice(0, 3).map((m, idx) => (
                              <img
                                key={idx}
                                src={getAvatarUrl(m.user?.pic, m.user?.img, m.user?.name || m.name)}
                                alt="Companion"
                                className="inline-block w-5 h-5 rounded-full ring-2 ring-white object-cover"
                              />
                            ))
                          ) : (
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {memberCount} {memberCount === 1 ? "Traveler" : "Travelers"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, trip, isBuddy, tripId)}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer"
                        title="Share trip"
                      >
                        {copiedId === tripId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
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
        })}
      </div>
    </div>
  );
};

export default UpcomingTripsWidget;
