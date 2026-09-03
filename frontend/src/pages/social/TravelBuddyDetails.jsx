import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  MessageSquare,
  MoreVertical,
  AlertTriangle,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Clock,
  Lock,
  BookOpen,
  Award,
  Star,
  ShieldAlert,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Share2,
  Shield,
  Compass,
  Info,
  HelpCircle,
  X,
  Bookmark,
  Heart,
  Mountain,
  Sun
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import {
  getJourneyLifecycle,
  getEligibilityErrorMessage,
  getNormalizedMembers,
  checkIsJourneyMember,
  checkTripOverlapConflict
} from "../../utils/journeyLifecycle";
import ReportModal from "../../components/modals/ReportModal";
import SendWarningModal from "../../components/journey/SendWarningModal";
import TripOverlapConflictModal from "../../components/journey/TripOverlapConflictModal";
import TripOverlapConflictBanner from "../../components/journey/TripOverlapConflictBanner";

const DEFAULT_MANALI_HERO =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1800&q=85";

const TravelBuddyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [trip, setTrip] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [localJoinRequestStatus, setLocalJoinRequestStatus] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCancelJoinModal, setShowCancelJoinModal] = useState(false);

  const [manageAction, setManageAction] = useState(null);
  const [warningMsg, setWarningMsg] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [hasActiveJourneyConflict, setHasActiveJourneyConflict] = useState(false);
  const [overlapConflict, setOverlapConflict] = useState({
    hasConflict: false,
    conflictType: null,
    conflictingTrip: null,
    message: ""
  });
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const [expandedDesc, setExpandedDesc] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const latestFetchIdRef = useRef(id);

  useEffect(() => {
    latestFetchIdRef.current = id;
    setTrip(null);
    setLocalJoinRequestStatus(null);
    setHasActiveJourneyConflict(false);
    setOverlapConflict({ hasConflict: false, conflictType: null, conflictingTrip: null, message: "" });
    setIsConflictModalOpen(false);
    setRequestMessage("");
    setSubmittingRequest(false);
    setCancellingRequest(false);
    setLoading(true);
    fetchTripDetails(id);
  }, [id, user]);

  const fetchTripDetails = async (targetId = id) => {
    try {
      const res = await axios.get(`/social/buddy/${targetId}`, {
        withCredentials: true
      });

      if (latestFetchIdRef.current !== targetId) return;

      const fetchedTrip = res.data.trip;
      setTrip(fetchedTrip);
      setLocalJoinRequestStatus(null);

      if (user) {
        try {
          const myJourneysRes = await axios.get("/journeys/my", { withCredentials: true });
          if (latestFetchIdRef.current !== targetId) return;

          const myJourneys = myJourneysRes.data?.journeys || [];
          const conflictResult = checkTripOverlapConflict(myJourneys, fetchedTrip, user);
          setOverlapConflict(conflictResult);
          setHasActiveJourneyConflict(conflictResult.hasConflict);
        } catch (myJourneysErr) {
          console.warn("Could not check user active journeys:", myJourneysErr);
        }
      }
    } catch (err) {
      if (latestFetchIdRef.current === targetId) {
        showToast.error("Failed to load group details");
        navigate("/social/buddy");
      }
    } finally {
      if (latestFetchIdRef.current === targetId) {
        setLoading(false);
      }
    }
  };

  const handleShare = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast.success("Journey link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleSendRequest = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast.error("Please login to submit join requests");
      navigate("/login");
      return;
    }

    if (submittingRequest || isPending || isMember) {
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await axios.post(
        `/social/buddy/join-request/${id}`,
        { message: requestMessage, note: requestMessage },
        { withCredentials: true }
      );
      setRequestMessage("");
      if (res.data?.status === "accepted") {
        setLocalJoinRequestStatus("accepted");
        showToast.success(res.data.message || "Joined group successfully!");
      } else {
        setLocalJoinRequestStatus("pending");
        showToast.success(res.data.message || "Request submitted successfully!");
      }
      await fetchTripDetails();
    } catch (err) {
      const errorCode = err.response?.data?.code || err.response?.data?.error?.code;
      const errorMsg = err.response?.data?.message || "";

      if (errorCode === "ACTIVE_JOURNEY_CONFLICT" || errorCode === "OVERLAPPING_JOURNEY") {
        const displayMsg = getEligibilityErrorMessage(err);
        setOverlapConflict({
          hasConflict: true,
          conflictType: errorCode,
          conflictingTrip: err.response?.data?.conflictingJourney || null,
          message: displayMsg
        });
        setHasActiveJourneyConflict(true);
        setIsConflictModalOpen(true);
        showToast.warning(displayMsg);
        return;
      }

      if (
        errorCode === "ALREADY_PENDING" ||
        errorCode === "JOIN_REQUEST_ALREADY_PENDING" ||
        /already\s*pending/i.test(errorMsg)
      ) {
        setLocalJoinRequestStatus("pending");
        setRequestMessage("");
        showToast.info("Your join request is already pending.");
        await fetchTripDetails();
        return;
      }

      if (
        errorCode === "ALREADY_MEMBER" ||
        /already\s*(a\s*)?member/i.test(errorMsg)
      ) {
        setLocalJoinRequestStatus("accepted");
        showToast.info("You are already a member of this journey.");
        await fetchTripDetails();
        return;
      }

      const displayError = getEligibilityErrorMessage(err, "Submit failed");
      showToast.error(displayError);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    try {
      setCancellingRequest(true);
      await axios.post(
        `/social/buddy/cancel-request/${id}`,
        {},
        { withCredentials: true }
      );
      showToast.success("Join request cancelled");
      setLocalJoinRequestStatus("none");
      setShowCancelJoinModal(false);
      await fetchTripDetails();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to cancel request");
      setShowCancelJoinModal(false);
    } finally {
      setCancellingRequest(false);
    }
  };

  const handleManageRequest = async (requestId, status) => {
    try {
      await axios.post(
        `/social/buddy/manage-request/${id}`,
        { requestId, status },
        { withCredentials: true }
      );
      showToast.success(`Request successfully ${status.toLowerCase()}`);
      await fetchTripDetails();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleManageMember = async () => {
    if (!manageAction) return;
    try {
      const { type, memberId } = manageAction;
      if (type === "warn") {
        await axios.post(
          `/social/buddy-trips/${id}/warn/${memberId}`,
          { message: warningMsg },
          { withCredentials: true }
        );
        showToast.success("Warning sent");
      } else if (type === "ban") {
        await axios.post(
          `/social/buddy-trips/${id}/ban/${memberId}`,
          {},
          { withCredentials: true }
        );
        showToast.success("User banned");
      } else if (type === "remove") {
        await axios.delete(`/social/buddy-trips/${id}/member/${memberId}`, {
          withCredentials: true
        });
        showToast.success("Member removed");
      } else if (type === "promote") {
        await axios.post(
          `/social/buddy-trips/${id}/promote/${memberId}`,
          {},
          { withCredentials: true }
        );
        showToast.success("Role updated");
      }
      setManageAction(null);
      setWarningMsg("");
      fetchTripDetails();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleLeaveTrip = async () => {
    try {
      await axios.post(
        `/social/buddy/leave/${id}`,
        {},
        { withCredentials: true }
      );
      showToast.success("You left the group successfully");
      setShowLeaveModal(false);
      navigate("/social/buddy");
    } catch (err) {
      showToast.error(err.response?.data?.message || "Leave failed");
    }
  };

  const handleCancelTrip = async () => {
    try {
      await axios.patch(
        `/social/buddy/${id}/cancel`,
        { cancellationReason },
        { withCredentials: true }
      );
      showToast.success("Travel group cancelled");
      setTrip((prev) => ({
        ...prev,
        status: "cancelled",
        lifecycleStatus: "cancelled"
      }));
      setShowCancelModal(false);
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to cancel group");
    }
  };

  const handleFelt = async () => {
    if (!user) {
      showToast.error("Please login to bookmark journeys");
      return;
    }

    const cleanTripId = (id?._id || id?.id || id)?.toString();
    if (!cleanTripId) return;

    const currentUserId = (user._id || user.id)?.toString();

    let prevTripSnapshot = trip;
    setTrip((prev) => {
      prevTripSnapshot = prev;
      if (!prev) return prev;
      const currentLikes = Array.isArray(prev.likes) ? prev.likes : [];
      const hasLiked = currentLikes.some(
        (lid) => (lid?._id || lid)?.toString() === currentUserId
      );
      const updatedLikes = hasLiked
        ? currentLikes.filter((lid) => (lid?._id || lid)?.toString() !== currentUserId)
        : [...currentLikes, user._id || user.id];
      return {
        ...prev,
        likes: updatedLikes,
        likesCount: updatedLikes.length
      };
    });

    try {
      const res = await axios.post(
        `/social/buddy/like/${cleanTripId}`,
        {},
        { withCredentials: true }
      );
      if (res.data && res.data.success) {
        const isLikedNow = res.data.isLiked;
        const serverLikes = res.data.likes;
        setTrip((prev) => {
          if (!prev) return prev;
          if (Array.isArray(serverLikes)) {
            return { ...prev, likes: serverLikes, likesCount: serverLikes.length };
          }
          const currentLikes = Array.isArray(prev.likes) ? prev.likes : [];
          const updatedLikes = isLikedNow
            ? currentLikes.some((lid) => (lid?._id || lid)?.toString() === currentUserId)
              ? currentLikes
              : [...currentLikes, user._id || user.id]
            : currentLikes.filter((lid) => (lid?._id || lid)?.toString() !== currentUserId);
          return {
            ...prev,
            likes: updatedLikes,
            likesCount: updatedLikes.length
          };
        });
        showToast.success(
          isLikedNow ? "Journey bookmarked to your saved vibes!" : "Removed from saved journeys"
        );
      }
    } catch (err) {
      setTrip(prevTripSnapshot);
      showToast.error(err.response?.data?.message || "Failed to update bookmark");
    }
  };

  const handleOpenJourneyWorkspace = async (openChatDirectly = false) => {
    try {
      const res = await axios.get("/journeys/my", { withCredentials: true });
      if (res.data?.success) {
        const journeys = res.data.journeys || [];
        const existing = journeys.find(
          (j) => j.sourceType === "explore" && j.sourceId?.toString() === id.toString()
        );
        if (existing) {
          if (openChatDirectly && existing.chatRoomId) {
            navigate(`/social/chat/${existing.chatRoomId}`);
          } else {
            navigate(`/social/journeys/${existing._id}`);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Error checking existing journey:", err);
    }

    try {
      const payload = {
        title: trip.title,
        from: trip.from,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        journeyType: "Friends",
        privacy: "Private",
        sourceType: "explore",
        sourceId: trip._id,
        description: trip.description,
        invitedUserIds: []
      };

      const res = await axios.post("/journeys", payload, { withCredentials: true });
      if (res.data?.success) {
        if (openChatDirectly && res.data.journey.chatRoomId) {
          navigate(`/social/chat/${res.data.journey.chatRoomId}`);
        } else {
          navigate(`/social/journeys/${res.data.journey._id}`);
        }
      }
    } catch (err) {
      showToast.error("Failed to unlock Journey Workspace");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#fafbfc] min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200 animate-pulse" />
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-brand animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-900">Loading Journey</p>
          <p className="text-xs text-slate-500 font-medium">Connecting to trip coordinates...</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const lifecycle = getJourneyLifecycle(trip);
  const isOngoing = lifecycle.isOngoing;
  const isUpcoming = lifecycle.isUpcoming || lifecycle.isPlanning;
  const isCompleted = lifecycle.isCompleted;
  const isCancelled = lifecycle.isCancelled || trip.status === "cancelled";

  const normalizedMembers = getNormalizedMembers(trip);
  const memberCount = normalizedMembers.length;
  const rawMax = trip.maxMembers || trip.maxCompanions || 8;
  const maxMembers = Math.max(memberCount, rawMax > 20 ? 8 : rawMax);
  const slotsOpen = Math.max(0, maxMembers - memberCount);
  const isGroupFull = slotsOpen <= 0;
  const fillPercentage = Math.min(100, Math.round((memberCount / maxMembers) * 100));

  const currentUserId = (user?._id || user?.id || "").toString();
  const isHost = user && ((trip.host?._id || trip.host || trip.creator?._id || trip.creator)?.toString() === currentUserId);
  const isMember = user && checkIsJourneyMember(trip, user);

  const myMemberObj = normalizedMembers.find(
    (m) => (m.user?._id || m.user?.id || m.user)?.toString() === currentUserId
  );
  const myStandardRole = isHost ? "Host" : (myMemberObj?.standardRole || "Member");

  const getDerivedRequestStatus = () => {
    if (!user) return "none";
    if (isMember) return "accepted";

    if (trip.joinRequestStatus !== undefined && trip.joinRequestStatus !== null) {
      const s = String(trip.joinRequestStatus).toLowerCase();
      if (s === "pending") return "pending";
      if (s === "approved" || s === "accepted") return "accepted";
      if (s === "rejected") return "rejected";
      if (s === "cancelled") return "none";
    }

    if (Array.isArray(trip.joinRequests) && trip.joinRequests.length > 0) {
      const currentReq = trip.joinRequests.find(
        (r) => (r?.userId?._id || r?.userId)?.toString() === currentUserId
      );
      if (currentReq) {
        const s = String(currentReq.status).toLowerCase();
        if (s === "pending") return "pending";
        if (s === "approved" || s === "accepted") return "accepted";
        if (s === "rejected") return "rejected";
        if (s === "cancelled") return "none";
      }
    }

    if (localJoinRequestStatus) return localJoinRequestStatus;
    return "none";
  };

  const requestStatus = getDerivedRequestStatus();
  const isPending = !isMember && requestStatus === "pending";
  const isApproved = isMember || requestStatus === "accepted";
  const isRejected = !isMember && requestStatus === "rejected";

  const showChat = isMember;
  const routeFrom = trip.from || trip.startLocation || "Delhi";
  const destinationName = trip.destination || "Manali, Himachal Pradesh";
  const journeyTitle = trip.title || "Weekend Escape to Manali";

  const pendingRequests = trip.joinRequests?.filter((r) => r.status === "Pending") || [];
  const hasFelt = trip.likes?.some(
    (likeId) => (likeId?._id || likeId)?.toString() === currentUserId
  );
  const feltCount = trip.likesCount || (Array.isArray(trip.likes) ? trip.likes.length : 0);

  const startD = new Date(trip.startDate);
  const endD = new Date(trip.endDate);
  const diffDays = Math.round(Math.abs(endD - startD) / (1000 * 60 * 60 * 24));
  const tripDuration = Math.max(1, diffDays + 1);

  const formattedDate =
    startD.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }) +
    " – " +
    endD.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    });

  const getAvatar = (usr) => {
    return getAvatarUrl(usr?.pic, usr?.img, usr?.name);
  };

  const hostUser = trip.host || trip.creator || {};
  const hostId = hostUser._id || hostUser.id;
  const hostName = hostUser.name || "Aarav Sharma";
  const hostBio = hostUser.bio || "Avid mountain hiker & curator of scenic Himalayan routes";
  const hostRating = hostUser.rating && Number(hostUser.rating) > 0 ? hostUser.rating : "4.9";
  const hostCompletedTrips = hostUser.completedTrips || 12;
  const hostResponseRate = hostUser.hostResponseRate || 98;

  const filteredMembers = normalizedMembers.filter((m) => {
    if (!memberSearchQuery) return true;
    const name = m.user?.name?.toLowerCase() || "";
    return name.includes(memberSearchQuery.toLowerCase());
  });

  const heroImageSrc = trip.coverImage && !imgError ? trip.coverImage : DEFAULT_MANALI_HERO;

  const journeyHighlights = [
    {
      icon: Mountain,
      title: "Mountains & Nature",
      description: "Scenic alpine passes, pine-scented trails, and panoramic Himalayan vistas."
    },
    {
      icon: Sun,
      title: "Wellness & Relaxation",
      description: "Crisp mountain air, quiet riverside spots, and cozy Old Manali cafe culture."
    },
    {
      icon: Users,
      title: "Group Experience",
      description: "Curated circle of adventurous, like-minded explorers traveling in sync."
    },
    {
      icon: Sparkles,
      title: "Memorable Moments",
      description: "Sunset viewpoints, authentic local cuisine, and evening campfire stories."
    }
  ];

  const faqs = [
    {
      q: "How does the join request and approval process work?",
      a: "When you request to join, your introductory note is sent directly to the trip host. The host reviews traveler profiles to ensure shared travel vibes before confirming. You receive an instant notification once accepted."
    },
    {
      q: "What coordination tools unlock once confirmed?",
      a: "Confirmed members unlock the private Journey Coordination Hub with real-time group chat, shared meetup points, collaborative packing checklists, and itinerary schedules."
    },
    {
      q: "Can I withdraw or cancel if my plans change?",
      a: "Yes. You can withdraw a pending join request at any moment. Confirmed travelers can also leave the journey gracefully before the departure date."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 pt-2 sm:pt-3 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        
        {/* =========================================================================
            TOP NAVIGATION & QUICK ACTIONS BAR
            ========================================================================= */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/social/buddy")}
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/70 text-slate-700 hover:text-slate-950 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs hover:border-slate-300 active:scale-95 cursor-pointer"
              aria-label="Back to explore travel buddies"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 group-hover:text-slate-900 transition-transform duration-200" />
              <span>Back to Explore</span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>/</span>
              <span className="text-slate-500 font-medium">Travel Buddies</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold truncate max-w-[220px]">
                {destinationName}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={trip.status === "cancelled"}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border font-semibold text-xs transition-all rounded-full active:scale-95 cursor-pointer ${
                  trip.status === "cancelled"
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                }`}
              >
                Cancel Group
              </button>
            )}

            {/* Share Trip */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all border border-slate-200/70 shadow-xs active:scale-95 cursor-pointer"
              title="Share journey"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Bookmark Journey (Tied to handleFelt) */}
            <button
              onClick={handleFelt}
              aria-label={hasFelt ? "Bookmarked journey" : "Bookmark this journey"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer ${
                hasFelt
                  ? "bg-sky-50 border-sky-200 text-brand shadow-xs"
                  : "bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 transition-colors ${
                  hasFelt ? "text-brand fill-brand" : "text-slate-400"
                }`}
              />
              <span>{hasFelt ? "Bookmarked" : "Bookmark"}</span>
              {feltCount > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  hasFelt ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-600"
                }`}>
                  {feltCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Overlap Conflict Banner */}
        {overlapConflict.hasConflict && !isMember && isUpcoming && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="shadow-xs"
          >
            <TripOverlapConflictBanner
              conflictType={overlapConflict.conflictType}
              customMessage={overlapConflict.message}
              onOpenDetails={() => setIsConflictModalOpen(true)}
            />
          </motion.div>
        )}

        {/* =========================================================================
            HERO SECTION: SLEEK COMPACT VISUAL CENTERPIECE
            ========================================================================= */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm h-56 sm:h-64 md:h-72 lg:h-80 bg-slate-950 select-none group">
          {/* Hero Photography with subtle zoom effect */}
          <img
            src={heroImageSrc}
            alt={`${journeyTitle} scenery`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-102 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <Mountain className="w-10 h-10 text-slate-700 animate-pulse" />
            </div>
          )}

          {/* Cinematic Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          {/* Top Overlay Badges */}
          <div className="absolute top-3.5 left-3.5 right-3.5 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between gap-3 z-10">
            {/* Category Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/95 text-slate-900 shadow-sm border border-white/40">
                <Mountain className="w-3.5 h-3.5 text-brand" />
                <span>{trip.category || "Himalayan Escape"}</span>
              </span>

              {trip.isPrivate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-slate-900/80 text-sky-200 border border-sky-300/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  Approval Required
                </span>
              )}
            </div>

            {/* Group Status Pill */}
            <div>
              {isCancelled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-rose-500/95 text-white shadow-sm">
                  Trip Cancelled
                </span>
              ) : isOngoing ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-600/95 text-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  In Progress
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-slate-900/90 text-slate-200 border border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Journey Concluded
                </span>
              ) : isGroupFull ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-amber-500/95 text-white shadow-sm">
                  Group Full
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-600/95 text-white shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {slotsOpen} {slotsOpen === 1 ? "Spot" : "Spots"} Left
                </span>
              )}
            </div>
          </div>

          {/* Hero Bottom Title & Glass Metadata Pills */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6 z-10 space-y-2 sm:space-y-2.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm font-heading max-w-3xl">
              {journeyTitle}
            </h1>

            <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-xs md:text-sm font-medium text-white flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full text-white">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{routeFrom} → {destinationName}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full text-white">
                <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{formattedDate}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full text-emerald-200 font-semibold">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{tripDuration} {tripDuration === 1 ? "Day" : "Days"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TRIP SUMMARY: ELEGANT HORIZONTAL STRIP DIRECTLY BELOW HERO
            ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x sm:divide-slate-150 items-center">
            
            {/* Host info */}
            <div
              onClick={() => hostId && navigate(`/profile/${hostId}`)}
              className="flex items-center gap-3.5 sm:pr-6 cursor-pointer group"
            >
              <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-100">
                <img
                  src={getAvatar(hostUser)}
                  alt={hostName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                  Hosted by
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block group-hover:text-brand transition-colors">
                  {hostName}
                </span>
              </div>
            </div>

            {/* Capacity info */}
            <div className="flex flex-col gap-1.5 sm:px-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-400">
                  Group Capacity
                </span>
                <span className="font-semibold text-slate-800">
                  {memberCount} of {maxMembers} joined {isGroupFull && "(Full)"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGroupFull ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>

            {/* Journey Style */}
            <div className="flex items-center gap-3.5 sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-brand flex items-center justify-center shrink-0 border border-sky-100/60">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                  Journey Style
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {trip.category || "Mountain Adventure"} · {trip.isPrivate ? "Curated" : "Open"}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            MAIN CONTENT: 2-COLUMN EDITORIAL + STICKY JOURNEY PANEL
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-1">
          
          {/* =====================================================================
              LEFT COLUMN: EDITORIAL ABOUT, HIGHLIGHTS, CREW, GUIDELINES
              ===================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* About Section: Spacious, Editorial & Inspiring */}
            <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  The Journey Experience
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Curated itinerary, breathtaking mountain vistas, and genuine camaraderie.
                </p>
              </div>

              {/* Editorial Body Text */}
              <div className="text-slate-600 text-sm sm:text-[15px] leading-relaxed space-y-4">
                <p className={!expandedDesc && trip.description && trip.description.length > 200 ? "line-clamp-3" : ""}>
                  {trip.description ||
                    "Escape the busy city life for a restorative mountain journey through Manali. We will trek along pine-lined Himalayan trails, explore quiet viewpoints around Old Manali, and unwind in scenic riverfront cafes. Whether you are an experienced hiker or looking to soak in the crisp mountain air with fellow travel enthusiasts, this group adventure is designed for meaningful connections and unforgettable memories."}
                </p>
                {trip.description && trip.description.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setExpandedDesc(!expandedDesc)}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1 cursor-pointer pt-1"
                  >
                    {expandedDesc ? (
                      <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Read full description <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Editorial Highlights: 2x2 Clean Minimalist Grid with Simple Line Icons */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Journey Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {journeyHighlights.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-150">
                          <Icon className="w-4.5 h-4.5 text-brand" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              {trip.tags && trip.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {trip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Journey Coordination Space (For Confirmed Members & Overview for Visitors) */}
            <section className="bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Group Coordination Hub
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time collaboration, traveler chat, and meetup coordination
                  </p>
                </div>

                {isMember && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Confirmed Member
                  </span>
                )}
              </div>

              {showChat ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">
                        You are confirmed for this journey!
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Access group announcements, coordinate gear checklists, and chat directly with your fellow travelers.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => handleOpenJourneyWorkspace(false)}
                      className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-brand" />
                      <span>Open Journey Workspace</span>
                    </button>
                    <button
                      onClick={() => handleOpenJourneyWorkspace(true)}
                      className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Launch Group Chat</span>
                    </button>
                  </div>

                  {!isHost && isUpcoming && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        Leave this journey
                      </button>
                    </div>
                  )}
                </div>
              ) : isPending ? (
                <div className="flex flex-col items-center gap-2.5 py-6 text-center">
                  <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      Join Request Under Host Review
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Your introductory note is waiting for host approval. Once accepted, group chat and workspace access will automatically unlock.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCancelJoinModal(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline pt-1 cursor-pointer"
                  >
                    Withdraw Request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <MessageSquare className="w-4 h-4 text-brand" />
                      <span>Live Group Coordination</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Coordinate packing lists, pickup points, and shared transportation once confirmed.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/70 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Verified & Protected</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Travel with verified companions and enjoy 24/7 Go YatriGo SOS emergency support.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Confirmed Travelers / The Crew */}
            <section className="bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Confirmed Travelers ({memberCount})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adventurers confirmed for this departure
                  </p>
                </div>
                {memberCount > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowMembersModal(true)}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {normalizedMembers.slice(0, 6).map((memberObj) => {
                  const mUser = memberObj.user || {};
                  if (!mUser._id && !mUser.id) return null;
                  const mId = (mUser._id || mUser.id).toString();
                  const isTargetHost = memberObj.standardRole === "Host";
                  const isMe = mId === currentUserId;
                  const canManage =
                    (isHost || myStandardRole === "Co-Leader") &&
                    !isMe &&
                    !isTargetHost;

                  return (
                    <div
                      key={mId}
                      className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-150 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          onClick={() => navigate(`/profile/${mId}`)}
                          src={getAvatar(mUser)}
                          alt={mUser.name || "Member"}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => navigate(`/profile/${mId}`)}
                              className="text-xs font-semibold text-slate-900 truncate cursor-pointer hover:text-brand"
                            >
                              {mUser.name || "Traveler"}
                            </span>
                            {memberObj.standardRole === "Host" ? (
                              <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.2 rounded-full border border-amber-200/60">
                                Host
                              </span>
                            ) : memberObj.standardRole === "Co-Leader" ? (
                              <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-2 py-0.2 rounded-full border border-sky-200/60">
                                Co-Leader
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Star className={`w-3 h-3 ${Number(mUser.rating) > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                            <span>{Number(mUser.rating) > 0 ? mUser.rating : "New Traveler"}</span>
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === mId ? null : mId)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Manage Member"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Travel Guidelines & FAQ Accordion */}
            <section className="bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <HelpCircle className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Trip Guidelines & Helpful Notes
                </h3>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-150 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          activeFaq === idx ? "rotate-180 text-brand" : ""
                        }`}
                      />
                    </button>
                    {activeFaq === idx && (
                      <div className="p-3.5 bg-white text-xs sm:text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-150/70">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* =====================================================================
              RIGHT COLUMN: STICKY JOURNEY PANEL & COMPACT HOST SECTION
              ===================================================================== */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
            
            {/* Primary Sticky Journey Card: Availability & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-xs space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                  {isMember ? "Your Participation" : "Join This Journey"}
                </span>

                {isUpcoming && !isMember && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isGroupFull
                      ? "text-amber-800 bg-amber-50 border border-amber-200/60"
                      : "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                  }`}>
                    {isGroupFull ? "Group Full" : `${slotsOpen} spots left`}
                  </span>
                )}
              </div>

              {/* Status State & Visual Availability */}
              {isOngoing ? (
                <div className="bg-emerald-50/80 border border-emerald-200/70 text-emerald-900 p-4 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Journey in Progress</span>
                  </div>
                  <p className="text-emerald-700 leading-relaxed">
                    This adventure has departed and is currently underway.
                  </p>
                </div>
              ) : isCompleted || isCancelled ? (
                <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl text-xs space-y-1 text-slate-600">
                  <span className="font-bold text-slate-900 block">
                    {isCancelled ? "Trip Cancelled" : "Journey Concluded"}
                  </span>
                  <p className="leading-relaxed">
                    {isCancelled
                      ? "This group journey was cancelled by the host."
                      : "This journey has concluded. Look out for future departures!"}
                  </p>
                </div>
              ) : isMember ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900">
                        {myStandardRole === "Co-Leader" ? "Co-Leader" : "Active Traveler"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Confirmed ✓
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenJourneyWorkspace(true)}
                    className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Launch Group Chat</span>
                  </button>
                </div>
              ) : isPending ? (
                <div className="bg-amber-50/70 border border-amber-200/70 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Under Review</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Your introductory note is with {hostName}. You will receive an alert once accepted.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCancelJoinModal(true)}
                    disabled={cancellingRequest}
                    className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {cancellingRequest ? "Cancelling..." : "Withdraw Request"}
                  </button>
                </div>
              ) : isGroupFull ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-900">
                        Group is at Capacity
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      All {maxMembers} spots have been filled for this journey. You can bookmark this journey to stay updated if a slot becomes available.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Travelers
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {memberCount} of {maxMembers} Confirmed 
                    </span>
                  </div>

                  <button
                    onClick={handleFelt}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer ${
                      hasFelt
                        ? "bg-sky-50 text-brand border border-sky-200 hover:bg-sky-100"
                        : "bg-brand hover:bg-brand-dark text-white"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${hasFelt ? "fill-brand" : ""}`} />
                    <span>{hasFelt ? "Journey Bookmarked" : "Bookmark Journey"}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-all border border-slate-200/60 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share Trip with Friends</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="space-y-3.5">
                  {isRejected && (
                    <div className="p-3 bg-rose-50 border border-rose-200/70 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Your prior request was declined. You can introduce yourself again.</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Introduce yourself to {hostName}:
                    </label>
                    <textarea
                      placeholder="Tell the host about your travel style, past trips, and why you'd like to join..."
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      disabled={submittingRequest}
                      className="w-full bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-slate-800 text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all resize-none h-24"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRequest || !user}
                    className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs active:scale-98 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{submittingRequest ? "Submitting..." : "Request to Join Group"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFelt}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-all border border-slate-200/60 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${hasFelt ? "text-brand fill-brand" : "text-slate-400"}`} />
                    <span>{hasFelt ? "Bookmarked" : "Bookmark Journey"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Compact Premium Host Profile */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                  About the Host
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>

              {/* Host Identity */}
              <div className="flex items-center gap-3.5">
                <div
                  className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-100 cursor-pointer group"
                  onClick={() => hostId && navigate(`/profile/${hostId}`)}
                >
                  <img
                    src={getAvatar(hostUser)}
                    alt={hostName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4
                    onClick={() => hostId && navigate(`/profile/${hostId}`)}
                    className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-brand transition-colors font-heading"
                  >
                    {hostName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {hostBio}
                  </p>
                </div>
              </div>

              {/* Clean Stats Row */}
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-150/70">
                  <span className="text-[10px] text-slate-400 font-medium block">Rating</span>
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{hostRating}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-150/70">
                  <span className="text-[10px] text-slate-400 font-medium block">Hosted</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {hostCompletedTrips} trips
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-150/70">
                  <span className="text-[10px] text-slate-400 font-medium block">Response</span>
                  <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                    {hostResponseRate}%
                  </span>
                </div>
              </div>

              {/* View Host Profile Button */}
              <button
                onClick={() => hostId && navigate(`/profile/${hostId}`)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl transition-all border border-slate-200/70 flex items-center justify-center gap-1 cursor-pointer active:scale-98"
              >
                <span>View Host Profile</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Pending Requests for Host */}
            {(isHost || myStandardRole === "Co-Leader") && isUpcoming && pendingRequests.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                    Pending Requests ({pendingRequests.length})
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {pendingRequests.map((req) => {
                    const reqUserId =
                      req.userId?._id ||
                      req.userId?.id ||
                      (typeof req.userId === "string" ? req.userId : null);

                    return (
                      <div
                        key={req._id}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getAvatar(req.userId)}
                            alt={req.userId?.name || "Traveler"}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {req.userId?.name || "Traveler"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Rating {req.userId?.rating || "4.8"}
                            </span>
                          </div>
                        </div>

                        {req.message && (
                          <p className="text-xs text-slate-600 bg-white border border-slate-200/60 p-2 rounded-lg leading-relaxed italic">
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleManageRequest(req._id, "Approved")}
                            className="flex-1 py-1.5 font-semibold text-xs rounded-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleManageRequest(req._id, "Rejected")}
                            className="flex-1 py-1.5 font-semibold text-xs rounded-lg transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* =========================================================================
            GROUNDING BOTTOM SECTION: VERIFIED TRAVEL ASSURANCE
            ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider font-heading">
                  Go YatriGo Travel Assurance
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
                Explore with confidence, connect safely, and travel together.
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium self-start sm:self-auto border border-white/15">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Community Protected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-4 h-4" />
                <h5 className="text-xs font-bold text-white">Verified Travelers</h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hosts and companions complete community profile and credibility checks.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-400">
                <Lock className="w-4 h-4" />
                <h5 className="text-xs font-bold text-white">Private Coordination</h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Group chats and logistical workspaces are secured and reserved for confirmed members.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h5 className="text-xs font-bold text-white">Emergency Support</h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant SOS emergency contact sharing and responsive travel support.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-400">
                <Compass className="w-4 h-4" />
                <h5 className="text-xs font-bold text-white">Transparent Plans</h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear itinerary checkpoints, capacity guidelines, and respectful cancellations.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          MODALS & DIALOGS
          ========================================================================= */}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-150 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Confirmed Travelers ({memberCount})
                </h3>
                <p className="text-xs text-slate-500">All adventurers confirmed for this journey</p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search member name..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-brand transition-all"
            />

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredMembers.map((memberObj) => {
                const mUser = memberObj.user || {};
                const mId = (mUser._id || mUser.id)?.toString();
                return (
                  <div
                    key={mId}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between border border-slate-150"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatar(mUser)}
                        alt={mUser.name || "Member"}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">{mUser.name || "Traveler"}</span>
                          {memberObj.standardRole === "Host" && (
                            <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.2 rounded-full border border-amber-200">
                              Host
                            </span>
                          )}
                          {memberObj.standardRole === "Co-Leader" && (
                            <span className="bg-sky-50 text-sky-700 text-[9px] font-bold px-2 py-0.2 rounded-full border border-sky-200">
                              Co-Leader
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Star className={`w-3 h-3 ${Number(mUser?.rating) > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                          <span>{Number(mUser?.rating) > 0 ? mUser.rating : "New Traveler"}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowMembersModal(false);
                        navigate(`/profile/${mId}`);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Warning Modal */}
      {manageAction?.type === "warn" && (
        <SendWarningModal
          isOpen={true}
          targetMember={{
            userId: manageAction.memberId,
            name: manageAction.memberName
          }}
          journeyId={id}
          isBuddyTrip={true}
          onClose={() => setManageAction(null)}
          onSuccess={() => {
            setManageAction(null);
            fetchTripDetails();
          }}
        />
      )}

      {/* Host Member Actions Modal (Ban, Remove, Promote) */}
      {manageAction && manageAction.type !== "warn" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-150 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <AlertTriangle
                className={`w-5 h-5 ${
                  manageAction.type === "remove" || manageAction.type === "ban"
                    ? "text-rose-500"
                    : "text-amber-500"
                }`}
              />
              {manageAction.type === "ban"
                ? "Ban User"
                : manageAction.type === "remove"
                ? "Remove Member"
                : "Change Role"}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {manageAction.type === "remove" &&
                `Are you sure you want to remove ${manageAction.memberName}? They will lose access to the group chat.`}
              {manageAction.type === "ban" &&
                `Are you sure you want to permanently ban ${manageAction.memberName}? They will not be able to rejoin.`}
              {manageAction.type === "promote" &&
                `Update the group role for ${manageAction.memberName}.`}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setManageAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleManageMember}
                className={`px-4 py-2 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
                  manageAction.type === "remove" || manageAction.type === "ban"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-brand hover:bg-brand-dark"
                }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Leave Trip Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-150 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Leave this journey?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You will lose access to the group chat, announcements, and planning itinerary.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveTrip}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Leave Trip
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Trip Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-150 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Cancel this travel group?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. All joined members will receive an update and the group will be archived.
            </p>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 placeholder:text-slate-400 resize-none h-24"
              placeholder="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Keep Group
              </button>
              <button
                onClick={handleCancelTrip}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Cancel Trip
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Join Request Modal */}
      {showCancelJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-150 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Withdraw Join Request?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your pending join request for this journey?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={cancellingRequest}
                onClick={() => setShowCancelJoinModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                disabled={cancellingRequest}
                onClick={handleCancelJoinRequest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {cancellingRequest ? "Cancelling..." : "Withdraw"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ isOpen: false })}
          targetId={trip._id}
          targetType="group"
          reportedUserId={trip.creator?._id || trip.creator}
        />
      )}

      {/* Overlap Conflict Modal */}
      <TripOverlapConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflictType={overlapConflict.conflictType || "ACTIVE_JOURNEY_CONFLICT"}
        conflictingTrip={overlapConflict.conflictingTrip}
        currentTrip={trip}
        customMessage={overlapConflict.message}
      />
    </div>
  );
};

export default TravelBuddyDetails;
