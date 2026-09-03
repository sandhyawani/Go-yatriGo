import React, { useState, useEffect, useContext } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import {
  Compass,
  MapPin,
  Calendar,
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
  Clock,
  AlertTriangle
} from "lucide-react";
import axiosInstance from "../../api/axios";
import { AuthContext } from "../../context/authContext";
import { showToast } from "../../utils/showToast";
import { getJourneyLifecycle, getEligibilityErrorMessage, checkTripOverlapConflict } from "../../utils/journeyLifecycle";

import JourneyStatusBadge from "../../components/journey/JourneyStatusBadge";
import JourneyDetails from "../../components/journey/JourneyDetails";
import JourneyMembers from "../../components/journey/JourneyMembers";
import JourneyTimelineView from "../../components/journey/JourneyTimelineView";
import JourneyWorkspaceView from "../../components/journey/JourneyWorkspaceView";
import JourneyGalleryView from "../../components/journey/JourneyGalleryView";
import JourneyMemoryCard from "../../components/journey/JourneyMemoryCard";
import InviteBuddyModal from "../../components/journey/InviteBuddyModal";
import SafeCheckInModal from "../../components/journey/SafeCheckInModal";
import CancelJourneyModal from "../../components/journey/CancelJourneyModal";
import TripOverlapConflictModal from "../../components/journey/TripOverlapConflictModal";
import TripOverlapConflictBanner from "../../components/journey/TripOverlapConflictBanner";

const JourneyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext) || {};
  const currentUserId = user?._id || user?.id;

  const validTabs = ["overview", "workspace", "timeline", "members", "gallery", "memories"];
  const urlTab = searchParams.get("tab");
  const normalizedUrlTab = urlTab === "safety" ? "timeline" : urlTab;
  const initialTab = normalizedUrlTab && validTabs.includes(normalizedUrlTab) ? normalizedUrlTab : "overview";

  const [journey, setJourney] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const currentParam = searchParams.get("tab");
    const norm = currentParam === "safety" ? "timeline" : currentParam;
    if (norm && validTabs.includes(norm)) {
      setActiveTab(norm);
    } else if (!currentParam) {
      setActiveTab("overview");
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    const targetTab = tabId === "safety" ? "timeline" : tabId;
    setActiveTab(targetTab);
    setSearchParams(targetTab === "overview" ? {} : { tab: targetTab }, { replace: true });
  };
  const [loading, setLoading] = useState(true);
  const [myJoinRequest, setMyJoinRequest] = useState(null);
  const [requestingJoin, setRequestingJoin] = useState(false);
  const [leavingJourney, setLeavingJourney] = useState(false);
  const [overlapConflict, setOverlapConflict] = useState({
    hasConflict: false,
    conflictType: null,
    conflictingTrip: null,
    message: ""
  });
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const getJourneyBadge = (j) => {
    if (j?.journeyType === "Solo Journey" || j?.journeyType === "Solo")
    return "Solo Journey";
    return "Shared Journey";
  };

  const fetchJourney = (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    axiosInstance
    .get(`/journeys/${id}`)
    .then((res) => {
      if (res.data?.success) setJourney(res.data.journey);
    })
    .catch((err) => {
      console.error("Error loading journey details:", err);
      if (!silent) {
        showToast.error("Journey not found or access denied");
        navigate("/social/journeys");
      }
    })
    .finally(() => {
      if (!silent) setLoading(false);
    });
  };

  useEffect(() => {
    setJourney(null);
    setMyJoinRequest(null);
    setOverlapConflict({ hasConflict: false, conflictType: null, conflictingTrip: null, message: "" });
    setIsConflictModalOpen(false);
    fetchJourney();
  }, [id]);

  useEffect(() => {
    if (journey && user) {
      const currentUserIdStr = (currentUserId?._id || currentUserId?.id || currentUserId || "").toString();
      const isMem = (journey.creator?._id || journey.creator)?.toString() === currentUserIdStr ||
        journey.members?.some(m => (m.user?._id || m.user || m._id || m)?.toString() === currentUserIdStr && (!m.status || m.status === "active"));
      if (!isMem) {
        axiosInstance.get(`/journeys/${id}/my-join-request`)
          .then(res => {
            if (res.data?.success) setMyJoinRequest(res.data.joinRequest);
          })
          .catch(err => console.error("Error fetching join request:", err));

        axiosInstance.get("/journeys/my")
          .then((res) => {
            if (res.data?.success) {
              const myJourneys = res.data.journeys || [];
              const conflictResult = checkTripOverlapConflict(myJourneys, journey, currentUserId);
              setOverlapConflict(conflictResult);
            }
          })
          .catch((err) => console.warn("Could not check active journeys:", err));
      } else {
        setOverlapConflict({ hasConflict: false, conflictType: null, conflictingTrip: null, message: "" });
      }
    }
  }, [journey, user, id, currentUserId]);

  const handleRequestJoin = async () => {
    try {
      setRequestingJoin(true);
      const res = await axiosInstance.post(`/journeys/${id}/join-requests`);
      if (res.data?.success) {
        setMyJoinRequest(res.data.joinRequest);
        showToast.success("Join request sent successfully.");
      }
    } catch (err) {
      const errorCode = err.response?.data?.code || err.response?.data?.error?.code;
      if (errorCode === "ACTIVE_JOURNEY_CONFLICT" || errorCode === "OVERLAPPING_JOURNEY") {
        const errorMsg = getEligibilityErrorMessage(err);
        setOverlapConflict({
          hasConflict: true,
          conflictType: errorCode,
          conflictingTrip: err.response?.data?.conflictingJourney || null,
          message: errorMsg
        });
        setIsConflictModalOpen(true);
        showToast.warning(errorMsg);
        return;
      }
      showToast.error(getEligibilityErrorMessage(err, "Failed to send join request"));
      fetchJourney(true);
    } finally {
      setRequestingJoin(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!myJoinRequest?._id) return;
    try {
      setRequestingJoin(true);
      const res = await axiosInstance.delete(`/journeys/join-requests/${myJoinRequest._id}`);
      if (res.data?.success) {
        setMyJoinRequest(null);
        showToast.success("Join request cancelled.");
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to cancel join request"));
      fetchJourney(true);
    } finally {
      setRequestingJoin(false);
    }
  };

  const handleLeaveJourney = async () => {
    if (!window.confirm(`Are you sure you want to leave "${journey?.title}"?`)) {
      return;
    }
    try {
      setLeavingJourney(true);
      const res = await axiosInstance.post(`/journeys/${id}/leave`);
      if (res.data?.success) {
        showToast.success("Left journey successfully.");
        navigate("/social/journeys");
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to leave journey"));
      fetchJourney(true);
    } finally {
      setLeavingJourney(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Compass className="w-7 h-7 text-brand animate-spin" />
        </div>
        <p className="text-sm font-bold text-text-muted">
          Entering Journey Hub...
        </p>
      </div>);

  }

  if (!journey) return null;

  const lifecycle = getJourneyLifecycle(journey);

  const isHost =
    (journey.creator?._id || journey.creator)?.toString() === currentUserId?.toString();

  const isOrganizer = isHost;

  const isCoOrganizer = journey.members?.some(
    (m) => (m.user?._id || m.user).toString() === currentUserId?.toString() && m.role === "Co-Organizer"
  );

  const isMember =
    isHost ||
    journey.members?.some(
      (m) => (m.user?._id || m.user).toString() === currentUserId?.toString()
    );

  const isRegularMember = isMember && !isHost;

  const availableSeats = Math.max(0, (journey.maxMembers || 50) - (journey.members?.length || 0));

  const isJoinable =
    !isMember &&
    (lifecycle.isPlanning || lifecycle.isUpcoming);

  const canInvite = isHost && (lifecycle.isPlanning || lifecycle.isUpcoming);

  const canLeave = isRegularMember && (lifecycle.isPlanning || lifecycle.isUpcoming);

  const canCancel = isHost && (lifecycle.isPlanning || lifecycle.isUpcoming);

  const confirmCancelJourney = async (reason) => {
    try {
      const res = await axiosInstance.post(`/journeys/${id}/cancel`, { reason });
      if (res.data?.success) {
        showToast.success("Journey cancelled successfully.");
        if (res.data.journey) {
          setJourney(res.data.journey);
        } else {
          setJourney((prev) => ({
            ...prev,
            status: "Cancelled",
            isCancelled: true,
            cancelledAt: new Date().toISOString()
          }));
        }
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to cancel journey"));
      fetchJourney(true);
    } finally {
      setIsCancelModalOpen(false);
    }
  };

  const handleRemoveMember = async (targetId) => {
    try {
      await axiosInstance.delete(`/journeys/${id}/members/${targetId}`);
      fetchJourney();
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to remove member"));
    }
  };

  const tabs = [
  { id: "overview", label: "Overview", shortLabel: "Info", icon: Compass },
  { id: "workspace", label: "Workspace", shortLabel: "Plans", icon: Layout },
  { id: "timeline", label: "Timeline", shortLabel: "Safety", icon: ShieldCheck },
  {
    id: "members",
    label: `Members (${journey.members?.length ?? 0})`,
    shortLabel: "Travel Group",
    icon: Users
  },

  { id: "gallery", label: "Gallery", shortLabel: "Gallery", icon: Image },
  { id: "memories", label: "Scrapbook", shortLabel: "Book", icon: BookOpen }];


  const defaultBanner =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background pb-28 lg:pb-10">
      <div className="flex-1 min-h-[calc(100vh-14rem)] flex flex-col">

        {/* Top Sticky Bar on Mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 h-12 flex items-center justify-between px-4">
          <Link
          to="/social/journeys"
          className="flex items-center gap-1.5 text-text-primary font-bold text-sm">

            <ChevronLeft className="w-4 h-4 text-brand" />
            Journey Hub
          </Link>
          <div className="flex items-center gap-2">
            {journey.chatRoomId && journey.journeyType !== "Solo" && isMember && (
              <button
                onClick={() => navigate(`/social/chat/${journey.chatRoomId}`)}
                className="p-2 rounded-xl bg-background text-text-primary"
                title="Open Group Chat"
              >
                <MessageSquare className="w-4 h-4 text-brand" />
              </button>
            )}

            {canInvite && (
              <button
                onClick={() => setIsInviteOpen(true)}
                className="p-2 rounded-xl bg-background text-text-primary"
                title="Invite Companions"
              >
                <UserPlus className="w-4 h-4 text-brand" />
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="p-2 rounded-xl bg-rose-50 text-rose-500"
                title="Cancel Journey"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}

            {canLeave && (
              <button
                onClick={handleLeaveJourney}
                disabled={leavingJourney}
                className="p-2 rounded-xl bg-rose-50 text-rose-500"
                title="Leave Journey"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>

        {/* Back Link on Desktop */}
        <div className="hidden lg:flex max-w-6xl mx-auto px-4 sm:px-6 pt-5 items-center justify-between w-full">
          <Link
          to="/social/journeys"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover text-xs font-bold text-text-primary transition-all shadow-xs">

            <ArrowLeft className="w-4 h-4 text-text-muted" /> Back to Journey Hub
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-6 space-y-4 mt-3 lg:mt-5 w-full flex-1">


          {journey.status === "Cancelled" && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 shadow-sm animate-fade-in">
              <XCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <h3 className="font-extrabold text-sm m-0">This Journey Has Been Cancelled</h3>
                <p className="text-xs opacity-90 m-0">
                  {journey.cancellationReason
                    ? `Host reason: "${journey.cancellationReason}"`
                    : "The host has cancelled this journey. No further modifications or member actions are permitted."}
                </p>
              </div>
            </div>
          )}

          {lifecycle.isOngoing && (
            <div className="bg-cyan-50/80 border border-cyan-200/80 p-4 rounded-2xl flex items-center gap-3 text-cyan-950 shadow-sm animate-fade-in">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm m-0">Journey in Progress</h3>
                <p className="text-xs text-cyan-800/90 m-0">
                  This journey has started and is no longer accepting new travelers.
                </p>
              </div>
            </div>
          )}

          {overlapConflict.hasConflict && isJoinable && (
            <TripOverlapConflictBanner
              conflictType={overlapConflict.conflictType}
              customMessage={overlapConflict.message}
              onOpenDetails={() => setIsConflictModalOpen(true)}
            />
          )}


          {/* Banner Media Hero */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-950 group">
            <div className="min-h-[190px] sm:min-h-[220px] lg:min-h-[240px] w-full relative flex flex-col justify-between p-4 sm:p-6">
              <img
                src={journey.coverImage || defaultBanner}
                alt={journey.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 pointer-events-none"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30 pointer-events-none" />

              {/* Top Row: Navigation / Badges / Actions */}
              <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <JourneyStatusBadge status={journey.status} size="sm" />
                  <span className="btn-primary">
                    <User className="w-3 h-3 text-slate-300" /> {getJourneyBadge(journey)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {journey.journeyType !== "Solo" && isMember && (
                    <button
                      onClick={() => navigate(journey.chatRoomId ? `/social/chat/${journey.chatRoomId}` : `/social/chat`)}
                      className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                      title="Open Group Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}

                  {canInvite && (
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/30 transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Invite Buddies</span>
                      <span className="sm:hidden">Invite</span>
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="p-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-600/60 backdrop-blur-md text-rose-200 border border-rose-400/40 transition-all shadow-md active:scale-95"
                      title="Cancel Journey"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {canLeave && (
                    <button
                      onClick={handleLeaveJourney}
                      disabled={leavingJourney}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-600/60 backdrop-blur-md text-rose-100 text-xs font-bold border border-rose-400/40 transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      title="Leave Journey"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-300" />
                      <span>{leavingJourney ? "Leaving..." : "Leave"}</span>
                    </button>
                  )}

                  {isJoinable && (
                    myJoinRequest ? (
                      <button
                        onClick={handleCancelJoinRequest}
                        disabled={requestingJoin}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 bg-amber-500/90 hover:bg-rose-600 text-white border border-amber-400/50 group/req"
                        title="Click to cancel join request"
                      >
                        <Clock className="w-3.5 h-3.5 group-hover/req:hidden" />
                        <XCircle className="w-3.5 h-3.5 hidden group-hover/req:inline" />
                        <span className="group-hover/req:hidden">Request Pending</span>
                        <span className="hidden group-hover/req:inline">Cancel Request</span>
                      </button>
                    ) : overlapConflict.hasConflict ? (
                      <button
                        type="button"
                        onClick={() => setIsConflictModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-400/50 cursor-pointer active:scale-95 transition-all"
                        title="Dates overlap with another trip. Click to view conflict details."
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{overlapConflict.conflictType === "ACTIVE_JOURNEY_CONFLICT" ? "Active Conflict" : "Schedule Conflict"}</span>
                      </button>
                    ) : availableSeats <= 0 ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 bg-slate-500/80 text-white cursor-not-allowed border border-slate-400/50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Full Capacity
                      </button>
                    ) : (
                      <button
                        onClick={handleRequestJoin}
                        disabled={requestingJoin}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 bg-brand hover:bg-brand-dark text-white border border-brand/50 disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> {requestingJoin ? "Sending..." : "Request to Join"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Center/Bottom Area: Compact Title + Destination + Dates + Lead */}
              <div className="relative z-10 space-y-2 mt-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow-md leading-tight line-clamp-2 m-0 font-heading">
                  {journey.title}
                </h1>

                <div className="flex items-center gap-3 sm:gap-4 text-slate-200 text-xs font-medium sm:font-semibold flex-wrap font-sans">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold">{journey.destination || "Destination TBD"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span>
                      {journey.startDate
                        ? `${new Date(journey.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${
                            journey.endDate
                              ? new Date(journey.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : ""
                          }`
                        : "Flexible Dates"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>{journey.members?.length ?? 1} Travelers</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>
                      Host:{" "}
                      {journey.creator?._id || journey.creator?.id || (typeof journey.creator === "string" ? journey.creator : null) ? (
                        <Link
                          to={`/profile/${journey.creator?._id || journey.creator?.id || journey.creator}`}
                          className="text-white hover:text-primary-300 hover:underline font-bold transition-colors"
                        >
                          {journey.creator?.name || "Host"}
                        </Link>
                      ) : (
                        <strong className="text-white">{journey.creator?.name || "Host"}</strong>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex bg-white backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-xs items-center gap-1 overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all select-none shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-brand text-white shadow-sm font-bold"
                      : "text-text-secondary hover:text-text-primary hover:bg-background/40"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-text-muted"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recruitment Analytics (Planning/Upcoming Only) */}
          {activeTab === "overview" && isOrganizer && (lifecycle.isPlanning || lifecycle.isUpcoming) && ((journey.pendingInvitationCount || 0) > 0 || (journey.acceptedInvitationCount || 0) > 0) && (
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand/15 rounded-lg flex items-center justify-center text-brand shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  Recruitment Analytics
                  <span className="text-[9px] bg-background text-text-primary px-1.5 py-0.2 rounded font-black border border-slate-200">
                    LIVE
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Pending:</span>
                  <span className="font-bold text-amber-600">{journey.pendingInvitationCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Accepted:</span>
                  <span className="font-bold text-emerald-600">{journey.acceptedInvitationCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Members:</span>
                  <span className="font-bold text-text-primary">{journey.members?.length ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab Views */}
          <div className="lg:mt-0">
            {activeTab === "overview" && (
              <JourneyDetails
                journey={journey}
                currentUserId={currentUserId}
                onTabChange={handleTabChange}
                onOpenCheckIn={lifecycle.isOngoing ? () => setIsCheckInOpen(true) : undefined}
              />
            )}

            {activeTab === "workspace" && (
              <JourneyWorkspaceView journeyId={journey._id} />
            )}

            {activeTab === "timeline" && (
              <JourneyTimelineView
                journeyId={journey._id}
                journey={journey}
                timeline={journey.timeline || []}
                journeyStatus={journey.status}
                onTriggerCheckIn={lifecycle.isOngoing ? () => setIsCheckInOpen(true) : undefined}
                onRefresh={() => fetchJourney(true)}
              />
            )}



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

      <nav className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none px-1 h-14 w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 py-1.5 px-0.5 rounded-xl transition-all shrink-0 ${
              isActive ? "text-brand" : "text-text-muted"
              }`}>

                <tab.icon className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-bold leading-none truncate max-w-full">{tab.shortLabel}</span>
              </button>);

          })}
        </div>
      </nav>

      <InviteBuddyModal
      journey={journey}
      isOpen={isInviteOpen}
      onClose={() => setIsInviteOpen(false)}
      onInvited={fetchJourney} />


      <SafeCheckInModal
        journey={journey}
        isOpen={isCheckInOpen && lifecycle.isOngoing}
        onClose={() => setIsCheckInOpen(false)}
        onCheckedIn={() => fetchJourney(true)}
        onSuccess={() => fetchJourney(true)} />

      <CancelJourneyModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancelJourney}
        journeyTitle={journey?.title || "this journey"}
      />

      <TripOverlapConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflictType={overlapConflict.conflictType || "ACTIVE_JOURNEY_CONFLICT"}
        conflictingTrip={overlapConflict.conflictingTrip}
        currentTrip={journey}
        customMessage={overlapConflict.message}
      />

    </div>);

};

export default JourneyDetailsPage;