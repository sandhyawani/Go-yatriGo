import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Users,
  User,
} from "lucide-react";
import JourneyStatusBadge from "./JourneyStatusBadge";
import Avatar from "../common/Avatar";

const JourneyCard = ({ journey, onCheckInClick }) => {
  const isSolo =
    journey.journeyType === "Solo Journey" ||
    journey.journeyType === "Solo" ||
    (journey.members?.length <= 1 && !journey.journeyType?.includes("Shared"));

  const getJourneyTypeBadge = () => {
    if (isSolo) {
      return "Solo Journey";
    }
    return "Shared Journey";
  };

  const defaultCover =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#8B5CF6]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      {/* Compact Media Header */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        <img
          src={journey.coverImage || defaultCover}
          alt={journey.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

        {/* Top Badges (Side-by-Side on Top Left) */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 max-w-[90%]">
          <div className="shrink-0">
            <JourneyStatusBadge status={journey.status} />
          </div>
          <span className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[10px] font-black text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
            {isSolo ? (
              <User className="w-3 h-3 text-[#8B5CF6] shrink-0" />
            ) : (
              <Users className="w-3 h-3 text-[#8B5CF6] shrink-0" />
            )}
            <span>{getJourneyTypeBadge()}</span>
          </span>
        </div>

        {/* Destination Specs */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <div className="flex items-center gap-1 text-[10px] font-black tracking-wider text-[#e2dbff] uppercase truncate">
            <MapPin className="w-3 h-3 text-[#FF5A7A] shrink-0 stroke-[2.5]" />{" "}
            {journey.destination}
          </div>
          <h3 className="text-base font-black leading-tight truncate text-white mt-0.5">
            {journey.title}
          </h3>
        </div>
      </div>

      {/* Compact Body Specs */}
      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Date & Duration */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center truncate">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#8B5CF6] shrink-0" />
            {journey.startDate
              ? new Date(journey.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "Date TBD"}
          </span>
          <span className="text-[#8B5CF6] bg-brand-50 dark:bg-brand-900/60 px-2.5 py-1 rounded-lg font-black text-[11px] border border-brand-100 dark:border-brand-800/50 shrink-0">
            {journey.durationDays || 3} Days
          </span>
        </div>

        {/* Squad Members Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center -space-x-1.5 shrink-0">
              {journey.members?.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-200 shrink-0"
                  title={m.user?.name || "Squad Member"}
                >
                  <Avatar
                    user={m.user}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 truncate">
              {journey.members?.length || 1}{" "}
              {(journey.members?.length || 1) === 1 ? "Member" : "Members"}
            </span>
          </div>

          {journey.status === "Ongoing" && onCheckInClick && (
            <button
              onClick={() => onCheckInClick(journey)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all shadow-xs shrink-0 flex items-center gap-1 text-[11px] font-extrabold"
              title="Safe Check-In"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>
          )}
        </div>

        {/* Prominent Full-Width Action Button */}
        <Link
          to={`/social/journeys/${journey._id}`}
          className="w-full mt-1 py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-extrabold shadow-md shadow-[#8B5CF6]/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 group/btn"
        >
          <span>Open Journey</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default JourneyCard;

