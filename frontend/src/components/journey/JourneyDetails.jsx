import React from "react";
import { ShieldCheck, Sparkles, Compass, Users, Crown, ShieldAlert, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Avatar from "../common/Avatar";
import { getJourneyLifecycle } from "../../utils/journeyLifecycle";

const JourneyDetails = ({ journey, currentUserId, onTabChange, onOpenCheckIn }) => {
  if (!journey) return null;

  const lifecycle = getJourneyLifecycle(journey);

  const formatDateRange = (start, end) => {
    if (!start) return "Dates TBD";
    const s = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const e = end
      ? new Date(end).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "";
    return e ? `${s} – ${e}` : s;
  };

  const members = journey.members || [];
  const previewMembers = members.slice(0, 4);

  const milestones = [
    { title: "Journey Started", key: "started", completed: lifecycle.isOngoing || lifecycle.isCompleted },
    { title: "At Destination", key: "destination", completed: lifecycle.isOngoing || lifecycle.isCompleted },
    { title: "Return Journey", key: "returning", completed: lifecycle.isCompleted },
    { title: "Reached Home Safely", key: "completed", completed: lifecycle.isCompleted }
  ];

  const completedCount = milestones.filter((m) => m.completed).length;

  const isMember =
    (journey.creator?._id || journey.creator)?.toString() === currentUserId?.toString() ||
    members.some((m) => (m.user?._id || m.user)?.toString() === currentUserId?.toString());

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 2-Column Travel Dashboard Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Journey Progress & Description */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-brand-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Journey Progress
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {completedCount} of {milestones.length} milestones
              </span>
            </div>

            {/* Milestones Horizontal / Vertical Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                    m.completed
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {m.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                      Step {idx + 1}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-2">
                    {m.title}
                  </span>
                </div>
              ))}
            </div>

            {!lifecycle.isOngoing && !lifecycle.isCompleted && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic m-0 pt-0.5">
                Journey actions unlock when your trip starts.
              </p>
            )}

            {/* About / Description */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#7C3AED]" /> About Trip
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium m-0">
                {journey.description ||
                  `Exploring ${journey.destination || "the destination"} with fellow travel companions on Go YatriGo.`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Your Travel Team (Compact Preview) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#7C3AED]" /> Travel Team ({members.length})
              </span>
              {onTabChange && (
                <button
                  onClick={() => onTabChange("members")}
                  className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-0.5 transition-colors"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 mt-2.5">
              {previewMembers.map((m, idx) => {
                const u = m.user || {};
                const isHostRole = m.role === "Organizer" || m.role === "host" || (journey.creator?._id || journey.creator)?.toString() === (u._id || u)?.toString();
                const isCoLeader = m.role === "Co-Organizer" || m.role === "cohost" || m.role === "Co-Leader";

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Avatar user={u} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {u.name || "Traveler"}
                      </span>
                    </div>

                    {isHostRole ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[9px] font-bold flex items-center gap-1 shrink-0">
                        <Crown className="w-2.5 h-2.5 text-amber-500" /> Host
                      </span>
                    ) : isCoLeader ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[9px] font-bold flex items-center gap-1 shrink-0">
                        <ShieldAlert className="w-2.5 h-2.5 text-purple-500" /> Co-Leader
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold shrink-0">
                        Member
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {onTabChange && (
            <button
              onClick={() => onTabChange("members")}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1.5"
            >
              <span>Manage Roster & Roles</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Safety Area */}
      <div
        className={`p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
          lifecycle.isOngoing
            ? "bg-gradient-to-r from-emerald-500/10 via-white dark:via-slate-900 to-emerald-500/5 border-emerald-200/80 dark:border-emerald-800/60"
            : lifecycle.isCancelled
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40"
            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              lifecycle.isOngoing
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60"
                : lifecycle.isCancelled
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Safety & Emergency Hub
              </h4>
              <span
                className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                  lifecycle.isOngoing
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                    : lifecycle.isCompleted
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    : lifecycle.isCancelled
                    ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {lifecycle.isOngoing
                  ? "ACTIVE"
                  : lifecycle.isCompleted
                  ? "COMPLETED"
                  : lifecycle.isCancelled
                  ? "CANCELLED"
                  : "PRE-TRIP"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {lifecycle.isOngoing
                ? "Live traveler check-ins, safety tracking and emergency response for this trip."
                : lifecycle.isCompleted
                ? "Journey safely completed. Safety history is archived for this trip."
                : lifecycle.isCancelled
                ? "Journey was cancelled. Safety monitoring is inactive."
                : "Safety tools will become active when your journey starts."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lifecycle.isOngoing && isMember && onOpenCheckIn && (
            <button
              onClick={onOpenCheckIn}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>I'm Safe</span>
            </button>
          )}

          {onTabChange && (
            <button
              onClick={() => onTabChange("timeline")}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1"
            >
              <span>Safety Timeline</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;