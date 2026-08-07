import React from "react";
import {
ShieldCheck,
Clock,
Camera,
Sparkles,
Navigation,
CheckCircle2,
AlertCircle } from
"lucide-react";

const JourneyTimelineView = ({
  timeline = [],
  journeyStatus,
  onTriggerCheckIn
}) => {
  const getEventIcon = (type) => {
    switch (type) {
      case "safe_checkin":
        return (
          <div className="p-2.5 bg-emerald-500 text-white rounded-full shadow-md">
            <ShieldCheck className="w-4 h-4 animate-bounce" />
          </div>);

      case "journey_started":
        return (
          <div className="p-2.5 bg-[#f4f1ff]0 text-white rounded-full shadow-md">
            <Navigation className="w-4 h-4 animate-spin-slow" />
          </div>);

      case "journey_completed":
        return (
          <div className="p-2.5 bg-brand-500 text-white rounded-full shadow-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>);

      case "photo_uploaded":
      case "post_shared":
        return (
          <div className="p-2.5 bg-amber-500 text-white rounded-full shadow-md">
            <Camera className="w-4 h-4" />
          </div>);

      default:
        return (
          <div className="p-2.5 bg-slate-700 text-white rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>);

    }
  };

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {}
      <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 rounded-2xl p-3.5 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 m-0 leading-relaxed">
          <strong className="font-black">Travel Safety Coordination System:</strong> Check-ins rely on traveller activity and network availability. In critical emergencies, always contact local emergency services directly.
        </p>
      </div>

      {}
      <div className="bg-[#1E293B] dark:bg-slate-950 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#7C3AED]/20 rounded-2xl border border-[#7C3AED]/40 text-[#7C3AED]">
            <ShieldCheck className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                🟢 Safe & On Schedule
              </span>
            </div>
            <h3 className="text-base font-black text-white m-0">
              Safety Timeline & Check-In Feed
            </h3>
            <p className="text-xs text-slate-400 font-medium m-0 mt-0.5">
              Automated check-in logs shared with your squad & trusted emergency contacts.
            </p>
          </div>
        </div>

        {journeyStatus === "Ongoing" && onTriggerCheckIn &&
        <button
        onClick={onTriggerCheckIn}
        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0">

            <ShieldCheck className="w-4 h-4" /> Broadcast Safe Check-In
          </button>}

      </div>

      {}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-[#7C3AED] flex items-center justify-center text-base shrink-0">
            ⏰
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Check-In Interval</span>
            <p className="font-black text-slate-800 dark:text-slate-100 m-0">Every 4 Hours</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base shrink-0">
            🛡️
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency SOS</span>
            <p className="font-black text-slate-800 dark:text-slate-100 m-0">Auto-Notify on Missed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base shrink-0">
            ⏳
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Grace Period</span>
            <p className="font-black text-slate-800 dark:text-slate-100 m-0">30 Min Buffer</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {timeline.length === 0 ?
        <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No timeline activity logged yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast a safe check-in to log your status and location.
            </p>
          </div> :

        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-6 my-2">
            {timeline.map((item) =>
          <div key={item._id} className="relative group">
                {}
                <div className="absolute -left-[35px] sm:-left-[43px] top-0 ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110">
                  {getEventIcon(item.eventType)}
                </div>

                {}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                      {item.checkInType &&
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black tracking-wide">
                          🟢 {item.checkInType}
                        </span>}

                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium shrink-0">
                      <Clock className="w-3 h-3 text-[#7C3AED]" /> {formatTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-1 font-medium">
                    {item.description}
                  </p>

                  {}
                  {item.mediaUrl &&
              <div className="mt-3 rounded-xl overflow-hidden w-full bg-black/5">
                      <img
                src={item.mediaUrl}
                alt="Timeline Capture"
                className="w-full object-cover max-h-60" />

                    </div>}


                  {item.userName &&
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                      <img
                src={
                item.userPic ||
                `https://ui-avatars.com/api/?name=${item.userName}&background=random`}

                alt={item.userName}
                className="w-5 h-5 rounded-full object-cover" />

                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Logged by {item.userName}
                      </span>
                    </div>}

                </div>
              </div>
          )}
          </div>}

      </div>
    </div>);

};

export default JourneyTimelineView;