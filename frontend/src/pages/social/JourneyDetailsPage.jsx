import React, { useState, useEffect, useContext } from "react";
import {
useParams,
Link,
useNavigate,
useSearchParams } from
"react-router-dom";
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
ChevronLeft } from
"lucide-react";
import axiosInstance from "../../api/axios";
import { AuthContext } from "../../context/authContext";


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


  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const getJourneyBadge = (j) => {
    if (j?.journeyType === "Solo Journey" || j?.journeyType === "Solo")
    return "Solo Expedition";
    return "Shared Squad";
  };

  const fetchJourney = (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    axiosInstance.
    get(`/journeys/${id}`).
    then((res) => {
      if (res.data?.success) setJourney(res.data.journey);
    }).
    catch((err) => {
      console.error("Error loading journey details:", err);
      if (!silent) {
        alert("Journey not found or access denied");
        navigate("/social/journeys");
      }
    }).
    finally(() => {
      if (!silent) setLoading(false);
    });
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center">
          <Compass className="w-7 h-7 text-[#7C3AED] animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-500">
          Entering Journey Hub...
        </p>
      </div>);

  }

  if (!journey) return null;

  const isOrganizer = journey.members?.some(
  (m) =>
  (m.user?._id || m.user).toString() === currentUserId?.toString() && (
  m.role === "Organizer" || m.role === "Co-Organizer")
  );

  const handleCancelJourney = async () => {
    if (
    !window.confirm(
    "Are you sure you want to cancel this journey? All members will be notified."
    ))

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
    shortLabel: "Travel Group",
    icon: Users
  },
  { id: "gallery", label: "Gallery", shortLabel: "Gallery", icon: Image },
  { id: "memories", label: "Scrapbook", shortLabel: "Book", icon: BookOpen }];


  const defaultBanner =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F6FB] dark:bg-slate-950 pb-28 lg:pb-10">
      <div className="flex-1 min-h-[calc(100vh-14rem)] flex flex-col">

        {}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-12 flex items-center justify-between px-4">
          <Link
          to="/social/journeys"
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold text-sm">

            <ChevronLeft className="w-4 h-4 text-[#7C3AED]" />
            Journey Hub
          </Link>
          <div className="flex items-center gap-2">
            {journey.chatRoomId &&
            <button
            onClick={() => navigate(`/social/chat/${journey.chatRoomId}`)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            title="Open Squad Chat">

                <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
              </button>}

            {isOrganizer && journey.status !== "Cancelled" &&
            <>
                <button
              onClick={() => setIsInviteOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">

                  <UserPlus className="w-4 h-4 text-[#7C3AED]" />
                </button>
                <button
              onClick={handleCancelJourney}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">

                  <XCircle className="w-4 h-4" />
                </button>
              </>}

          </div>
        </div>

        {}
        <div className="hidden lg:flex max-w-6xl mx-auto px-4 sm:px-6 pt-5 items-center justify-between w-full">
          <Link
          to="/social/journeys"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs">

            <ArrowLeft className="w-4 h-4 text-slate-500" /> Back to Journey Hub
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-6 space-y-4 mt-3 lg:mt-5 w-full flex-1">

          {}
          {showWelcome &&
          <div className="bg-gradient-to-r from-slate-900 via-brand-900/90 to-slate-900 text-white p-4 rounded-2xl border border-brand-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-xl shrink-0">
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
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 border border-brand-400/30 relative z-10 w-full sm:w-auto">

                Let's Collaborate!
              </button>
            </div>}


          {}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-slate-950 group">
            <div className="h-44 sm:h-64 lg:h-72 w-full relative">
              <img
              src={journey.coverImage || defaultBanner}
              alt={journey.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 dark:opacity-60" />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {}
              <div className="hidden lg:flex absolute top-4 left-4 right-4 items-center justify-between gap-2 flex-wrap z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <JourneyStatusBadge status={journey.status} size="md" />
                  <span className="px-3 py-1 rounded-xl bg-slate-900/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />{" "}
                    {getJourneyBadge(journey)}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-900/60 backdrop-blur-md text-slate-200 text-xs font-bold border border-white/20 shadow-xs flex items-center gap-1.5 capitalize">
                    <Sparkles className="w-3.5 h-3.5 text-slate-300" />{" "}
                    {journey.sourceType ? `Source: ${journey.sourceType}` : "Private Plan"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {journey.journeyType !== "Solo" &&
                  <button
                  onClick={() => navigate(journey.chatRoomId ? `/social/chat/${journey.chatRoomId}` : `/social/chat`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                  title="Open Squad Chat">

                      <MessageSquare className="w-3.5 h-3.5 text-slate-200" />
                      <span>Open Squad Chat</span>
                    </button>}

                  {isOrganizer && journey.status !== "Cancelled" &&
                  <>
                      <button
                    onClick={() => setIsInviteOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all shadow-md flex items-center gap-1.5 active:scale-95">

                        <UserPlus className="w-3.5 h-3.5" /> Invite Buddies
                      </button>
                      <button
                    onClick={handleCancelJourney}
                    className="p-1.5 rounded-xl bg-rose-500/40 hover:bg-rose-600 backdrop-blur-md text-white border border-rose-400/40 transition-all shadow-md active:scale-95"
                    title="Cancel Journey">

                        <XCircle className="w-4 h-4" />
                      </button>
                    </>}

                </div>
              </div>

              {}
              <div className="flex lg:hidden absolute top-3 left-3 right-3 items-center justify-between gap-2 flex-wrap z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <JourneyStatusBadge status={journey.status} size="sm" />
                </div>
                <div className="flex items-center gap-1.5">
                  {journey.journeyType !== "Solo" &&
                  <button
                  onClick={() => navigate(journey.chatRoomId ? `/social/chat/${journey.chatRoomId}` : `/social/chat`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-md text-white border border-white/20 text-[11px] font-bold flex items-center gap-1">

                      <MessageSquare className="w-3 h-3 text-slate-200" />
                      <span>Chat</span>
                    </button>}

                  {isOrganizer && journey.status !== "Cancelled" &&
                  <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-md text-white border border-white/20 text-[11px] font-bold flex items-center gap-1">

                      <UserPlus className="w-3 h-3" />
                      <span>Invite</span>
                    </button>}

                </div>
              </div>

              {}
              <div className="absolute bottom-3 left-4 right-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 text-[10px] font-extrabold tracking-wider uppercase">
                  <MapPin className="w-3 h-3 text-[#FF5A7A] shrink-0" />
                  <span className="truncate">{journey.destination} • {journey.journeyType}</span>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight line-clamp-2">
                  {journey.title}
                </h1>
                {}
                <div className="flex items-center gap-1.5 lg:hidden flex-wrap mt-1">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    {getJourneyBadge(journey)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="hidden lg:flex bg-white dark:bg-slate-900 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs items-center gap-1.5 overflow-x-auto flex-nowrap whitespace-nowrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 whitespace-nowrap ${
                isActive ?
                "bg-[#7C3AED] text-white shadow-sm font-bold" :
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                }`}>

                  <tab.icon
                  className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />

                  <span>{tab.label}</span>
                </button>);

            })}
          </div>

          {}
          {activeTab === "overview" && isOrganizer && ((journey.pendingInvitationCount || 0) > 0 || (journey.acceptedInvitationCount || 0) > 0) &&
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#7C3AED]/15 rounded-lg flex items-center justify-center text-[#7C3AED] shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  Recruitment Analytics
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-black border border-slate-200 dark:border-slate-700">
                    LIVE
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending:</span>
                  <span className="font-bold text-amber-600">{journey.pendingInvitationCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accepted:</span>
                  <span className="font-bold text-emerald-600">{journey.acceptedInvitationCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Squad:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{journey.members?.length || 1}</span>
                </div>
              </div>
            </div>}


          {}
          <div className="lg:mt-0">
            {activeTab === "overview" && <JourneyDetails journey={journey} />}
            {activeTab === "workspace" &&
            <JourneyWorkspaceView journeyId={journey._id} />}

            {activeTab === "timeline" &&
            <JourneyTimelineView
            timeline={journey.timeline || []}
            journeyStatus={journey.status}
            onTriggerCheckIn={() => setIsCheckInOpen(true)} />}



            {activeTab === "members" &&
            <JourneyMembers
            journey={journey}
            currentUserId={currentUserId}
            onInviteClick={() => setIsInviteOpen(true)}
            onRemoveMember={handleRemoveMember}
            onRefreshJourney={fetchJourney} />}


            {activeTab === "gallery" &&
            <JourneyGalleryView journeyId={journey._id} />}

            {activeTab === "memories" &&
            <JourneyMemoryCard
            journey={journey}
            currentUserId={currentUserId}
            onUpdated={fetchJourney} />}


          </div>
        </div>
      </div>

      {}
      <nav className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around overflow-x-auto scrollbar-none px-1 h-14">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 px-1 rounded-xl transition-all shrink-0 ${
              isActive ? "text-[#7C3AED]" : "text-slate-400"
              }`}>

                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-bold leading-none">{tab.shortLabel}</span>
              </button>);

          })}
        </div>
      </nav>

      {}
      <InviteBuddyModal
      journey={journey}
      isOpen={isInviteOpen}
      onClose={() => setIsInviteOpen(false)}
      onInvited={fetchJourney} />


      {}
      <SafeCheckInModal
      journey={journey}
      isOpen={isCheckInOpen}
      onClose={() => setIsCheckInOpen(false)}
      onSuccess={fetchJourney} />

    </div>);

};

export default JourneyDetailsPage;