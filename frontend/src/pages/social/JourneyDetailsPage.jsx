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
  ChevronLeft,
  ChevronRight,
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
  const [activeTab, setActiveTab] = useState("overview");
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center">
          <Compass className="w-7 h-7 text-[#8B5CF6] animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-500">
          Entering Journey Hub...
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
    { id: "overview", label: "Overview", shortLabel: "Info", icon: Compass },
    { id: "workspace", label: "Workspace", shortLabel: "Plans", icon: Layout },
    { id: "timeline", label: "Timeline", shortLabel: "Safety", icon: ShieldCheck },
    {
      id: "members",
      label: `Squad (${journey.members?.length || 1})`,
      shortLabel: "Squad",
      icon: Users,
    },
    { id: "gallery", label: "Gallery", shortLabel: "Gallery", icon: Image },
    { id: "memories", label: "Scrapbook", shortLabel: "Book", icon: BookOpen },
  ];

  const defaultBanner =
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80";

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F7F6FB] dark:bg-slate-950 pb-32 lg:pb-10">

      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-12 flex items-center justify-between px-4">
        <Link
          to="/social/journeys"
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4 text-[#8B5CF6]" />
          Journeys
        </Link>
        <div className="flex items-center gap-2">
          {journey.chatRoomId && (
            <Link
              to={`/social/chat/${journey.chatRoomId}`}
              className="p-2 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
          )}
          {isOrganizer && journey.status !== "Cancelled" && (
            <>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="p-2 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelJourney}
                className="p-2 rounded-xl bg-rose-50 text-rose-500"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Desktop Top Nav ── */}
      <div className="hidden lg:flex max-w-6xl mx-auto px-4 sm:px-6 pt-5 items-center justify-between">
        <Link
          to="/social/journeys"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Journeys
        </Link>

        {journey.chatRoomId && (
          <Link
            to={`/social/chat/${journey.chatRoomId}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-md shadow-[#8B5CF6]/25 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" /> Open Squad Chat
          </Link>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-6 space-y-4 mt-3 lg:mt-5">

        {/* Welcome Banner */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-slate-900 via-brand-900/90 to-slate-900 text-white p-4 rounded-2xl border border-brand-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-brand-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">
                  Your Journey HQ is Ready!
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Explore tabs or start pinning notes!
                </p>
              </div>
            </div>
            <button
              onClick={() => setSearchParams({})}
              className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 border border-brand-400/30 relative z-10 w-full sm:w-auto"
            >
              Let's Collaborate!
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-slate-950 group">
          <div className="h-44 sm:h-64 lg:h-72 w-full relative">
            <img
              src={journey.coverImage || defaultBanner}
              alt={journey.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 dark:opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Desktop top badges + actions */}
            <div className="hidden lg:flex absolute top-4 left-4 right-4 items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <JourneyStatusBadge status={journey.status} size="md" />
                <span className="px-3 py-1 rounded-xl bg-white/15 dark:bg-black/40 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-300" />{" "}
                  {getJourneyBadge(journey)}
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/15 dark:bg-black/40 backdrop-blur-md text-brand-200 text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5 capitalize">
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
            <div className="absolute bottom-3 left-4 right-4 space-y-1">
              <div className="flex items-center gap-1.5 text-brand-300 text-[10px] font-extrabold tracking-wider uppercase">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{journey.destination} • {journey.journeyType}</span>
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight line-clamp-2">
                {journey.title}
              </h1>
              {/* Mobile badges inline */}
              <div className="flex items-center gap-1.5 lg:hidden flex-wrap mt-1">
                <JourneyStatusBadge status={journey.status} size="sm" />
                <span className="px-2 py-0.5 rounded-lg bg-white/15 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                  {getJourneyBadge(journey)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop Tabs (horizontal scrollable bar) ── */}
        <div className="hidden lg:flex bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs items-center gap-1.5 overflow-x-auto flex-nowrap whitespace-nowrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-[#8B5CF6] shadow-xs font-extrabold ring-1 ring-slate-200/80 dark:ring-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 ${isActive ? "text-[#8B5CF6]" : "text-slate-400"}`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Organizer Live Feed (overview only) */}
        {activeTab === "overview" && isOrganizer && (
          <div className="bg-gradient-to-r from-brand-900/10 via-slate-900/40 to-brand-900/10 dark:from-brand-900/30 dark:to-slate-900 p-4 rounded-2xl border border-brand-500/20 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#8B5CF6]/15 rounded-xl flex items-center justify-center text-[#8B5CF6] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  Organizer Live Feed
                  <span className="text-[9px] bg-brand-50 dark:bg-brand-900 text-[#8B5CF6] border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-md font-black">
                    LIVE
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time squad recruitment & invitation analytics
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Pending", value: journey.pendingInvitationCount || 0, color: "text-amber-500" },
                { label: "Accepted", value: journey.acceptedInvitationCount || 0, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Squad", value: journey.members?.length || journey.memberCount || 1, color: "text-[#8B5CF6]" },
                {
                  label: "Conv.",
                  value: (journey.acceptedInvitationCount || 0) + (journey.pendingInvitationCount || 0) > 0
                    ? `${(((journey.acceptedInvitationCount || 0) / ((journey.acceptedInvitationCount || 0) + (journey.pendingInvitationCount || 0))) * 100).toFixed(0)}%`
                    : "100%",
                  color: "text-slate-800 dark:text-slate-200"
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/80 dark:bg-slate-900/80 px-2 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block leading-none mb-1">{stat.label}</span>
                  <span className={`text-sm font-black block ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Body Content */}
        <div className="lg:mt-0">
          {activeTab === "overview" && <JourneyDetails journey={journey} />}
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
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around overflow-x-auto scrollbar-none px-1 h-14">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 px-1 rounded-xl transition-all shrink-0 ${
                  isActive ? "text-[#8B5CF6]" : "text-slate-400"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-bold leading-none">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

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

