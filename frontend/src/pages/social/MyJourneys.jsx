import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
Compass,
Plus,
Sparkles,
Mail,
Calendar,
Navigation,
BookOpen,
Layers,
Map,
ChevronRight,
ChevronDown,
MapPin } from
"lucide-react";
import axiosInstance from "../../api/axios";
import JourneyCard from "../../components/journey/JourneyCard";
import JourneyInvitationCard from "../../components/journey/JourneyInvitationCard";
import CreateJourneyModal from "../../components/journey/CreateJourneyModal";
import SafeCheckInModal from "../../components/journey/SafeCheckInModal";
import { useAuth } from "../../context/authContext";

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


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [checkInJourney, setCheckInJourney] = useState(null);

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


    const normaliseBuddyTrip = (trip, status) => {
      const diffDays = Math.round(
      Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
      );
      const durationDays = Math.max(1, diffDays + 1);
      return {
        _id: trip._id,
        title: trip.title,
        destination: trip.destination,
        from: trip.from || "",
        coverImage: trip.coverImage,
        startDate: trip.startDate,
        endDate: trip.endDate,
        durationDays: durationDays,
        status,
        isBuddyTrip: true,
        sourceType: "explore",
        journeyType: "Explore Group",
        members: [
        { user: trip.host, role: "Host" },
        ...(trip.members || []).map((m) => ({ user: m.user, role: m.role || "Member" }))]

      };
    };


    const buddyLifecycle =
    activeTab === "Completed" || activeTab === "Scrapbooks" ? "completed" :
    activeTab === "Ongoing" ? "active" :
    activeTab === "Upcoming" ? "upcoming" :
    null;

    const buddyUrl = myUserId ?
    `/social/buddy?userId=${myUserId}${buddyLifecycle ? `&lifecycleStatus=${buddyLifecycle}` : ""}` :
    null;

    const journeyQuery =
    activeTab === "all" ? "" :
    activeTab === "Completed" || activeTab === "Scrapbooks" ? "?status=Completed" :
    `?status=${activeTab}`;

    Promise.allSettled([
    axiosInstance.get(`/journeys/my${journeyQuery}`),
    buddyUrl ? axiosInstance.get(buddyUrl) : Promise.resolve({ data: { success: false } })]
    ).then((results) => {
      let privateJourneys = [];
      let exploreTrips = [];

      if (results[0].status === "fulfilled" && results[0].value.data?.success) {
        privateJourneys = results[0].value.data.journeys || [];
      }
      if (results[1].status === "fulfilled" && results[1].value.data?.success) {
        const raw = results[1].value.data.trips || [];
        const statusLabel =
        activeTab === "Completed" || activeTab === "Scrapbooks" ? "Completed" :
        activeTab === "Ongoing" ? "Ongoing" :
        activeTab === "Upcoming" ? "Upcoming" :
        null;
        exploreTrips = raw.map((t) => normaliseBuddyTrip(t, statusLabel || t.lifecycleStatus || "Upcoming"));
      }

      const activeSourceIds = new Set(
        privateJourneys
          .filter((j) => (j.sourceType === "explore" || j.sourceType === "travel_group") && j.sourceId)
          .map((j) => j.sourceId.toString())
      );
      const filteredExploreTrips = exploreTrips.filter(
        (trip) => !activeSourceIds.has((trip._id || trip.id)?.toString())
      );

      let combined = [...privateJourneys, ...filteredExploreTrips];


      if (activeTab === "all") {
        combined.sort((a, b) => {
          const getPriority = (j) => {
            const s = (j.status || "").toLowerCase();
            if (s === "ongoing" || s === "active") return 1;
            if (s === "upcoming" || s === "planning") return 2;
            if (s === "completed") return 3;
            return 4;
          };
          const pa = getPriority(a),pb = getPriority(b);
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

  const activeInvitations = invitations.filter((inv) => {
    if (!inv.journeyId) return false;
    const isPending = inv.status === "pending";
    const notStarted = !inv.journeyId?.startDate || new Date(inv.journeyId.startDate) > new Date();
    const notCompleted =
    inv.journeyId?.status !== "Completed" &&
    inv.journeyId?.status !== "Cancelled";
    return isPending && notStarted && notCompleted;
  });

  const [journeyStats, setJourneyStats] = useState(null);

  useEffect(() => {
    if (!myUserId) return;
    axiosInstance.get(`/journeys/stats/me`, { withCredentials: true })
      .then(res => {
        if (res.data?.success && res.data.stats) {
          setJourneyStats(res.data.stats);
        }
      })
      .catch(err => console.error("Failed to fetch journey stats", err));
  }, [myUserId]);

  const upcomingCount = journeyStats?.upcoming ?? journeys.filter(j => j.status === "Upcoming" || j.lifecycleStatus === "upcoming").length;
  const activeCount = journeyStats?.ongoing ?? journeys.filter(j => j.status === "Ongoing" || j.status === "Active" || j.lifecycleStatus === "active").length;
  const completedCount = journeyStats?.completed ?? journeys.filter(j => j.status === "Completed" || j.lifecycleStatus === "completed").length;

  const journeySummary = (journeyStats?.totalJourneys || journeys.length) > 0 
    ? `${upcomingCount} Upcoming · ${activeCount} Active · ${completedCount} Completed`
    : "Plan your next adventure";

  const pastInvitations = invitations.filter((inv) => {
    if (!inv.journeyId) return false;
    const isPending = inv.status === "pending";
    const isExpired =
    inv.status === "expired" ||
    inv.journeyId?.startDate && new Date(inv.journeyId.startDate) <= new Date();
    const isCompleted =
    inv.journeyId?.status === "Completed" ||
    inv.journeyId?.status !== undefined && inv.journeyId?.status === "Cancelled";
    return !isPending || isExpired || isCompleted;
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
    icon: <Calendar className="w-3.5 h-3.5" />
  },
  {
    id: "Ongoing",
    label: "Active",
    icon: <Navigation className="w-3.5 h-3.5" />
  },
  {
    id: "Completed",
    label: "Completed",
    icon: <BookOpen className="w-3.5 h-3.5" />
  }];


  const handleCreated = (newJ) => {
    setJourneys((prev) => [newJ, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F7F6FB] dark:bg-slate-950 pb-24 lg:pb-8">

      {}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#7c5df8] to-[#9D88F9] px-5 pt-5 pb-8">
        {}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">
                Journey Hub
              </h1>
              <p className="text-[10px] text-white/80 font-semibold mt-1">
                {journeySummary}
              </p>
            </div>
          </div>
          <Link
          to="/profile"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold border border-white/25 active:scale-95 transition-transform">

            <Sparkles className="w-3 h-3" />
            Profile
          </Link>
        </div>

        {}
        <button
        onClick={() => setIsCreateModalOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white text-[#7C3AED] font-extrabold text-sm shadow-lg shadow-[#7C3AED]/20 active:scale-[0.98] transition-transform">

          <span className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            Launch New Journey
          </span>
          <ChevronRight className="w-4 h-4 text-[#7C3AED]/60" />
        </button>
      </div>

      {}
      <div className="hidden lg:flex max-w-7xl mx-auto px-6 pt-6 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/60 text-[#7C3AED] flex items-center justify-center border border-brand-100 dark:border-brand-800/60 shadow-xs">
            <Map className="w-6 h-6 text-[#7C3AED] stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Journey Hub
              </h1>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {journeys.length} {journeys.length === 1 ? "Journey" : "Journeys"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {journeySummary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all">

            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> My Profile
          </Link>
          <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#7c3aed] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#7C3AED]/20 transition-all active:scale-95 shrink-0">

            <Plus className="w-4 h-4 stroke-[3]" /> Launch Journey
          </button>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-5 space-y-4">

        {}
        <div className="sticky top-0 lg:top-auto z-20 pt-3 lg:pt-0 bg-[#F8FAFC] lg:bg-transparent -mx-4 sm:mx-0">
          <div className="w-full overflow-x-auto scrollbar-none pb-1">
            <div className="flex w-max min-w-full px-4 sm:px-0 sm:justify-center">
              <div className="flex flex-nowrap gap-2 p-1.5 bg-slate-50/80 rounded-xl relative select-none border border-[#E5E7EB] shadow-soft shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none shrink-0 ${
                isActive ?
                "bg-[#7C3AED] text-white shadow-sm" :
                "bg-white text-[#64748B] hover:text-[#1E293B] border border-[#E5E7EB] hover:bg-slate-50"
                }`}>

                  <span className={isActive ? "text-white" : "text-[#64748B]"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined &&
                  <span
                  className={`px-1.5 py-0.5 text-[9px] rounded-md font-semibold ${
                  tab.highlightCount ?
                  "bg-[#EF4444] text-white animate-pulse" :
                  isActive ?
                  "bg-white/25 text-white" :
                  "bg-[#F3E8FF] text-[#7C3AED]"
                  }`}>

                      {tab.count}
                    </span>}

                </button>);

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
              Loading squad workspaces...
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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


            {pastInvitations.length > 0 &&
          <div className="mt-6 border-t border-[#E5E7EB] pt-6">
                <button
            type="button"
            onClick={() => setShowPastInvites(!showPastInvites)}
            className="flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors">

                  <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showPastInvites ? "rotate-180" : ""}`} />

                  <span>Past Invitations ({pastInvitations.length})</span>
                </button>
                {showPastInvites &&
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                    {pastInvitations.map((inv) =>
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

              </div>}

          </> :
        journeys.length === 0 ?
        <div className="py-14 text-center bg-white rounded-3xl border border-[#E5E7EB]/60 p-6 max-w-sm mx-auto space-y-3 shadow-soft">
            <div className="w-12 h-12 bg-[#F3E8FF] text-[#7C3AED] rounded-xl flex items-center justify-center mx-auto text-xl">
              🧭
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
            "Create your collaborative journey workspace and invite your squad to plan together."}
            </p>
            <button
          onClick={() => setIsCreateModalOpen(true)}
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
                  👥 Trips with Strangers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Trips you joined or hosted via public Travel travel groups
                </p>
              </div>

              {journeys.filter((j) => j.isBuddyTrip).length === 0 ?
            <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <p className="text-xs text-slate-400 font-semibold">No completed trips with strangers yet.</p>
                </div> :

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-sans">
                  {journeys.filter((j) => j.isBuddyTrip).map((j) =>
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

              {journeys.filter((j) => !j.isBuddyTrip).length === 0 ?
            <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <p className="text-xs text-slate-400 font-semibold">No completed journeys with trip mates yet.</p>
                </div> :

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-sans">
                  {journeys.filter((j) => !j.isBuddyTrip).map((j) =>
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
                        {journeys[0].title} is Underway · Day {Math.min(Math.ceil((Date.now() - new Date(journeys[0].startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1, journeys[0].durationDays || 1)} of {journeys[0].durationDays || 1}
                      </h2>
                      <p className="text-xs text-slate-300 font-semibold flex items-center gap-2 m-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{journeys[0].from ? `${journeys[0].from} ` : ""}{journeys[0].from && "→"} {journeys[0].destination}</span>
                        <span className="opacity-40">•</span>
                        <span className="text-slate-400">Next check-in: 7:00 PM</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Link
                  to={`/social/journeys/${journeys[0]._id}`}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5">

                        Open Journey
                      </Link>
                      <button
                  onClick={() => setCheckInJourney(journeys[0])}
                  className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#7c3aed] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#7C3AED]/20 transition-all active:scale-95 flex items-center gap-1.5">

                        Check In
                      </button>
                    </div>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
                      ⏰
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Next Check-In</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0">7:00 PM Today</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg shrink-0">
                      🛡️
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Safety Checkpoints</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0">2/4 Completed</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-lg shrink-0">
                      💬
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Squad Activity</span>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 m-0">3 New Updates</p>
                    </div>
                  </div>
                </div>
              </>}

            {}
            {(() => {
            const hasExplore = journeys.some((j) => j.isBuddyTrip || j.sourceType === "explore");
            const hasPrivate = journeys.some((j) => !j.isBuddyTrip && j.sourceType !== "explore");
            const showFilter = hasExplore && hasPrivate;

            const filteredJourneys = journeys.filter((j) => {
              if (sourceFilter === "explore") return j.isBuddyTrip || j.sourceType === "explore";
              if (sourceFilter === "friends") return !j.isBuddyTrip && j.sourceType !== "explore" && (j.members?.length > 1 || j.journeyType?.toLowerCase().includes("shared"));
              if (sourceFilter === "solo") return !j.isBuddyTrip && j.sourceType !== "explore" && (j.journeyType?.toLowerCase().includes("solo") || j.members?.length <= 1 && !j.journeyType?.toLowerCase().includes("shared"));
              return true;
            });

            const displayList = activeTab === "Completed" || !viewAllJourneys ?
            filteredJourneys.slice(0, 4) :
            filteredJourneys;

            return (
              <>
                  {showFilter &&
                <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {filteredJourneys.length} {filteredJourneys.length === 1 ? "journey" : "journeys"}
                      </p>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-1 py-1 shadow-xs">
                        {[
                          { key: "all", label: "All" },
                          { key: "friends", label: "👥 Friends Journey" },
                          { key: "explore", label: "🌍 Explore Groups" },
                          { key: "solo", label: "👤 Solo Expedition" },
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setSourceFilter(opt.key)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                              sourceFilter === opt.key
                                ? "bg-[#F3E8FF] text-[#7C3AED] shadow-sm border border-[#E9D5FF]"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>}


                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayList.map((j) =>
                  <JourneyCard
                  key={j._id}
                  journey={j}
                  onCheckInClick={(item) => setCheckInJourney(item)} />

                  )}
                  </div>
                </>);

          })()}
            {activeTab === "Completed" && journeys.length > 4 &&
          <div className="flex justify-center pt-2">
                <button
            onClick={() => setViewAllCompleted(true)}
            className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2">

                  <span>View All Completed Trips</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>}

            {activeTab !== "Completed" && journeys.length > 4 && !viewAllJourneys &&
          <div className="flex justify-center pt-2">
                <button
            onClick={() => setViewAllJourneys(true)}
            className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-2">

                  <span>View More Journeys</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>}

          </div>}

      </div>

      {}
      {!loading && journeys.length > 0 && activeTab !== "Invites" &&
      <button
      onClick={() => setIsCreateModalOpen(true)}
      className="lg:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-3 bg-[#7C3AED] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#7C3AED]/30 active:scale-95 transition-transform">

          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Journey</span>
        </button>}


      {}
      <CreateJourneyModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onCreated={handleCreated} />


      {}
      <SafeCheckInModal
      journey={checkInJourney}
      isOpen={Boolean(checkInJourney)}
      onClose={() => setCheckInJourney(null)}
      onSuccess={() => {
        alert("Safe check-in broadcasted to squad!");
        fetchJourneys();
      }} />

    </div>);

};

export default MyJourneys;