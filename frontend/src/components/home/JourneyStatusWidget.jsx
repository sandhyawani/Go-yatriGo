import React from "react";
import { useNavigate } from "react-router-dom";
import { Map, Compass, ArrowRight } from "lucide-react";
import moment from "moment";
import Card from "../common/Card";
import { normalizeJourneyStatus } from "../../utils/journeyLifecycle";

const STATUS_CONFIG = {
  ongoing: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Boarding Now"
  },
  planning: {
    badge: "bg-brand-50 text-brand-700 border-brand-200",
    dot: "bg-brand-600",
    label: "Upcoming"
  },
  upcoming: {
    badge: "bg-brand-50 text-brand-700 border-brand-200",
    dot: "bg-brand-600",
    label: "Upcoming"
  },
  completed: {
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    label: "Completed"
  },
  cancelled: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    label: "Cancelled"
  }
};

const JourneyStatusWidget = ({ journey, user }) => {
  const navigate = useNavigate();

  const displayId = (!journey?.isBuddyTrip && journey?.sourceType === "explore" && journey?.sourceId)
    ? journey.sourceId
    : journey?._id;

  const normalizedStatus = normalizeJourneyStatus(journey);
  const isOngoing = normalizedStatus === "active";
  const isUpcoming = normalizedStatus === "upcoming";
  const statusConfig = STATUS_CONFIG[isOngoing ? "ongoing" : (isUpcoming ? "upcoming" : (normalizedStatus || "upcoming"))] || STATUS_CONFIG.upcoming;

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

  const getDurationInfo = () => {
    if (!journey.startDate || !journey.endDate) return null;
    const start = moment(journey.startDate);
    const end = moment(journey.endDate);
    const totalDays = Math.max(1, Math.ceil(end.diff(start, 'days')) + 1);
    const now = moment();

    let text = "";
    let progressPercentage = 0;

    if (now.isBefore(start, 'day')) {
      const diff = Math.ceil(start.diff(now, 'days'));
      text = diff <= 0 ? "Departs Today" : diff === 1 ? "Departs Tomorrow" : `Departs in ${diff} days (T-${diff})`;
      progressPercentage = 0;
    } else if (now.isAfter(end, 'day')) {
      text = `Completed`;
      progressPercentage = 100;
    } else {
      const currentDay = Math.min(totalDays, Math.ceil(now.diff(start, 'days')) + 1);
      text = `DAY ${currentDay}/${totalDays}`;
      progressPercentage = Math.min(100, Math.max(0, currentDay / totalDays * 100));
    }

    return { text, progressPercentage, totalDays };
  };

  const durationInfo = getDurationInfo();

  const routeParts = {
    from: journey.from && journey.from.trim() !== "" ?
      journey.from.split(",")[0] :
      user?.location ? user.location.split(",")[0] : "Unknown",
    to: journey.destination?.split(",")[0] || "Unknown"
  };

  const getTravelerCount = () => {
    let count = 0;
    if (journey.creator || journey.host || journey.userId) count += 1;
    if (journey.members && Array.isArray(journey.members)) {
      count += journey.members.length;
    }
    return count > 0 ? count : 1;
  };
  const travelerCount = getTravelerCount();

  return (
    <Card
      variant="default"
      padding="none"
      interactive
      onClick={handleNavigateWorkspace}
      className="overflow-hidden group border-slate-200/80 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-300 relative"
    >
      <Compass className="absolute -right-8 -bottom-8 w-36 h-36 text-brand-600 opacity-[0.02] transform -rotate-12 pointer-events-none" />

      <div className="p-4 sm:p-5 flex flex-col gap-3.5 relative z-10">
        {/* Top Header: Badge & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-brand-600 flex items-center gap-1.5 font-sans">
            <Map className="w-3.5 h-3.5" />
            {isOngoing ? "CURRENT JOURNEY" : "UPCOMING EXPEDITION"}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.08em] flex items-center gap-1.5 ${statusConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${isOngoing ? "animate-pulse" : ""}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Journey Title */}
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-brand-600 transition-colors font-heading">
            {journey.title}
          </h3>
        </div>

        {/* Route: From -> To */}
        <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-[0.08em] block mb-0.5">From</span>
            <p className="text-sm sm:text-base font-bold text-slate-800 truncate capitalize font-heading" title={routeParts.from}>
              {routeParts.from}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-xs">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            {journey.transportation && (
              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {journey.transportation}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-right">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-[0.08em] block mb-0.5">To</span>
            <p className="text-sm sm:text-base font-bold text-slate-800 truncate capitalize font-heading" title={routeParts.to}>
              {routeParts.to}
            </p>
          </div>
        </div>

        {/* Day Progress & Progress Bar */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" />
              {durationInfo?.text || (isOngoing ? "Ongoing Trip" : "Upcoming Trip")}
            </span>
            <span className="text-[11.5px] font-extrabold text-brand-600 font-heading">
              {Math.round(durationInfo?.progressPercentage || 0)}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.max(4, Math.min(100, durationInfo?.progressPercentage || 0))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* Metadata Grid & Action Button */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-4 gap-2 flex-1 min-w-0">
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Trip ID</span>
              <span className="text-[11px] font-bold text-slate-800 truncate block">
                GY-{displayId ? displayId.toString().slice(-4).toUpperCase() : "1000"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Date</span>
              <span className="text-[11px] font-bold text-slate-800 truncate block">
                {journey.startDate ? moment(journey.startDate).format("MMM DD") : "TBD"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Mode</span>
              <span className="text-[11px] font-bold text-slate-800 truncate block capitalize">
                {journey.transportation || "Mixed"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-0.5">Travelers</span>
              <span className="text-[11px] font-bold text-slate-800 truncate block">
                {travelerCount}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            {!journey.isBuddyTrip && journey.sourceType === "explore" && journey.sourceId ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/social/journeys/${journey._id}`);
                  }}
                  className="btn-primary !py-2 !px-4 text-xs font-bold shadow-sm hover:shadow-md"
                >
                  {isOngoing ? "Board Now" : "View Journey"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/social/buddy/${journey.sourceId}`);
                  }}
                  className="btn-secondary !py-2 !px-3 text-xs font-bold"
                >
                  View Group
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (journey.isBuddyTrip) {
                    navigate(`/social/buddy/${journey._id}`);
                  } else {
                    navigate(`/social/journeys/${journey._id}`);
                  }
                }}
                className="btn-primary !py-2 !px-5 text-xs font-bold shadow-sm hover:shadow-md w-full sm:w-auto"
              >
                {journey.isBuddyTrip
                  ? (isOngoing ? "Board Now" : "View Group")
                  : (isOngoing ? "Board Now" : "View Journey")}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JourneyStatusWidget;