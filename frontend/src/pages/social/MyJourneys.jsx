import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Plus, Sparkles, Mail, Calendar, Navigation, BookOpen, Layers, ChevronRight, ChevronDown, MapPin, XCircle } from "lucide-react";
import moment from "moment";
import axiosInstance from "../../api/axios";
import JourneyCard from "../../components/journey/JourneyCard";
import JourneyInvitationCard from "../../components/journey/JourneyInvitationCard";
import SafeCheckInModal from "../../components/journey/SafeCheckInModal";
import { useAuth } from "../../context/authContext";

import { useSidebar } from "../../components/social/sidebar/SidebarProvider";


const MyJourneys = () => {
  const { user } = useAuth();
  const myUserId = user?._id || user?.id;
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewAllCompleted, setViewAllCompleted] = useState(false);
  const [viewAllJourneys, setViewAllJourneys] = useState(false);
  const [showPastInvites, setShowPastInvites] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");


  const { openCreateJourney } = useSidebar() || {};
  const [checkInJourney, setCheckInJourney] = useState(null);

  const handleOpenCreateJourney = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (openCreateJourney) {
      openCreateJourney();
    }
  };

  useEffect(() => {
    axiosInstance.
    get("/journeys/invitations/my?status=pending").
    then((res) => {
      if (res.data?.success) setInvitations(res.data.invitations || []);
    }).
    catch(() => {});
  }, []);

  const fetchJourneys = () => {
    setLoading(true);
    const invitesPromise = axiosInstance.
    get("/journeys/invitations/my?status=pending").
    then((res) => {
      if (res.data?.success) setInvitations(res.data.invitations || []);
    }).
    catch(() => {});

    if (activeTab === "Invites") {
      invitesPromise.finally(() => setLoading(false));
      return;
    }

    axiosInstance.get(`/journeys/my`)
    .then((result) => {
      let privateJourneys = [];

      if (result.data?.success) {
        privateJourneys = result.data.journeys || [];
      }

      let combined = [...privateJourneys];

      if (activeTab === "all") {
        const now = moment();
        combined.sort((a, b) => {
          const getPriority = (j) => {
            const s = (j.status || "").toLowerCase();
            if (s === "cancelled") return 5;
            if (s === "ongoing") return 1;
            if (s === "upcoming" || s === "planning") return 2;
            if (s === "completed") return 3;
            return 4;
          };
          const pa = getPriority(a), pb = getPriority(b);
          if (pa !== pb) return pa - pb;
          if (pa === 3) return new Date(b.endDate || b.startDate) - new Date(a.endDate || a.startDate);
          return new Date(a.startDate) - new Date(b.startDate);
        });
      } else if (activeTab === "Completed") {
        combined.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      }

      setJourneys(combined);
    }).catch((err) => {
      console.error("Error loading journeys:", err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    setViewAllCompleted(false);
    setViewAllJourneys(false);
    setSourceFilter("all");
    fetchJourneys();

  }, [activeTab]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isInvitationExpired = (inv) => {
    if (inv.status === "expired") return true;
    if (!inv.journeyId?.startDate) return false;
    const diffMs = new Date(inv.journeyId.startDate) - new Date();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return daysLeft <= 0;
  };

  const activeInvitations = invitations.filter((inv) => {
    if (!inv.journeyId) return false;
    const isPending = inv.status === "pending";
    const notCompleted =
      inv.journeyId?.status !== "Completed" &&
      inv.journeyId?.status !== "Cancelled";
    const notExpired = !isInvitationExpired(inv);
    return isPending && notCompleted && notExpired;
  });

  const getJourneyStatusKey = (journey) => {
    const s = String(journey?.status || "").trim().toLowerCase();
    if (s === "cancelled" || journey?.isCancelled) return "cancelled";
    if (s === "ongoing") return "active";
    if (s === "completed") return "completed";
    return "upcoming";
  };

  // Derive ALL counts from the same journeys array used to render cards
  const upcomingCount = journeys.filter(j => getJourneyStatusKey(j) === "upcoming").length;
  const activeCount = journeys.filter(j => getJourneyStatusKey(j) === "active").length;
  const completedCount = journeys.filter(j => getJourneyStatusKey(j) === "completed").length;
  const cancelledCount = journeys.filter(j => getJourneyStatusKey(j) === "cancelled").length;

  const journeySummary = loading 
    ? "Loading your journeys..." 
    : (journeys.length > 0
      ? `${upcomingCount} Upcoming · ${activeCount} Active · ${completedCount} Completed${cancelledCount ? ` · ${cancelledCount} Cancelled` : ""}`
      : "Plan your next adventure");

  const pastInvitations = invitations.filter((inv) => {
    if (!inv.journeyId) return false;
    const isProcessed = inv.status !== "pending";
    const isCompleted =
      inv.journeyId?.status === "Completed" ||
      inv.journeyId?.status === "Cancelled";
    const isExpired = isInvitationExpired(inv);
    return isProcessed || isCompleted || isExpired;
  });

  const tabs = [
  {
    id: "all",
    label: "All Journeys",
    count: journeys.length,
    icon: <Layers className="w-3.5 h-3.5" />
  },
  {
    id: "Invites",
    label: "Invites",
    count: activeInvitations.length,
    icon: <Mail className="w-3.5 h-3.5" />,
    highlightCount: activeInvitations.length > 0
  },
  {
    id: "Upcoming",
    label: "Upcoming",
    count: upcomingCount,
    icon: <Calendar className="w-3.5 h-3.5" />
  },
  {
    id: "Ongoing",
    label: "Active",
    count: activeCount,
    icon: <Navigation className="w-3.5 h-3.5" />
  },
  {
    id: "Completed",
    label: "Completed",
    count: completedCount,
    icon: <BookOpen className="w-3.5 h-3.5" />
  },
  {
    id: "Cancelled",
    label: "Cancelled",
    count: cancelledCount,
    icon: <XCircle className="w-3.5 h-3.5" />
  }];

  return (
    <div className="min-h-screen bg-[#F7F6FB] dark:bg-slate-950 pb-24 lg:pb-8">
      {/* Mobile Header Card */}
      <div className="lg:hidden px-4 pt-3 pb-1">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#9D88F9] text-white flex items-center justify-center shadow-xs shrink-0">
                <BookOpen className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Journey Hub
                  </h1>
                  <span className="bg-purple-50 text-[#7C3AED] text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-200/60">
                    {journeys.length} {journeys.length === 1 ? "Trip" : "Trips"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {upcomingCount} Upcoming • {activeCount} Active • {completedCount} Done
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCreateJourney}
              className="inline-flex items-center gap-1 px-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-transform shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header Hero */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 pt-7">
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-200/20 via-violet-100/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#9D88F9] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(124,58,237,0.25)] shrink-0">
                <BookOpen className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                    Journey Hub
                  </h1>
                  <span className="bg-purple-50 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-200/60 font-sans shadow-xs">
                    {journeys.length} {journeys.length === 1 ? "Journey" : "Journeys"}
                  </span>
                </div>

                {/* Quick Status Stats Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-2 font-sans">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    ⏳ {upcomingCount} Upcoming
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeCount} Active
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    ✓ {completedCount} Completed
                  </span>
                  {cancelledCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                      ✕ {cancelledCount} Cancelled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 font-sans">
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> My Profile
              </Link>
              <button
                onClick={handleOpenCreateJourney}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.3)] transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Launch Journey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-6 space-y-5">

        {/* Tab Navigation Pill Bar */}
        <div className="sticky top-0 lg:top-auto z-20 pt-3 lg:pt-0 bg-[#F7F6FB]/90 lg:bg-transparent backdrop-blur-md -mx-4 sm:mx-0">
          <div className="w-full overflow-x-auto scrollbar-none pb-1">
            <div className="flex w-max min-w-full px-4 sm:px-0 sm:justify-start">
              <div className="flex flex-nowrap gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-2xl relative select-none border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap select-none shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className={isActive ? "text-white" : "text-slate-400"}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[9.5px] rounded-md font-extrabold ${
                            tab.highlightCount
                              ? "bg-rose-500 text-white animate-pulse"
                              : isActive
                              ? "bg-white/20 text-white"
                              : "bg-purple-50 text-[#7C3AED] dark:bg-purple-950/60"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {}
        {loading ?
        <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#7C3AED]">
              <Compass className="w-6 h-6 text-[#7C3AED] animate-spin" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">
              Loading journey workspaces...
            </p>
          </div> :
        activeTab === "Invites" ?
        <>
            {activeInvitations.length === 0 ?
          <div className="py-14 text-center bg-white rounded-3xl border border-[#E5E7EB]/60 p-6 max-w-sm mx-auto space-y-3 shadow-soft">
                <div className="w-12 h-12 bg-[#F3E8FF] text-[#7C3AED] rounded-xl flex items-center justify-center mx-auto text-xl">
                  📨
                </div>
                <h3 className="text-base font-semibold text-[#1E293B]">
                  No active invitations
                </h3>
                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  Active pending invitations to plan or join journeys will appear here.
                </p>
              </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeInvitations.map((inv) =>
            <JourneyInvitationCard
            key={inv._id}
            invitation={inv}
            onAction={(id, action) => {
              setInvitations((prev) =>
              prev.map((i) =>
              i._id === id ?
              { ...i, status: action === "accepted" ? "accepted" : "rejected" } :
              i
              )
              );
              if (action === "accepted") {
                fetchJourneys();
              }
            }} />

            )}
              </div>}


            {pastInvitations.length > 0 && (
              <div className="mt-6 border-t border-[#E5E7EB] pt-6">
                <button
            type="button"
            onClick={() => setShowPastInvites(!showPastInvites)}
            className="flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors">

                  <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showPastInvites ? "rotate-180" : ""}`} />

                  <span>Past Invitations ({pastInvitations.length})</span>
                </button>
                {showPastInvites && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
                    {pastInvitations.map((inv) => (
                      <JourneyInvitationCard
                        key={inv._id}
                        invitation={inv}
                        onAction={(id, action) => {
                          setInvitations((prev) =>
                            prev.map((i) =>
                              i._id === id
                                ? { ...i, status: action === "accepted" ? "accepted" : "rejected" }
                                : i
                            )
                          );
                          if (action === "accepted") {
                            fetchJourneys();
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </> :
        journeys.length === 0 ?
        <div className="py-14 text-center bg-white rounded-3xl border border-[#E5E7EB]/60 p-6 max-w-sm mx-auto space-y-3 shadow-soft">
            <div className="w-12 h-12 bg-[#F3E8FF] text-[#7C3AED] rounded-xl flex items-center justify-center mx-auto text-xl">
              🗺️
            </div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              {activeTab === "Ongoing" ?
            "No active journeys right now" :
            activeTab === "Upcoming" ?
            "No upcoming journeys" :
            activeTab === "Completed" ?
            "No completed journeys" :
            "No journeys here yet"}
            </h3>
            <p className="text-[11px] text-[#64748B] max-w-xs mx-auto leading-relaxed">
              {activeTab === "Ongoing" ?
            "You don't have any active journeys right now. Launch a new journey to get started." :
            "Create your collaborative journey workspace and invite your travel group to plan together."}
            </p>
            <button
          onClick={handleOpenCreateJourney}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs rounded-xl shadow-soft transition-all duration-200">

              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Launch Journey
            </button>
          </div> :

        activeTab === "Completed" && viewAllCompleted ?
        <div className="space-y-8 animate-fade-in bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
            onClick={() => setViewAllCompleted(false)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#7C3AED] hover:text-[#7c3aed] transition-colors">

                ← Back to overview
              </button>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Full Completed Archive
              </h2>
            </div>

            {}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  👥 Explore Trips
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Trips you joined or hosted via Explore Travel Groups
                </p>
              </div>

              {journeys.filter((j) => j.sourceType === "explore").length === 0 ?
            <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <p className="text-xs text-slate-400 font-semibold">No completed explore trips yet.</p>
                </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                  {journeys.filter((j) => j.sourceType === "explore").map((j) =>
              <JourneyCard
              key={j._id}
              journey={j}
              onCheckInClick={(item) => setCheckInJourney(item)} />

              )}
                </div>}

            </div>

            {}
            <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  🎒 Journeys with Trip Mates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Collaborative private journeys planned and shared with your trip mates
                </p>
              </div>

              {journeys.filter((j) => j.sourceType !== "explore").length === 0 ?
            <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <p className="text-xs text-slate-400 font-semibold">No completed journeys with trip mates yet.</p>
                </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                  {journeys.filter((j) => j.sourceType !== "explore").map((j) =>
              <JourneyCard
              key={j._id}
              journey={j}
              onCheckInClick={(item) => setCheckInJourney(item)} />

              )}
                </div>}

            </div>
          </div> :

        <div className="space-y-6">
            {activeTab === "Ongoing" && journeys.length > 0 &&
          <>
                {}
                <div className="bg-[#1E293B] dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800/80 mb-4 relative overflow-hidden animate-fade-in">
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
                    <Compass className="w-40 h-40 text-white animate-spin-slow" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          🟢 Journey Underway
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                        {(() => {
                          const j0 = journeys[0];
                          const durationDays = j0.durationDays || (j0.startDate && j0.endDate ? Math.max(1, Math.ceil((new Date(j0.endDate) - new Date(j0.startDate)) / (1000 * 60 * 60 * 24))) : 1);
                          const currentDay = j0.startDate ? Math.max(1, Math.ceil((Date.now() - new Date(j0.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;
                          return `${j0.title} is Underway · Day ${Math.min(currentDay, durationDays)} of ${durationDays}`;
                        })()}
                      </h2>
                      <p className="text-xs text-slate-300 font-semibold flex items-center gap-2 m-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{journeys[0].from ? `${journeys[0].from} ` : ""}{journeys[0].from && "→"} {journeys[0].destination}</span>
                        <span className="opacity-40">•</span>
                        <span className="text-slate-400">
                          {journeys[0].safetyState?.nextExpectedMilestone
                            ? `Next: ${journeys[0].safetyState.nextExpectedMilestone}`
                            : journeys[0].safetyState?.isSafetyComplete
                            ? "All milestones completed"
                            : "Safety check-in ready"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Link
                        to={`/social/journeys/${journeys[0]._id}`}
                        className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        Open Journey
                      </Link>
                      <button
                        onClick={() => setCheckInJourney(journeys[0])}
                        className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#7c3aed] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#7C3AED]/20 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Underway Safety & Progress Counters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
                      ⏰
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Next Milestone</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0 truncate max-w-[180px]">
                        {journeys[0].safetyState?.nextExpectedMilestone || (journeys[0].safetyState?.isSafetyComplete ? "Complete" : "Ready")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg shrink-0">
                      🛡️
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Safety Checkpoints</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0">
                        {journeys[0].safetyState?.completedMilestones?.length ?? 0}/5 Completed
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-lg shrink-0">
                      💬
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Journey Activity</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0">
                        {journeys[0].timeline?.length ?? 0} {journeys[0].timeline?.length === 1 ? "Update" : "Updates"}
                      </p>
                    </div>
                  </div>
                </div>
              </>}


            {}
            {(() => {
            const hasExplore = journeys.some((j) => j.sourceType === "explore");
            const hasPrivate = journeys.some((j) => j.sourceType !== "explore");
            const showFilter = hasExplore && hasPrivate;

            const filteredJourneys = journeys.filter((j) => {
              if (activeTab !== "all" && activeTab !== "Scrapbooks") {
                const statusKey = getJourneyStatusKey(j);
                const tabKey = activeTab.toLowerCase();
                if (tabKey === "ongoing" && statusKey !== "active") return false;
                if (tabKey === "upcoming" && statusKey !== "upcoming") return false;
                if (tabKey === "completed" && statusKey !== "completed") return false;
                if (tabKey === "cancelled" && statusKey !== "cancelled") return false;
              } else if (activeTab === "Scrapbooks") {
                const statusKey = getJourneyStatusKey(j);
                if (statusKey !== "completed") return false;
              }

              const isSolo = j.journeyType === "Solo Journey" || j.journeyType === "Solo" || (j.members?.length <= 1 && !j.journeyType?.toLowerCase().includes("shared"));
              if (sourceFilter === "explore") return j.sourceType === "explore";
              if (sourceFilter === "friends") return j.sourceType !== "explore" && !isSolo;
              if (sourceFilter === "solo") return j.sourceType !== "explore" && isSolo;
              return true;
            });

            const displayList = activeTab === "Completed" || !viewAllJourneys ?
            filteredJourneys.slice(0, 3) :
            filteredJourneys;

            if (filteredJourneys.length === 0) {
              return (
                <div className="py-14 text-center bg-white rounded-3xl border border-[#E5E7EB]/60 p-6 max-w-sm mx-auto space-y-3 shadow-soft">
                  <div className="w-12 h-12 bg-[#F3E8FF] text-[#7C3AED] rounded-xl flex items-center justify-center mx-auto text-xl">
                    🗺️
                  </div>
                  <h3 className="text-base font-semibold text-[#1E293B]">
                    {activeTab === "Ongoing" ? "No active journeys right now" :
                     activeTab === "Upcoming" ? "No upcoming journeys" :
                     activeTab === "Completed" ? "No completed journeys" :
                     activeTab === "Cancelled" ? "No cancelled journeys" :
                     "No journeys found"}
                  </h3>
                  <p className="text-[11px] text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    {activeTab === "Ongoing" ? "You don't have any active journeys right now." :
                     activeTab === "Completed" ? "You haven't completed any journeys yet." :
                     "Try adjusting your filters or create a new journey."}
                  </p>
                  <button
                    onClick={handleOpenCreateJourney}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs rounded-xl shadow-soft transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Launch Journey
                  </button>
                </div>
              );
            }

            return (
              <>
                  {showFilter &&
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {filteredJourneys.length} {filteredJourneys.length === 1 ? "journey" : "journeys"}
                      </p>
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {[
                          { key: "all", label: "All" },
                          { key: "friends", label: "👥 Friends" },
                          { key: "explore", label: "🌍 Explore" },
                          { key: "solo", label: "👤 Solo" },
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setSourceFilter(opt.key)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                              sourceFilter === opt.key
                                ? "bg-[#7C3AED] text-white shadow-xs"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>}


                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayList.map((j) =>
                  <JourneyCard
                  key={j._id}
                  journey={j}
                  onCheckInClick={(item) => setCheckInJourney(item)} />
                  )}
                  </div>
                </>);

          })()}
            {activeTab === "Completed" && journeys.length > 3 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setViewAllCompleted(true)}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>View All Completed Trips</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            {activeTab !== "Completed" && journeys.length > 3 && !viewAllJourneys && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setViewAllJourneys(true)}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>View More Journeys ({journeys.length - 3} more)</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

          </div>}

      </div>


      {}
      <SafeCheckInModal
        journey={checkInJourney}
        isOpen={Boolean(checkInJourney)}
        onClose={() => setCheckInJourney(null)}
        onCheckedIn={() => fetchJourneys()}
        onSuccess={() => {
          fetchJourneys();
        }}
      />


    </div>);

};

export default MyJourneys;