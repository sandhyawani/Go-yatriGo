import React from "react";
import {
  ShieldCheck,
  Clock,
  Camera,
  Sparkles,
  Navigation,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const JourneyTimelineView = ({
  timeline = [],
  journeyStatus,
  onTriggerCheckIn,
}) => {
  const getEventIcon = (type) => {
    switch (type) {
      case "safe_checkin":
        return (
          <div className="p-2.5 bg-emerald-500 text-white rounded-full shadow-md">
            <ShieldCheck className="w-4 h-4 animate-bounce" />
          </div>
        );
      case "journey_started":
        return (
          <div className="p-2.5 bg-[#f4f1ff]0 text-white rounded-full shadow-md">
            <Navigation className="w-4 h-4 animate-spin-slow" />
          </div>
        );
      case "journey_completed":
        return (
          <div className="p-2.5 bg-purple-500 text-white rounded-full shadow-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "photo_uploaded":
      case "post_shared":
        return (
          <div className="p-2.5 bg-amber-500 text-white rounded-full shadow-md">
            <Camera className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-slate-700 text-white rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Safe Check-in Bar */}
      <div className="bg-gradient-to-r bg-[#6C4DF6] p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              Real-time Safety & Timeline Feed
            </h3>
            <p className="text-xs text-emerald-100">
              Broadcast your safe check-in checkpoints to squad & SOS contacts.
            </p>
          </div>
        </div>

        {journeyStatus === "Ongoing" && onTriggerCheckIn && (
          <button
            onClick={onTriggerCheckIn}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-emerald-800 text-xs font-black uppercase tracking-wider shadow-xl hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#6C4DF6]" /> Broadcast Safe
            Check-In
          </button>
        )}
      </div>

      {/* Timeline List */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {timeline.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">
              No timeline activity logged yet.
            </p>
            <p className="text-xs">
              Milestones and safe check-ins will appear here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 my-2">
            {timeline.map((item) => (
              <div key={item._id} className="relative group">
                {/* Timeline Node */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-0 ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110">
                  {getEventIcon(item.eventType)}
                </div>

                {/* Content Box */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </span>
                      {item.checkInType && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black tracking-wide">
                          {item.checkInType}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium shrink-0">
                      <Clock className="w-3 h-3" /> {formatTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* Uploader Footer or Media */}
                  {item.mediaUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden w-full bg-black/5">
                      <img
                        src={item.mediaUrl}
                        alt="Timeline Capture"
                        className="w-full object-cover max-h-60"
                      />
                    </div>
                  )}

                  {item.userName && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                      <img
                        src={
                          item.userPic ||
                          `https://ui-avatars.com/api/?name=${item.userName}&background=random`
                        }
                        alt={item.userName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Logged by {item.userName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyTimelineView;
