import React from "react";
import { Calendar, MapPin, ShieldCheck, Sparkles, Compass } from "lucide-react";
import Avatar from "../common/Avatar";

const JourneyDetails = ({ journey }) => {
  const formatDateRange = (start, end) => {
    if (!start) return "Dates TBD";
    const s = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const e = end ?
    new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) :
    "";
    return e ? `${s} - ${e}` : s;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {}
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-[#FF5A7A] rounded-xl shrink-0">
            <MapPin className="w-5 h-5 text-[#FF5A7A]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Destination
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate block">
              {journey.destination || "TBD"}
            </span>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Travel Window
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate block">
              {formatDateRange(journey.startDate, journey.endDate)}
            </span>
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl shrink-0">
            <Compass className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Category / Audience
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
              {journey.category || "Connections"}
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> About This
              Journey
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
              {journey.description ||
              "No detailed notes or itinerary summary provided for this journey yet. Check the Collaborative Workspace or Timeline tabs for more specifics."}
            </p>
          </div>
        </div>

        {}
        <div className="bg-gradient-to-br from-brand-500/10 via-white dark:via-slate-900 to-brand-500/5 p-6 rounded-2xl border border-brand-200/80 dark:border-brand-800/80 shadow-sm relative overflow-hidden flex flex-col justify-between gap-5">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start gap-4 relative z-10">
            <Avatar
            user={journey.creator || {}}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/30 shadow-sm shrink-0" />

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#7C3AED] dark:text-brand-400 block mb-0.5">
                Lead Organizer
              </span>
              <h4 className="text-base font-black truncate text-slate-900 dark:text-white">
                {journey.creator?.name || "Traveler"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium">
                {journey.creator?.bio ||
                "Passionate explorer & trip organizer on Go yatriGo"}
              </p>
            </div>
          </div>

          <div className="pt-3.5 border-t border-brand-100 dark:border-brand-900/50 flex items-center justify-between relative z-10 text-xs">
            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />{" "}
              Verified Trip Leader
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-[#7C3AED] dark:text-brand-300 text-[10px] font-black uppercase tracking-wider">
              Host
            </span>
          </div>
        </div>
      </div>
    </div>);

};

export default JourneyDetails;