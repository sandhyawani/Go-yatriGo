import React from "react";
import { useNavigate } from "react-router-dom";
import { Map, Plane, Compass } from "lucide-react";
import moment from "moment";
import Card from "../common/Card";

const STATUS_CONFIG = {
  ongoing: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Boarding Now"
  },
  planning: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    label: "Planning"
  },
  upcoming: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
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

  const normalizedStatus = journey?.isBuddyTrip ?
  journey.status === "active" || journey.status === "active now" || journey.status === "Ongoing" ? "ongoing" : journey.status ? journey.status.toLowerCase() : "planning" :
  journey?.status ? journey.status.toLowerCase() : "planning";

  const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.planning;

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

    if (now.isBefore(start)) {
      const diff = Math.ceil(start.diff(now, 'days'));
      text = `T-${diff} days`;
      progressPercentage = 0;
    } else if (now.isAfter(end)) {
      text = `Completed`;
      progressPercentage = 100;
    } else {
      const currentDay = Math.min(totalDays, Math.ceil(now.diff(start, 'days')) + 1);
      text = `Day ${currentDay}/${totalDays}`;
      progressPercentage = Math.min(100, Math.max(0, currentDay / totalDays * 100));
    }

    return { text, progressPercentage, totalDays };
  };

  const durationInfo = getDurationInfo();
  const isOngoing = normalizedStatus === "ongoing";

  const routeParts = {
    from: journey.from && journey.from.trim() !== "" ?
    journey.from.split(",")[0] :
    user?.location ? user.location.split(",")[0] : "Unknown",
    to: journey.destination?.split(",")[0] || "Unknown"
  };

  const travelerCount = journey.members?.length || 1;

  return (
    <Card variant="default" padding="none" interactive onClick={handleNavigateWorkspace} className="flex flex-col md:flex-row overflow-hidden group">
      
      {}
      <div className="flex-1 min-w-0 p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between">
        <Compass className="absolute -left-10 -bottom-10 w-40 h-40 text-[#7C3AED] opacity-[0.02] transform -rotate-45 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 flex items-center gap-2">
            <Map className="w-3.5 h-3.5" />
            Trip Plan
          </span>
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${isOngoing ? "animate-pulse" : ""}`} />
            {statusConfig.label}
          </span>
        </div>

        <div className="relative z-10 mb-3">
          <h3 className="text-base font-bold text-slate-800 mb-1.5 line-clamp-2 group-hover:text-brand-600 transition-colors">{journey.title}</h3>
          
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</span>
              <span className="text-base font-black text-slate-800 truncate leading-tight capitalize block" title={routeParts.from}>{routeParts.from}</span>
            </div>

            <div className="w-12 sm:w-16 shrink-0 flex flex-col items-center">
              <div className="w-full relative flex items-center justify-center">
                <div className="absolute w-full h-[1px] bg-slate-200"></div>
                <Plane className="w-5 h-5 text-brand-400 absolute bg-white px-1" />
              </div>
              {durationInfo &&
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mt-2 bg-brand-50 px-2 py-0.5 rounded-[var(--radius-button)] z-10 whitespace-nowrap">
                  {durationInfo.text}
                </span>}

            </div>

            <div className="flex flex-col text-right flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</span>
              <span className="text-base font-black text-slate-800 truncate leading-tight capitalize block" title={routeParts.to}>{routeParts.to}</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-[var(--border-default)] pt-2.5 mt-auto">
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Trip ID</span>
            <span className="text-[11px] font-black text-slate-700">
              GY-{displayId ? displayId.toString().slice(-4).toUpperCase() : "1000"}
            </span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</span>
            <span className="text-[11px] font-black text-slate-700">
              {journey.startDate ? moment(journey.startDate).format("MMM DD") : "TBD"}
            </span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mode</span>
            <span className="text-[11px] font-black text-slate-700">
              {journey.transportation || "Mixed"}
            </span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Travelers</span>
            <span className="text-[11px] font-black text-slate-700">
              {travelerCount}
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="w-full md:w-px h-px md:h-auto bg-[var(--border-default)]"></div>

      {}
      <div className="p-3.5 sm:p-4 bg-slate-50 flex flex-col justify-center items-center md:w-40 shrink-0 relative">
        <div className="w-full mb-3 relative">
           <div className="flex justify-between items-end mb-1.5">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Progress</span>
             <span className="text-[10px] font-bold text-brand-600">{Math.round(durationInfo?.progressPercentage || 0)}%</span>
           </div>
           <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden shadow-inner border border-slate-300/50">
              <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 relative transition-all duration-1000 ease-out"
            style={{ width: `${durationInfo?.progressPercentage || 0}%` }}>

                <div className="absolute top-0 right-0 bottom-0 w-6 bg-white/20 skew-x-[-20deg] animate-pulse"></div>
              </div>
           </div>
        </div>
        
        <div className="w-full pt-1.5 flex flex-col gap-2">
          {!journey.isBuddyTrip && journey.sourceType === "explore" && journey.sourceId ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/social/journeys/${journey._id}`);
                }}
                className="w-full py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-black uppercase tracking-wider rounded-[var(--radius-button)] transition-all duration-200 shadow-md shadow-[#7C3AED]/20 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
              >
                Board Now
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/social/buddy/${journey.sourceId}`);
                }}
                className="w-full py-2 bg-white border border-[var(--border-default)] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-[var(--radius-button)] transition-all duration-200 shadow-sm"
              >
                View Group
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (journey.isBuddyTrip) {
                  navigate(`/social/buddy/${journey._id}`);
                } else {
                  navigate(`/social/journeys/${journey._id}`);
                }
              }}
              className="w-full py-2 bg-white border border-[var(--border-default)] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-[var(--radius-button)] transition-all duration-200 shadow-sm"
            >
              {journey.isBuddyTrip ? "View Group" : "Board Now"}
            </button>
          )}
        </div>
      </div>

    </Card>);

};

export default JourneyStatusWidget;