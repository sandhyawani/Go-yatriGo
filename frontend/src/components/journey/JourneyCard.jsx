import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Users,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import Avatar from "../common/Avatar";

import moment from "moment";

const JourneyCard = ({ journey, onCheckInClick }) => {
  const isSolo =
    journey.journeyType === "Solo Journey" ||
    journey.journeyType === "Solo" ||
    (journey.members?.length <= 1 && !journey.journeyType?.includes("Shared"));

  const getJourneyTypeBadge = () => {
    if (journey.isBuddyTrip || journey.sourceType === "explore") {
      return "Explore Group";
    }
    if (isSolo) {
      return "Solo Expedition";
    }
    return "Friends Journey";
  };

  const defaultCover =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";

  const isHappeningNow = journey?.startDate && moment(journey.startDate).isSameOrBefore(moment(), 'day') && (!journey?.endDate || moment(journey.endDate).isSameOrAfter(moment(), 'day'));
  const isPast = journey?.endDate && moment(journey.endDate).isBefore(moment(), 'day');
  const isCancelledStatus = journey?.status?.toLowerCase() === "cancelled";

  const isCompleted =
    journey.status === "Completed" || journey.lifecycleStatus === "completed" || (isPast && !isCancelledStatus);
  const isOngoing =
    (journey.status === "Ongoing" || journey.status === "Active" || journey.lifecycleStatus === "active" || isHappeningNow) && !isCompleted && !isCancelledStatus;

  const getSignatureCode = () => {
    const prefix = "GY";
    const dest = journey.destination || journey.title || "UNK";
    const titleCode = dest.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "UNK";
    const date = journey.startDate ? new Date(journey.startDate) : new Date();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${prefix} • ${titleCode} • ${mm}${dd}`;
  };

  const getCombinedBadge = () => {
    const typeBadge = getJourneyTypeBadge();
    const statusText = isCompleted ? "COMPLETED" : isOngoing ? "ACTIVE" : (journey.status || "UPCOMING").toUpperCase();
    const typeText = typeBadge.toUpperCase();
    const statusIcon = isCompleted ? "✓" : isOngoing ? "🟢" : "⏳";
    const typeIcon = typeBadge === "Explore Group" ? "🌍" : isSolo ? "👤" : "👥";

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white tracking-wider border border-white/30 shadow-sm">
        <span>{statusIcon} {statusText}</span>
        <span className="opacity-50">·</span>
        <span>{typeIcon} {typeText}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#7C3AED]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full">
      {/* Media Header */}
      <div className="relative h-[170px] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={journey.coverImage || defaultCover}
          alt={journey.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

        {/* Top Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-start z-10">
          {getCombinedBadge()}
        </div>

        {/* Destination Specs & Title */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-300 uppercase mb-1 drop-shadow-md">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A7A] shrink-0" />
            <div className="flex items-center truncate">
              {journey.from ? `${journey.from} ` : ""}
              {journey.from && <span className="text-white/40 mx-1.5">── ✈ ──</span>}
              {journey.destination}
            </div>
          </div>
          <h3
            className="text-lg font-black leading-tight text-white line-clamp-2 drop-shadow-md"
            title={journey.title}
          >
            {journey.title}
          </h3>
        </div>
      </div>

      {/* Body Specs */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
        
        {/* Date & Duration */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center uppercase tracking-wider">
            {journey.startDate
              ? new Date(journey.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "DATE TBD"}
          </span>
          <span className="uppercase tracking-wider">
            {journey.durationDays || 3} DAYS
          </span>
        </div>

        {/* Summary (Members or Memories) & Signature */}
        <div className="space-y-3">
          {isCompleted && journey.stats && (journey.stats.photosCount > 0 || journey.stats.postsCount > 0 || journey.stats.checkInsCount > 0 || journey.stats.storiesCount > 0) ? (
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-slate-400" /> {journey.stats.photosCount || 0} Photos</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> {(journey.stats.postsCount || 0) + (journey.stats.checkInsCount || 0) + (journey.stats.storiesCount || 0) || 0} Memories</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center -space-x-2 shrink-0">
                {journey.members?.slice(0, 4).map((m, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-200 shrink-0"
                    title={m.user?.name || "Squad Member"}
                  >
                    <Avatar
                      user={m.user}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                {isSolo ? "Solo Expedition" : `${journey.members?.length || 1} Explorers`}
              </span>
            </div>
          )}

          {/* Go YatriGo Signature */}
          <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 tracking-[0.2em] pt-1">
            {getSignatureCode()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <Link
            to={journey.isBuddyTrip ? `/social/buddy/${journey._id}` : `/social/journeys/${journey._id}`}
            className="flex-1 py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6d28d9] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 group/btn"
          >
            <span>OPEN JOURNEY</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
          {isOngoing && onCheckInClick && (
            <button
              onClick={() => onCheckInClick(journey)}
              className="w-12 h-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0 transition-all shadow-sm"
              title="Safe Check-In"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyCard;