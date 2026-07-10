import React, { useState, useEffect } from "react";
import {
  Compass,
  Award,
  Calendar,
  MapPin,
  Camera,
  Sparkles,
  Users,
  Globe,
  ShieldCheck,
  Sun,
  Mountain,
  Milestone,
} from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyStatistics = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = userId
      ? `/journeys/stats/user/${userId}`
      : `/journeys/stats/me`;
    axiosInstance
      .get(endpoint)
      .then((res) => {
        if (res.data?.success) setStats(res.data.stats);
      })
      .catch((err) => console.error("Error fetching journey stats:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Compass className="w-8 h-8 mx-auto mb-2 animate-spin text-[#8B5CF6]" />
        <p className="text-xs">Loading Profile & Journey Stats...</p>
      </div>
    );
  }

  const s = stats || {
    totalJourneys: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
    travelDays: 0,
    photosShared: 0,
    storiesShared: 0,
    postsShared: 0,
    mostVisitedDestination: "None",
    achievements: [],
  };

  const statCards = [
    {
      label: "Total Journeys",
      val: s.totalJourneys,
      icon: <Globe className="w-5 h-5 text-[#8B5CF6]" />,
    },
    {
      label: "Completed Trips",
      val: s.completed,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    },
    {
      label: "Upcoming Trips",
      val: s.upcoming,
      icon: <Calendar className="w-5 h-5 text-amber-500" />,
    },
    {
      label: "Total Travel Days",
      val: s.travelDays,
      icon: <Compass className="w-5 h-5 text-brand-500" />,
    },
    {
      label: "Memories Captured",
      val: (s.photosShared || 0) + (s.postsShared || 0),
      icon: <Camera className="w-5 h-5 text-rose-500" />,
    },
    {
      label: "Top Destination",
      val: s.mostVisitedDestination || "None",
      icon: <MapPin className="w-5 h-5 text-orange-500" />,
      isText: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((c, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              {c.icon}
            </div>
            <span
              className={`font-black text-slate-800 dark:text-slate-100 ${c.isText ? "text-base sm:text-lg line-clamp-1" : "text-2xl sm:text-3xl"}`}
            >
              {c.val}
            </span>
          </div>
        ))}
      </div>

      {/* Badges / Achievements Wall */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        {/* Subtle decorative purple glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-[#8B5CF6] dark:text-brand-400 rounded-2xl border border-brand-100 dark:border-brand-800/50 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Unlocked Badges & Achievements ({s.achievements?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Milestones achieved across collaborative travel journeys.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#8B5CF6] dark:text-brand-300 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800/60 shadow-sm self-start sm:self-center">
            Traveler Tier: Explorer
          </span>
        </div>

        {!s.achievements || s.achievements.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 relative z-10 font-medium">
            Complete your first collaborative travel journey to unlock your
            first badge!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
            {s.achievements.map((badge, bIdx) => (
              <div
                key={bIdx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all flex items-center gap-3 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform font-bold text-lg shadow-sm">
                  🏆
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#8B5CF6] dark:group-hover:text-brand-300 transition-colors">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                    {badge.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyStatistics;

