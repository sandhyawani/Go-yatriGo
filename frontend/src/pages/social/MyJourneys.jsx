import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import axiosInstance from "../../api/axios";
import JourneyCard from "../../components/journey/JourneyCard";
import JourneyInvitationCard from "../../components/journey/JourneyInvitationCard";
import CreateJourneyModal from "../../components/journey/CreateJourneyModal";
import SafeCheckInModal from "../../components/journey/SafeCheckInModal";

const MyJourneys = () => {
  const [journeys, setJourneys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [checkInJourney, setCheckInJourney] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/journeys/invitations/my?status=pending")
      .then((res) => {
        if (res.data?.success) setInvitations(res.data.invitations || []);
      })
      .catch(() => {});
  }, []);

  const fetchJourneys = () => {
    setLoading(true);
    const invitesPromise = axiosInstance
      .get("/journeys/invitations/my?status=pending")
      .then((res) => {
        if (res.data?.success) setInvitations(res.data.invitations || []);
      })
      .catch(() => {});

    if (activeTab === "Invites") {
      invitesPromise.finally(() => setLoading(false));
      return;
    }
    const query = activeTab === "all" ? "" : `?status=${activeTab}`;
    axiosInstance
      .get(`/journeys/my${query}`)
      .then((res) => {
        if (res.data?.success) {
          setJourneys(res.data.journeys || []);
        }
      })
      .catch((err) => console.error("Error loading journeys:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJourneys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tabs = [
    {
      id: "all",
      label: "All",
      count: journeys.length,
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: "Invites",
      label: "Invites",
      count: invitations.length,
      icon: <Mail className="w-3.5 h-3.5" />,
      highlightCount: invitations.length > 0,
    },
    {
      id: "Upcoming",
      label: "Upcoming",
      icon: <Calendar className="w-3.5 h-3.5" />,
    },
    {
      id: "Ongoing",
      label: "Active",
      icon: <Navigation className="w-3.5 h-3.5" />,
    },
    {
      id: "Completed",
      label: "Scrapbook",
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
  ];

  const handleCreated = (newJ) => {
    setJourneys((prev) => [newJ, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F7F6FB] dark:bg-slate-950 pb-24 lg:pb-8">

      {/* ── Mobile Hero Header ── */}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-[#6C4DF6] via-[#7c5df8] to-[#9D88F9] px-5 pt-5 pb-8">
        {/* decorative blobs */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">
                My Journeys
              </h1>
              <p className="text-[10px] text-white/70 font-semibold mt-0.5">
                {journeys.length > 0 ? `${journeys.length} active squad${journeys.length !== 1 ? "s" : ""}` : "Plan your next adventure"}
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold border border-white/25 active:scale-95 transition-transform"
          >
            <Sparkles className="w-3 h-3" />
            Profile
          </Link>
        </div>

        {/* Big launch button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white text-[#6C4DF6] font-extrabold text-sm shadow-lg shadow-[#6C4DF6]/20 active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#6C4DF6]/10 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            Launch New Journey
          </span>
          <ChevronRight className="w-4 h-4 text-[#6C4DF6]/60" />
        </button>
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden lg:flex max-w-7xl mx-auto px-6 pt-6 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#6C4DF6] flex items-center justify-center border border-purple-100 dark:border-purple-800/60 shadow-xs">
            <Map className="w-6 h-6 text-[#6C4DF6] stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Collaborative Journeys
              </h1>
              <span className="bg-[#6C4DF6]/10 text-[#6C4DF6] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#6C4DF6]/20">
                {journeys.length} Headquarters
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Private collaborative travel planning, real-time safety checkpoints &amp; memory scrapbooks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6C4DF6]" /> My Profile
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#6C4DF6] hover:bg-[#5838e8] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#6C4DF6]/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Launch Journey
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-5 space-y-4">

        {/* ── Tab Pills ── */}
        <div className="sticky top-0 lg:top-auto z-20 pt-3 lg:pt-0 bg-[#F7F6FB] dark:bg-slate-950 lg:bg-transparent">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none shrink-0 ${
                    isActive
                      ? "bg-[#6C4DF6] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className={isActive ? "text-white/80" : "text-slate-400"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[9px] rounded-md font-black ${
                        tab.highlightCount
                          ? "bg-rose-500 text-white animate-pulse"
                          : isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
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

        {/* ── Content ── */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#6C4DF6]/10 flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#6C4DF6] animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-500">
              Loading squad workspaces...
            </p>
          </div>
        ) : activeTab === "Invites" ? (
          invitations.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-6 max-w-sm mx-auto space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-500/20">
                📬
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No pending invitations
              </h3>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                When fellow travelers invite you to join their journey, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitations.map((inv) => (
                <JourneyInvitationCard
                  key={inv._id}
                  invitation={inv}
                  onAction={(id) =>
                    setInvitations((prev) => prev.filter((i) => i._id !== id))
                  }
                />
              ))}
            </div>
          )
        ) : journeys.length === 0 ? (
          <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-6 max-w-sm mx-auto space-y-3 shadow-xs">
            <div className="w-14 h-14 bg-[#6C4DF6]/10 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-[#6C4DF6]/20">
              🧭
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No journeys here yet
            </h3>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
              Create your collaborative journey workspace and invite your squad to plan together.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#6C4DF6] text-white font-extrabold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Launch Journey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {journeys.map((j) => (
              <JourneyCard
                key={j._id}
                journey={j}
                onCheckInClick={(item) => setCheckInJourney(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile floating create button — shown only when there are journeys */}
      {!loading && journeys.length > 0 && activeTab !== "Invites" && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-3 bg-[#6C4DF6] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#6C4DF6]/30 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Journey</span>
        </button>
      )}

      {/* Create Journey Modal */}
      <CreateJourneyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* Quick Safe Check-In Modal */}
      <SafeCheckInModal
        journey={checkInJourney}
        isOpen={Boolean(checkInJourney)}
        onClose={() => setCheckInJourney(null)}
        onSuccess={() => {
          alert("Safe check-in broadcasted to squad!");
          fetchJourneys();
        }}
      />
    </div>
  );
};

export default MyJourneys;
