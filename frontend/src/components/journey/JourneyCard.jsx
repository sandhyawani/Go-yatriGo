import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ShieldCheck, ArrowRight, Image as ImageIcon, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";
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
      return "Solo Journey";
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
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(2,132,199,0.1)] hover:border-brand/40:border-brand/40 transition-all duration-200 flex flex-col justify-between overflow-hidden h-full hover:-translate-y-0.5">
      {/* Compact Media Header */}
      <div className="relative h-[140px] w-full overflow-hidden bg-background shrink-0">
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-gradient-to-r from-sky-600/95 to-cyan-600/95 backdrop-blur-md border border-cyan-300/40 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>IN PROGRESS</span>
            </div>
          ) : isUpcoming ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-gradient-to-r from-slate-900/90 to-indigo-950/90 backdrop-blur-md border border-sky-400/30 shadow-sm">
              <Clock className="w-2.5 h-2.5 text-sky-300" />
              <span>UPCOMING</span>
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-slate-900/90 backdrop-blur-md border border-slate-700/50 shadow-sm">
              <CheckCircle2 className="w-2.5 h-2.5 text-slate-300" />
              <span>COMPLETED</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black text-white bg-rose-950/90 backdrop-blur-md border border-rose-500/40 shadow-sm">
              <XCircle className="w-2.5 h-2.5 text-rose-300" />
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
            className="text-sm sm:text-[15px] font-black leading-snug text-white line-clamp-1 drop-shadow-md group-hover:text-primary-200 transition-colors font-heading"
            title={journey.title}
          >
            {journey.title}
          </h3>
        </div>
      </div>

      {/* Compact Body Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        
        {/* Info Row: Date/Duration + Squad Avatars */}
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium">
            <Calendar className="w-3 h-3 text-brand shrink-0" />
            <span>
              {journey.startDate
                ? new Date(journey.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD"}
            </span>
            <span className="text-slate-300">•</span>
            <span>{durationDays} {durationDays === 1 ? "Day" : "Days"}</span>
          </div>

          {/* Overlapping Explorers */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center -space-x-1.5">
              {journey.members && journey.members.length > 0 ? (
                journey.members.slice(0, 2).map((m, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-200 shrink-0 shadow-xs"
                    title={m.user?.name || "Traveler"}
                  >
                    <Avatar
                      user={m.user}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary-100 text-brand flex items-center justify-center text-[10px] font-bold border border-white shadow-xs">
                  👤
                </div>
              )}
            </div>
            <span className="text-[10.5px] font-bold text-text-secondary">
              {isSolo ? "Solo" : `${Math.max(1, journey.members?.length || journey.memberCount || 1)}`}
            </span>
          </div>
        </div>

        {/* Status indicator / Countdown (Compact) */}
        {isOngoing ? (
          <div className="space-y-1.5 bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Day {Math.min(currentDay, durationDays)} of {durationDays}
              </span>
              <span className="text-brand font-extrabold">{progressPercent}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#06b6d4] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : isUpcoming && journey.startDate ? (
          <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 bg-sky-50/70 px-3 py-1.5 rounded-xl border border-sky-100">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3 h-3 text-brand" />
              Countdown
            </span>
            <span className="text-brand font-extrabold">
              {(() => {
                const diffDays = Math.ceil((new Date(journey.startDate) - Date.now()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) return "Departs today";
                if (diffDays === 1) return "Departs tomorrow";
                return `Starts in ${diffDays}d`;
              })()}
            </span>
          </div>
        ) : isCompleted && journey.stats && (journey.stats.photosCount > 0 || journey.stats.postsCount > 0) ? (
          <div className="flex items-center gap-2.5 text-[10.5px] font-bold text-text-secondary bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3 text-primary-500" /> {journey.stats.photosCount || 0} Photos</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-brand" /> {(journey.stats.postsCount || 0) + (journey.stats.checkInsCount || 0)} Memories</span>
          </div>
        ) : null}

        {/* Action Button & Stamp */}
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/social/journeys/${journey._id}`}
              className="btn-primary flex-1 !min-h-[40px] !py-2 !px-3 !text-[11px] !tracking-wider flex items-center justify-center gap-1.5 group/btn"
            >
              <span>Open Journey</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Link>
            {isOngoing && onCheckInClick && (
              <button
                type="button"
                onClick={() => onCheckInClick(journey)}
                className="w-10 h-10 rounded-xl bg-sky-50 hover:bg-sky-100 text-brand border border-sky-200/80 flex items-center justify-center shrink-0 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Safe Check-In"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[8.5px] font-bold text-text-muted tracking-[0.1em] px-0.5">
            <span>{getSignatureCode()}</span>
            <span className="text-[8px] text-brand uppercase font-extrabold">YatriGo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyCard;
