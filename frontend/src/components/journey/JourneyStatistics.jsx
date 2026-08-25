import React, { useState, useEffect } from "react";
import { Compass, Award, Calendar, Globe, ShieldCheck, Info, X } from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyStatistics = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const endpoint = userId ?
    `/journeys/stats/user/${userId}` :
    `/journeys/stats/me`;
    axiosInstance.
    get(endpoint).
    then((res) => {
      if (res.data?.success) setStats(res.data.stats);
    }).
    catch((err) => console.error("Error fetching journey stats:", err)).
    finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Compass className="w-8 h-8 mx-auto mb-2 animate-spin text-[#7C3AED]" />
        <p className="text-xs">Loading Profile & Journey Stats...</p>
      </div>);

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
    achievements: []
  };

  const statCards = [
  {
    label: "Total Journeys",
    val: s.totalJourneys ?? 0,
    icon: <Globe className="w-5 h-5 text-[#7C3AED]" />
  },
  {
    label: "Completed Trips",
    val: s.completed ?? s.completedJourneysCount ?? 0,
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />
  },
  {
    label: "Upcoming Trips",
    val: s.upcoming ?? 0,
    icon: <Calendar className="w-5 h-5 text-amber-500" />
  },
  {
    label: "Total Travel Days",
    val: s.travelDays ?? s.totalTravelDays ?? 0,
    icon: <Compass className="w-5 h-5 text-brand-500" />
  }
  ];


  const getTravelerTier = (trips) => {
    if (!trips || trips === 0) return "Novice";
    if (trips <= 2) return "Explorer";
    if (trips <= 5) return "Adventurer";
    if (trips <= 10) return "Veteran";
    return "Legend";
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* ...existing code for statCards... */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map((c, i) =>
        <div
        key={i}
        className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1 mr-1">
                {c.label}
              </span>
              {React.cloneElement(c.icon, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ' + c.icon.props.className.split(' ').filter(cls => !cls.startsWith('w-') && !cls.startsWith('h-')).join(' ') })}
            </div>
            <span
          className={`font-black text-slate-800 dark:text-slate-100 ${c.isText ? "text-sm sm:text-base line-clamp-1" : "text-xl sm:text-2xl"}`}>

              {c.val}
            </span>
          </div>
        )}
      </div>

      {/* ...existing code for badges... */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        {/* ...existing bg element... */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-[#7C3AED] dark:text-brand-400 rounded-2xl border border-brand-100 dark:border-brand-800/50 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Unlocked Badges & Achievements ({s.achievements?.length || 0})
                <button onClick={() => setShowInfoModal(true)} className="text-slate-400 hover:text-brand-500 transition-colors p-1 bg-slate-50 hover:bg-brand-50 rounded-full">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Milestones achieved across collaborative travel journeys.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#7C3AED] dark:text-brand-300 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800/60 shadow-sm self-start sm:self-center">
            Traveler Tier: {getTravelerTier(s.totalJourneys)}
          </span>
        </div>

        {!s.achievements || s.achievements.length === 0 ?
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 relative z-10 font-medium">
            Complete your first collaborative travel journey to unlock your
            first badge!
          </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
            {s.achievements.map((badge, bIdx) =>
          <div
          key={bIdx}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all flex items-center gap-3 group shadow-sm">

                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform font-bold text-lg shadow-sm">
                  🏆
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#7C3AED] dark:group-hover:text-brand-300 transition-colors">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                    {badge.desc}
                  </p>
                </div>
              </div>
          )}
          </div>}

      </div>
      
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">Achievements Guide</h3>
              </div>
              <button onClick={() => setShowInfoModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Traveler Tiers</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Novice', req: '0 Journeys', color: 'bg-slate-100 text-slate-600' },
                    { name: 'Explorer', req: '1-2 Journeys', color: 'bg-emerald-50 text-emerald-600' },
                    { name: 'Adventurer', req: '3-5 Journeys', color: 'bg-brand-50 text-brand-700' },
                    { name: 'Veteran', req: '6-10 Journeys', color: 'bg-purple-100 text-purple-800' },
                    { name: 'Legend', req: '11+ Journeys', color: 'bg-amber-50 text-amber-600' }
                  ].map(tier => (
                    <div key={tier.name} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${tier.color}`}>{tier.name}</span>
                      <span className="text-[11px] font-medium text-slate-500">{tier.req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Available Badges</h4>
                <div className="grid gap-2">
                  {[
                    { title: "First Steps", desc: "Complete 1 collaborative journey." },
                    { title: "Seasoned Traveler", desc: "Successfully complete 5 trips." },
                    { title: "Globetrotter", desc: "Spend over 30 days traveling." },
                    { title: "Social Butterfly", desc: "Travel with 3 or more mates." },
                    { title: "Explorer", desc: "Visit at least 3 distinct destinations." }
                  ].map(b => (
                    <div key={b.title} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-3">
                      <div className="text-xl leading-none">🏆</div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{b.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <button onClick={() => setShowInfoModal(false)} className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>);
};

export default JourneyStatistics;