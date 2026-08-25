import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ShieldCheck, ArrowRight, Image as ImageIcon, Sparkles } from "lucide-react";
import Avatar from "../common/Avatar";
import { getJourneyLifecycle } from "../../utils/journeyLifecycle";

const JourneyCard = ({ journey, onCheckInClick }) => {
  const isSolo =
    journey.journeyType === "Solo Journey" ||
    journey.journeyType === "Solo" ||
    (journey.members?.length <= 1 && !journey.journeyType?.includes("Shared"));

  const getJourneyTypeBadge = () => {
    if (journey.sourceType === "explore") {
      return "Explore Group";
    }
    if (isSolo) {
      return "Solo Expedition";
    }
    return "Friends Journey";
  };

  const defaultCover =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";

  const lifecycle = getJourneyLifecycle(journey);
  const isCancelledStatus = lifecycle.isCancelled;
  const isCompleted = lifecycle.isCompleted;
  const isOngoing = lifecycle.isOngoing;
  const isUpcoming = !isCancelledStatus && !isCompleted && !isOngoing;

  const getSignatureCode = () => {
    const prefix = "GY";
    const dest = journey.destination || journey.title || "UNK";
    const titleCode = dest.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "UNK";
    const date = journey.startDate ? new Date(journey.startDate) : new Date();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${prefix} • ${titleCode} • ${mm}${dd}`;
  };

  const durationDays = journey.durationDays || (journey.startDate && journey.endDate
    ? Math.max(1, Math.ceil((new Date(journey.endDate) - new Date(journey.startDate)) / (1000 * 60 * 60 * 24)))
    : 1);

  const currentDay = journey.startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(journey.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const progressPercent = isCompleted
    ? 100
    : isOngoing
    ? Math.min(100, Math.round((currentDay / durationDays) * 100))
    : 0;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.1)] hover:border-[#7C3AED]/40 dark:hover:border-[#7C3AED]/40 transition-all duration-200 flex flex-col justify-between overflow-hidden h-full hover:-translate-y-0.5">
      {/* Compact Media Header */}
      <div className="relative h-[140px] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        <img
          src={journey.coverImage || defaultCover}
          alt={journey.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
          {/* Status Badge */}
          {isOngoing ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-emerald-600/90 backdrop-blur-md border border-emerald-400/40 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>IN PROGRESS</span>
            </div>
          ) : isUpcoming ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-amber-500/90 backdrop-blur-md border border-amber-300/40 shadow-xs">
              <span>⏳</span>
              <span>UPCOMING</span>
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-slate-800/90 backdrop-blur-md border border-slate-600/40 shadow-xs">
              <span>✓</span>
              <span>COMPLETED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-rose-600/90 backdrop-blur-md border border-rose-400/40 shadow-xs">
              <span>✕</span>
              <span>CANCELLED</span>
            </div>
          )}

          {/* Type Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white/95 bg-black/45 backdrop-blur-md border border-white/20 shadow-xs">
            {journey.sourceType === "explore" ? "🌍 Explore Group" : isSolo ? "👤 Solo Trip" : "👥 Friends"}
          </div>
        </div>

        {/* Route and Title Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 text-white z-10">
          <div className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/15 text-[9.5px] font-bold text-slate-200 uppercase tracking-wider mb-1 max-w-full truncate shadow-xs">
            <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            <span className="truncate">{journey.from || "Anywhere"}</span>
            <span className="text-white/40">➔</span>
            <span className="text-white truncate font-extrabold">{journey.destination}</span>
          </div>

          <h3
            className="text-sm sm:text-[15px] font-black leading-snug text-white line-clamp-1 drop-shadow-md group-hover:text-purple-200 transition-colors font-heading"
            title={journey.title}
          >
            {journey.title}
          </h3>
        </div>
      </div>

      {/* Compact Body Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        
        {/* Info Row: Date/Duration + Squad Avatars */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3 h-3 text-[#7C3AED] shrink-0" />
            <span>
              {journey.startDate
                ? new Date(journey.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{durationDays} {durationDays === 1 ? "Day" : "Days"}</span>
          </div>

          {/* Overlapping Explorers */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center -space-x-1.5">
              {journey.members && journey.members.length > 0 ? (
                journey.members.slice(0, 2).map((m, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white dark:border-slate-900 overflow-hidden bg-slate-200 shrink-0 shadow-xs"
                    title={m.user?.name || "Traveler"}
                  >
                    <Avatar
                      user={m.user}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center text-[10px] font-bold border border-white shadow-xs">
                  👤
                </div>
              )}
            </div>
            <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
              {isSolo ? "Solo" : `${Math.max(1, journey.members?.length || journey.memberCount || 1)}`}
            </span>
          </div>
        </div>

        {/* Status indicator / Countdown (Compact) */}
        {isOngoing ? (
          <div className="space-y-1 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Day {Math.min(currentDay, durationDays)} of {durationDays}
              </span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full h-1 bg-emerald-200/60 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : isUpcoming && journey.startDate ? (
          <div className="flex items-center justify-between text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30 px-2.5 py-1 rounded-xl border border-purple-100 dark:border-purple-900/40">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#7C3AED]" />
              Countdown
            </span>
            <span>
              {(() => {
                const diffDays = Math.ceil((new Date(journey.startDate) - Date.now()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) return "Departs today";
                if (diffDays === 1) return "Departs tomorrow";
                return `Starts in ${diffDays}d`;
              })()}
            </span>
          </div>
        ) : isCompleted && journey.stats && (journey.stats.photosCount > 0 || journey.stats.postsCount > 0) ? (
          <div className="flex items-center gap-2.5 text-[10.5px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3 text-purple-500" /> {journey.stats.photosCount || 0} Photos</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> {(journey.stats.postsCount || 0) + (journey.stats.checkInsCount || 0)} Memories</span>
          </div>
        ) : null}

        {/* Action Button & Stamp */}
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/social/journeys/${journey._id}`}
              className="flex-1 py-2 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 group/btn active:scale-[0.98]"
            >
              <span>Open Journey</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
            </Link>
            {isOngoing && onCheckInClick && (
              <button
                onClick={() => onCheckInClick(journey)}
                className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Safe Check-In"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.1em] px-0.5">
            <span>{getSignatureCode()}</span>
            <span className="text-[8px] text-[#7C3AED] uppercase font-extrabold">YatriGo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyCard;