import React, { useState, useEffect, useContext } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Compass,
  MapPin,
  Users,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  UserPlus,
  ArrowLeft,
  XCircle,
  Layout,
  Image,
  BookOpen,
  User,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import { AuthContext } from "../../context/authContext";

// Journey Subcomponents
import JourneyStatusBadge from "../../components/journey/JourneyStatusBadge";
import JourneyDetails from "../../components/journey/JourneyDetails";
import JourneyMembers from "../../components/journey/JourneyMembers";
import JourneyTimelineView from "../../components/journey/JourneyTimelineView";
import JourneyWorkspaceView from "../../components/journey/JourneyWorkspaceView";
import JourneyGalleryView from "../../components/journey/JourneyGalleryView";
import JourneyMemoryCard from "../../components/journey/JourneyMemoryCard";
import InviteBuddyModal from "../../components/journey/InviteBuddyModal";
import SafeCheckInModal from "../../components/journey/SafeCheckInModal";

const JourneyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "true";
  const { user } = useContext(AuthContext) || {};
  const currentUserId = user?._id || user?.id;

  const [journey, setJourney] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, workspace, timeline, members, gallery, memories
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const getJourneyBadge = (j) => {
    if (j?.journeyType === "Solo Journey" || j?.journeyType === "Solo")
      return "Solo Expedition";
    return "Shared Journey";
  };

  const fetchJourney = () => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/journeys/${id}`)
      .then((res) => {
        if (res.data?.success) setJourney(res.data.journey);
      })
      .catch((err) => {
        console.error("Error loading journey details:", err);
        alert("Journey not found or access denied");
        navigate("/social/journeys");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  if (loading) {
    return (
      <div className="py-32 text-center animate-pulse">
        <Compass className="w-12 h-12 mx-auto mb-3 text-[#6C4DF6] animate-spin" />
        <p className="text-sm font-bold text-slate-500">
          Entering Journey Squad Hub...
        </p>
      </div>
    );
  }

  if (!journey) return null;

  const isOrganizer = journey.members?.some(
    (m) =>
      (m.user?._id || m.user).toString() === currentUserId?.toString() &&
      (m.role === "Organizer" || m.role === "Co-Organizer"),
  );

  const handleCancelJourney = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this journey? All members will be notified.",
      )
    )
      return;
    try {
      const res = await axiosInstance.post(`/journeys/${id}/cancel`);
      if (res.data?.success) fetchJourney();
    } catch (err) {
      alert("Failed to cancel journey");
    }
  };

  const handleRemoveMember = async (targetId) => {
    try {
      await axiosInstance.delete(`/journeys/${id}/members/${targetId}`);
      fetchJourney();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Compass },
    { id: "workspace", label: "Workspace", icon: Layout },
    { id: "timeline", label: "Timeline & Safety", icon: ShieldCheck },
    {
      id: "members",
      label: `Squad (${journey.members?.length || 1})`,
      icon: Users,
    },
    { id: "gallery", label: "Gallery", icon: Image },
    { id: "memories", label: "Scrapbook", icon: BookOpen },
  ];

  const defaultBanner =
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5 animate-fade-in pb-20">
      {/* Top Nav Back & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/social/journeys"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Journeys
        </Link>

        {journey.chatRoomId && (
          <Link
            to={`/social/chat/${journey.chatRoomId}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-bold shadow-md shadow-[#6C4DF6]/25 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" /> Open Squad Chat
          </Link>
        )}
      </div>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/90 to-slate-900 text-white p-4 rounded-2xl border border-purple-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#6C4DF6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-[#6C4DF6]/20 border border-[#6C4DF6]/40 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">
                Your Journey Headquarters is Ready!
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Welcome to your collaborative hub. Explore tabs or start pinning
                notes!
              </p>
            </div>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 border border-purple-400/30 relative z-10"
          >
            Let's Collaborate!
          </button>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-slate-950 group">
        <div className="h-64 sm:h-72 w-full relative">
          <img
            src={journey.coverImage || defaultBanner}
            alt={journey.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 dark:opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Status & Actions */}
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <JourneyStatusBadge status={journey.status} size="md" />
              <span className="px-3 py-1 rounded-xl bg-white/15 dark:bg-black/40 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-300" />{" "}
                {getJourneyBadge(journey)}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/15 dark:bg-black/40 backdrop-blur-md text-purple-200 text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5 capitalize">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />{" "}
                {journey.sourceType || "Manual Plan"}
              </span>
            </div>

            {isOrganizer && journey.status !== "Cancelled" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/25 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite Buddies
                </button>
                <button
                  onClick={handleCancelJourney}
                  className="p-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 transition-all shadow-md backdrop-blur-md"
                  title="Cancel Journey"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title & Specs Overlay */}
          <div className="absolute bottom-5 left-5 right-5 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-extrabold tracking-wider uppercase">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />{" "}
              {journey.destination} • {journey.journeyType} Trip
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {journey.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-nowrap whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-[#6C4DF6] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
              }`}
            >
              <tab.icon
                className={`w-3.5 h-3.5 ${isActive ? "text-[#6C4DF6]" : "text-slate-400"}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body Content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Compact Organizer Live Feed Ribbon */}
            {isOrganizer && (
              <div className="bg-gradient-to-r from-purple-900/10 via-slate-900/40 to-purple-900/10 dark:from-purple-950/30 dark:to-slate-900 p-4 rounded-2xl border border-purple-500/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#6C4DF6]/15 rounded-xl flex items-center justify-center text-[#6C4DF6] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Organizer Live Feed
                      </h3>
                      <span className="text-[9px] bg-purple-50 dark:bg-purple-950 text-[#6C4DF6] border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md font-black">
                        LIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Real-time squad recruitment & invitation analytics
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center min-w-[80px]">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                      Pending
                    </span>
                    <span className="text-sm font-black text-amber-500 block">
                      {journey.pendingInvitationCount || 0}
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center min-w-[80px]">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                      Accepted
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                      {journey.acceptedInvitationCount || 0}
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center min-w-[80px]">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                      Squad
                    </span>
                    <span className="text-sm font-black text-[#6C4DF6] block">
                      {journey.members?.length || journey.memberCount || 1}
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center min-w-[80px]">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                      Conversion
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 block">
                      {(journey.acceptedInvitationCount || 0) +
                        (journey.pendingInvitationCount || 0) >
                      0
                        ? `${(((journey.acceptedInvitationCount || 0) / ((journey.acceptedInvitationCount || 0) + (journey.pendingInvitationCount || 0))) * 100).toFixed(0)}%`
                        : "100%"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <JourneyDetails journey={journey} />
          </div>
        )}
        {activeTab === "workspace" && (
          <JourneyWorkspaceView journeyId={journey._id} />
        )}
        {activeTab === "timeline" && (
          <JourneyTimelineView
            timeline={journey.timeline || []}
            journeyStatus={journey.status}
            onTriggerCheckIn={() => setIsCheckInOpen(true)}
          />
        )}
        {activeTab === "members" && (
          <JourneyMembers
            journey={journey}
            currentUserId={currentUserId}
            onInviteClick={() => setIsInviteOpen(true)}
            onRemoveMember={handleRemoveMember}
          />
        )}
        {activeTab === "gallery" && (
          <JourneyGalleryView journeyId={journey._id} />
        )}
        {activeTab === "memories" && (
          <JourneyMemoryCard
            journey={journey}
            memory={journey.memory}
            currentUserId={currentUserId}
            onUpdated={fetchJourney}
          />
        )}
      </div>

      {/* Invite Modal */}
      <InviteBuddyModal
        journey={journey}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvited={fetchJourney}
      />

      {/* Check-In Modal */}
      <SafeCheckInModal
        journey={journey}
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={fetchJourney}
      />
    </div>
  );
};

export default JourneyDetailsPage;
