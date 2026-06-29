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
      label: "All Journeys",
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
      label: "Ongoing (Active)",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-fade-in bg-[#FAFAFA] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-[#6C4DF6]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-[#6C4DF6] flex items-center justify-center font-black shrink-0 border border-purple-100 dark:border-purple-800/60 shadow-xs">
            <Compass className="w-6 h-6 text-[#6C4DF6] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Collaborative Journeys
              </h1>
              <span className="bg-[#6C4DF6]/10 text-[#6C4DF6] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#6C4DF6]/20">
                {journeys.length} Headquarters
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Private collaborative travel planning, real-time safety
              checkpoints & memory scrapbooks.
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

      {/* Sleek Horizontal Filter Pills Bar */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none shrink-0 ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-[#6C4DF6] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
              }`}
            >
              <span className={isActive ? "text-[#6C4DF6]" : "text-slate-400"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 text-[10px] rounded-md font-black ${
                    tab.highlightCount
                      ? "bg-rose-500 text-white animate-pulse"
                      : isActive
                        ? "bg-purple-100 dark:bg-purple-950 text-[#6C4DF6]"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Journeys Grid Display */}
      {loading ? (
        <div className="py-16 text-center">
          <Compass className="w-8 h-8 mx-auto mb-2 text-[#6C4DF6] animate-spin" />
          <p className="text-xs font-bold text-slate-500">
            Loading squad workspaces...
          </p>
        </div>
      ) : activeTab === "Invites" ? (
        invitations.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-6 max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto text-xl border border-amber-500/20">
              📬
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No pending squad invitations
            </h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              When fellow travelers or trip organizers invite you to join their
              travel roster, they will appear right here.
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
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-6 max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-[#6C4DF6]/10 text-[#6C4DF6] rounded-xl flex items-center justify-center mx-auto text-xl border border-[#6C4DF6]/20">
            🧭
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            No journeys in this category
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create your collaborative journey workspace to invite your squad and
            organize travel checklists together.
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
