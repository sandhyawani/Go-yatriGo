import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MapPin, Calendar, ArrowLeft, MessageSquare, MoreVertical, AlertTriangle, UserCheck, UserPlus, ShieldCheck, Clock, Lock, Globe, BookOpen, Award, Star, ShieldAlert, AlertCircle } from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import { getJourneyLifecycle, getEligibilityErrorMessage, getNormalizedMembers, checkIsJourneyMember, checkTripOverlapConflict } from "../../utils/journeyLifecycle";
import ReportModal from "../../components/modals/ReportModal";
import SendWarningModal from "../../components/journey/SendWarningModal";
import TripOverlapConflictModal from "../../components/journey/TripOverlapConflictModal";
import TripOverlapConflictBanner from "../../components/journey/TripOverlapConflictBanner";

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
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
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

  const latestFetchIdRef = useRef(id);

  useEffect(() => {
    // Reset journey-scoped request and conflict state immediately on ID or user switch
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

      // Guard against race conditions when user quickly navigates between journeys
      if (latestFetchIdRef.current !== targetId) return;

      const fetchedTrip = res.data.trip;
      setTrip(fetchedTrip);

      // Once authoritative fresh API state arrives, clear temporary optimistic local override
      setLocalJoinRequestStatus(null);

      // Check if current user is actively participating in another journey that overlaps with this trip
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
      showToast.error("Please login to save groups");
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
        likesCount: updatedLikes.length,
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
            likesCount: updatedLikes.length,
          };
        });
        showToast.success(
          isLikedNow ? "You felt this vibe!" : "Removed from Felt Vibes"
        );
      }
    } catch (err) {
      setTrip(prevTripSnapshot);
      showToast.error(err.response?.data?.message || "Failed to update reaction");
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
      <div className="bg-[#FAFAFA] text-slate-800 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>);

  }

  if (!trip) return null;

  // Single authoritative source of lifecycle state
  const lifecycle = getJourneyLifecycle(trip);
  const isOngoing = lifecycle.isOngoing;
  const isUpcoming = lifecycle.isUpcoming || lifecycle.isPlanning;
  const isCompleted = lifecycle.isCompleted;
  const isCancelled = lifecycle.isCancelled || trip.status === "cancelled";

  // Single authoritative source of membership
  const normalizedMembers = getNormalizedMembers(trip);
  const memberCount = normalizedMembers.length;
  const rawMax = trip.maxMembers || trip.maxCompanions || 8;
  const maxMembers = Math.max(memberCount, rawMax > 20 ? 8 : rawMax);
  const slotsOpen = Math.max(0, maxMembers - memberCount);

  const currentUserId = (user?._id || user?.id || "").toString();
  const isHost = user && ((trip.host?._id || trip.host || trip.creator?._id || trip.creator)?.toString() === currentUserId);
  const isMember = user && checkIsJourneyMember(trip, user);

  const myMemberObj = normalizedMembers.find(
    (m) => (m.user?._id || m.user?.id || m.user)?.toString() === currentUserId
  );
  const myStandardRole = isHost ? "Host" : (myMemberObj?.standardRole || "Member");

  // Single authoritative request status state machine:
  // Priority:
  // 1. Current membership -> "accepted"
  // 2. Fresh trip.joinRequestStatus from backend -> authoritative
  // 3. trip.joinRequests array (for current user) -> fallback
  // 4. localJoinRequestStatus -> temporary optimistic state while waiting for API refresh
  const getDerivedRequestStatus = () => {
    if (!user) return "none";
    if (isMember) return "accepted";

    // 2. Fresh backend trip.joinRequestStatus (authoritative)
    if (trip.joinRequestStatus !== undefined && trip.joinRequestStatus !== null) {
      const s = String(trip.joinRequestStatus).toLowerCase();
      if (s === "pending") return "pending";
      if (s === "approved" || s === "accepted") return "accepted";
      if (s === "rejected") return "rejected";
      if (s === "cancelled") return "none";
    }

    // 3. Fallback to trip.joinRequests if present
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

    // 4. Temporary optimistic local state
    if (localJoinRequestStatus) return localJoinRequestStatus;

    return "none";
  };

  const requestStatus = getDerivedRequestStatus();
  const isPending = !isMember && requestStatus === "pending";
  const isApproved = isMember || requestStatus === "accepted";
  const isRejected = !isMember && requestStatus === "rejected";

  const showChat = isMember;
  const routeFrom = trip.from || trip.startLocation || "Anywhere";
  const pendingRequests = trip.joinRequests?.filter((r) => r.status === "Pending") || [];
  const hasFelt = trip.likes?.some(
    (likeId) => likeId?.toString() === currentUserId
  );


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
  }) +
  ` · ${tripDuration} ${tripDuration === 1 ? "day" : "days"}`;

  const getAvatar = (usr) => {
    return getAvatarUrl(usr?.pic, usr?.img, usr?.name);
  };

  return (
    <div className="bg-[#FAFAFA] text-[#1E293B] pt-4 sm:pt-5 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        {}
        <div className="flex justify-between items-center gap-3 mb-4">
          <button
          onClick={() => navigate("/social/buddy")}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1E293B] font-black text-sm font-medium transition-colors">

            <ArrowLeft className="w-4 h-4" />{" "}
            <span
            className="hidden sm:inline"
            aria-label="Go back to groups list">

              Back to groups
            </span>
          </button>

          <div className="flex items-center gap-2">
            {isHost &&
            <button
            onClick={() => setShowCancelModal(true)}
            disabled={trip.status === "cancelled"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border font-semibold text-xs transition-all rounded-xl ${trip.status === "cancelled" ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"}`}>

                Cancel Group
              </button>}

            <button
            onClick={handleFelt}
            aria-label={hasFelt ? "Remove Felt reaction" : "Felt This"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-medium text-sm transition-all ${hasFelt ? "bg-[#FAFAFA] border-[#E5E7EB] text-[#1E293B] hover:bg-slate-50" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>

              <span
              className={`text-[14px] leading-none transition-all duration-300 ${hasFelt ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}`}>

                ✨
              </span>
              {hasFelt ? "Felt This!" : "Felt This"}
            </button>
          </div>
        </div>

        {overlapConflict.hasConflict && !isMember && isUpcoming && (
          <div className="mb-4">
            <TripOverlapConflictBanner
              conflictType={overlapConflict.conflictType}
              customMessage={overlapConflict.message}
              onOpenDetails={() => setIsConflictModalOpen(true)}
            />
          </div>
        )}

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {}
          <div className="lg:col-span-8 space-y-4">
            {}
            <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

              {/* Hero Image Section */}
              <div className="w-full h-48 sm:h-56 bg-slate-200 relative">
                {trip.coverImage ? (
                  <>
                    {!imgLoaded && !imgError && (
                      <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                    )}
                    <img
                      src={trip.coverImage}
                      alt={`${trip.title} group cover photo`}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgError(true)}
                      className={`w-full h-full object-cover transition-opacity ${
                        imgLoaded ? "opacity-100" : "opacity-0"
                      } ${imgError ? "hidden" : ""}`}
                    />
                    {imgError && (
                      <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-[#AFA9EC]" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#7C3AED]/20 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-[#7C3AED]/40" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-md font-heading">
                    {trip.title}
                  </h1>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#7C3AED]/10 border border-[#7C3AED]/15 text-[#7C3AED] text-[10px] font-black px-2.5 py-1 rounded-full">
                      {trip.category || "Adventure"}
                    </span>

                    {isCancelled ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700" role="status">
                        Trip Cancelled
                      </span>
                    ) : isOngoing ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5" role="status">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Journey in Progress
                      </span>
                    ) : isCompleted ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600" role="status">
                        Journey Complete
                      </span>
                    ) : (
                      <>
                        {trip.isPrivate ? (
                          <span className="bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-600" /> Approval Required
                          </span>
                        ) : (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <Globe className="w-3 h-3 text-emerald-600" /> Open Group
                          </span>
                        )}
                        <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
                          {lifecycle.status}
                        </span>
                      </>
                    )}
                  </div>

                  {isUpcoming && (
                    <span
                      className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl"
                      aria-live="polite"
                    >
                      {slotsOpen > 0 ? `${slotsOpen} ${slotsOpen === 1 ? "spot" : "spots"} remaining` : "Group full"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#FF5A7A] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-slate-500 block mb-0.5">
                        Route
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#7C3AED] truncate">
                          {routeFrom}
                        </span>
                        <span className="text-slate-400 text-[10px]">to</span>
                        <span className="text-[#FF5A7A] truncate">
                          {trip.destination}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-black text-slate-500 block mb-0.5">
                        Dates
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-black text-slate-500 block mb-0.5">
                        Members
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {memberCount} / {maxMembers} travelers
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-500 mb-2">
                    About Trip
                  </h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                    {trip.description}
                  </p>
                </div>

                {trip.tags && trip.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trip.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#EEEDFE] text-[#534AB7] rounded-full px-3 py-1 text-[13px] lowercase"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Group Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center gap-2 border-b border-slate-100">
                <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">Group Chat</h3>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5">
                {showChat ? (
                  <div className="space-y-3">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F7FF] border border-[#E9E7FD]">
                      <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 text-[#7C3AED]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#1E293B] leading-snug">You're in the group</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                          Coordinate plans, updates and check-ins with your travel companions.
                        </p>
                      </div>
                    </div>

                    {/* Action buttons — equal height, equal weight side by side */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                      <button
                        onClick={() => handleOpenJourneyWorkspace(false)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#7C3AED] bg-white border border-[#7C3AED]/30 hover:bg-[#F8F7FF] hover:border-[#7C3AED]/60 transition-all duration-200 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        Open Journey Hub
                      </button>
                      <button
                        onClick={() => handleOpenJourneyWorkspace(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        Open Group Chat
                      </button>
                    </div>

                    {/* Leave group — tertiary, below the primary actions */}
                    {!isHost && isUpcoming && (
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200"
                      >
                        Leave Group
                      </button>
                    )}
                  </div>
                ) : isPending ? (
                  <div className="flex flex-col items-center gap-2 py-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1E293B]">Join request pending</h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      You'll get access after the host approves your request.
                    </p>
                  </div>
                ) : isOngoing ? (
                  <div className="flex flex-col items-center gap-2 py-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1E293B]">Group chat is private</h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      This journey is in progress. Group chat is exclusive to active members.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1E293B]">Group chat is private</h4>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Join this journey to access the group chat.
                    </p>
                  </div>
                )}
              </div>

              {/* Cancellation reason footer */}
              {isCancelled && trip.cancellationReason && (
                <div className="px-4 sm:px-5 py-3.5 bg-rose-50 border-t border-rose-100">
                  <span className="text-[10px] font-black text-rose-600 block mb-1 uppercase tracking-wide">
                    Reason for Cancellation
                  </span>
                  <p className="text-xs font-medium text-rose-700">"{trip.cancellationReason}"</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Host Profile Card */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#7C3AED]" /> Journey Host
              </h3>

              <div className="flex items-center gap-3">
                <img
                  onClick={() => navigate(`/profile/${trip.host?._id}`)}
                  src={getAvatar(trip.host)}
                  alt={trip.host?.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                />

                <div className="min-w-0 flex-1">
                  <h4
                    onClick={() => navigate(`/profile/${trip.host?._id}`)}
                    className="text-sm font-bold text-[#1E293B] truncate cursor-pointer hover:text-[#7C3AED] transition-colors font-heading"
                  >
                    {trip.host?.name || "Travel Host"}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400 capitalize block font-sans">
                    {trip.host?.type || "Verified Member"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                <div className="bg-[#FAFAFA] p-2 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">
                    Rating
                  </span>
                  <span className="text-xs font-bold text-amber-500 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {trip.host?.rating || "4.6"}
                  </span>
                </div>
                <div className="bg-[#FAFAFA] p-2 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">
                    Hosted
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {trip.host?.completedTrips || 3} trips
                  </span>
                </div>
                <div className="bg-[#FAFAFA] p-2 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">
                    Response
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {trip.host?.hostResponseRate || 100}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/profile/${trip.host?._id}`)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200/60 flex items-center justify-center gap-1 mt-1"
              >
                View Profile
              </button>
            </div>

            {/* Participation / Join Status Card (Non-Host) */}
            {!isHost && (
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isMember ? "Your Status" : "Join this trip"}
                  </h3>
                  {isUpcoming && !isMember && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {slotsOpen > 0 ? `${slotsOpen} ${slotsOpen === 1 ? "spot" : "spots"} remaining` : "Group full"}
                    </span>
                  )}
                </div>

                {isOngoing ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block text-emerald-900">Journey in Progress</span>
                      <span className="text-[11px] text-emerald-700/90 leading-tight block mt-0.5">
                        This journey has started and is no longer accepting new travelers.
                      </span>
                    </div>
                  </div>
                ) : isCompleted || isCancelled ? (
                  <div className="bg-slate-50 border border-slate-200 text-slate-600 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {isCancelled ? "This journey was cancelled." : "This journey has been completed."}
                    </span>
                  </div>
                ) : isMember ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-900">
                          {myStandardRole === "Co-Leader" ? "Co-Leader" : "Active Member"}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Joined ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium px-1">
                      You're a member of this journey.
                    </p>
                  </div>
                ) : isPending ? (
                  <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Request Pending ✓</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
                      Your request is waiting for the host's approval.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCancelJoinModal(true)}
                      disabled={cancellingRequest}
                      className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {cancellingRequest ? "Cancelling..." : "Cancel Request"}
                    </button>
                  </div>
                ) : slotsOpen <= 0 ? (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Group Full. This trip is no longer accepting new members.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendRequest} className="space-y-3">
                    {isRejected && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Your previous request was declined. You can submit a new introduction below.</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Introduce yourself:
                      </label>
                      <textarea
                        placeholder="Describe your travel style, why you want to join..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        disabled={submittingRequest}
                        className="w-full bg-[#FAFAFA] border border-slate-200 rounded-xl p-3 text-slate-800 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all resize-none h-20 shadow-inner disabled:opacity-60"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingRequest || !user}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />{" "}
                      {submittingRequest ? "Submitting..." : "Request to Join"}
                    </button>
                    {overlapConflict.hasConflict && (
                      <button
                        type="button"
                        onClick={() => setIsConflictModalOpen(true)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center justify-center gap-1 mt-1.5 w-full text-center"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Schedule conflict note — View details
                      </button>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Pending Requests for Host & Co-Leaders (Upcoming Only) */}
            {(isHost || myStandardRole === "Co-Leader") && isUpcoming && (
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 border-b border-slate-100 pb-2">
                  Pending Requests ({pendingRequests.length})
                </h3>

                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold py-3 text-center">
                      No pending requests.
                    </p>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={getAvatar(req.userId)}
                            alt={req.userId?.name}
                            className="w-8 h-8 rounded-lg object-cover border border-white shadow-sm"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-black text-[#1E293B] block truncate">
                              {req.userId?.name || "Traveler"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold">
                              Rating {req.userId?.rating || "4.6"}
                            </span>
                          </div>
                        </div>
                        {req.message && (
                          <p className="text-[11px] text-slate-500 italic bg-white border border-slate-100 p-2 rounded-lg leading-relaxed">
                            "{req.message}"
                          </p>
                        )}
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => handleManageRequest(req._id, "Approved")}
                            disabled={isCancelled}
                            className={`flex-1 py-1.5 font-extrabold text-[9px] rounded-lg transition-all ${
                              isCancelled
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleManageRequest(req._id, "Rejected")}
                            disabled={isCancelled}
                            className={`flex-1 py-1.5 font-extrabold text-[9px] rounded-lg transition-all border ${
                              isCancelled
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Standardized Members List Card */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Members ({memberCount})
                </h3>
                {isUpcoming && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {slotsOpen > 0 ? `${slotsOpen} spots left` : "Full"}
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 pb-1">
                {normalizedMembers.map((memberObj) => {
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
                      className="bg-[#FAFAFA] dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            onClick={() => navigate(`/profile/${mId}`)}
                            src={getAvatar(mUser)}
                            alt={mUser.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer shrink-0"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                onClick={() => navigate(`/profile/${mId}`)}
                                className="text-xs font-bold text-[#1E293B] dark:text-slate-100 leading-tight truncate cursor-pointer hover:text-[#7C3AED]"
                              >
                                {mUser.name || "User"}
                              </h4>
                              {memberObj.standardRole === "Host" ? (
                                <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Award className="w-2.5 h-2.5 text-amber-500" /> Host
                                </span>
                              ) : memberObj.standardRole === "Co-Leader" ? (
                                <span className="bg-purple-50 border border-purple-200 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5 text-purple-500" /> Co-Leader
                                </span>
                              ) : (
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[8px] font-black px-1.5 py-0.5 rounded">
                                  Member
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block">
                              Rating {mUser.rating || "4.5"}
                            </span>
                          </div>
                        </div>

                        {canManage && (
                          <button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === mId ? null : mId
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                            title="Manage Member"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {canManage && openDropdownId === mId && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-1 animate-fade-in text-[11px] font-semibold">
                          {/* Send Warning (Always available to Host & Co-Leader) */}
                          <button
                            onClick={() => {
                              setManageAction({
                                type: "warn",
                                memberId: mId,
                                memberName: mUser.name
                              });
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-2 transition-colors font-bold"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Send Warning</span>
                          </button>

                          {/* Promote/Demote Co-Leader (Host only) */}
                          {isHost && (
                            <button
                              onClick={() => {
                                setManageAction({
                                  type: "promote",
                                  memberId: mId,
                                  memberName: mUser.name
                                });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 transition-colors"
                            >
                              <Award className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                              <span>{memberObj.standardRole === "Co-Leader" ? "Demote to Member" : "Make Co-Leader"}</span>
                            </button>
                          )}

                          {/* Remove Member (Host only, Upcoming only — Roster locked on Ongoing) */}
                          {isHost && isUpcoming && (
                            <button
                              onClick={() => {
                                setManageAction({
                                  type: "remove",
                                  memberId: mId,
                                  memberName: mUser.name
                                });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center gap-2 transition-colors font-bold"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>Remove Member</span>
                            </button>
                          )}

                          {/* Ban User (Host only) */}
                          {isHost && (
                            <button
                              onClick={() => {
                                setManageAction({
                                  type: "ban",
                                  memberId: mId,
                                  memberName: mUser.name
                                });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 dark:hover:bg-rose-900/60 flex items-center gap-2 transition-colors font-black"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Ban User</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Action Modals */}
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

      {manageAction && manageAction.type !== "warn" &&
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">

            <h3 className="text-xl font-black text-[#1E293B] mb-2 flex items-center gap-2">
              <AlertTriangle
            className={`w-5 h-5 ${manageAction.type === "remove" || manageAction.type === "ban" ? "text-rose-500" : "text-amber-500"}`} />

              {manageAction.type === "ban" ?
            "Ban User" :
            manageAction.type === "remove" ?
            "Remove Member" :
            "Change Role"}
            </h3>

            <p className="text-xs font-semibold text-slate-500 mb-4">
              {manageAction.type === "remove" &&
            `Are you sure you want to remove ${manageAction.memberName}? They will lose access to the group chat.`}
              {manageAction.type === "ban" &&
            `Are you sure you want to permanently ban ${manageAction.memberName}? They will not be able to rejoin.`}
              {manageAction.type === "promote" &&
            `Change the role of ${manageAction.memberName}.`}
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
            onClick={() => {
              setManageAction(null);
            }}
            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">

                Cancel
              </button>
              <button
            onClick={handleManageMember}
            className={`px-4 py-2 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 ${manageAction.type === "remove" || manageAction.type === "ban" ? "bg-rose-500 hover:bg-rose-600" : "bg-brand-600 hover:bg-brand-700"}`}>

                Confirm
              </button>
            </div>
          </motion.div>
        </div>}


      {showLeaveModal &&
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-[#1E293B] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Leave this trip?
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
              You'll lose access to the group chat and journey updates.
            </p>
            <div className="flex justify-end gap-3">
              <button
            onClick={() => setShowLeaveModal(false)}
            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors">

                Cancel
              </button>
              <button
            onClick={handleLeaveTrip}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95">

                Leave Trip
              </button>
            </div>
          </div>
        </div>}


      {showCancelModal &&
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-black text-[#1E293B] mb-2">
              Cancel this trip?
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              This action cannot be undone. Joined members will be notified.
            </p>
            <textarea
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-[#1E293B] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 placeholder:text-slate-400 resize-none h-24 mb-4"
          placeholder="Reason for cancellation (optional)"
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)} />

            <div className="flex justify-end gap-3">
              <button
            onClick={() => setShowCancelModal(false)}
            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">

                Keep Group
              </button>
              <button
            onClick={handleCancelTrip}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95">

                Cancel Trip
              </button>
            </div>
          </div>
        </div>}


      {showCancelJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-black text-[#1E293B] mb-2">
              Cancel Join Request?
            </h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">
              Are you sure you want to cancel your join request for this trip?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={cancellingRequest}
                onClick={() => setShowCancelJoinModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
              >
                Keep Request
              </button>
              <button
                type="button"
                disabled={cancellingRequest}
                onClick={handleCancelJoinRequest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {cancellingRequest ? "Cancelling..." : "Cancel Request"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showMembersModal &&
      <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowMembersModal(false)}>

          <div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

            <h3 className="text-xl font-bold text-[#1E293B] mb-4">
              All Members
            </h3>
            <div className="space-y-4">
              {trip.members?.map((memberObj) => {
              const mUser = memberObj.user || {};
              if (!mUser._id) return null;
              const mId = mUser._id.toString();
              return (
                <div
                key={mId}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">

                    <img
                  src={getAvatar(mUser)}
                  alt={mUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#1E293B] truncate">
                          {mUser.name || "User"}
                        </h4>
                        {memberObj.role === "host" &&
                      <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Host
                          </span>}

                      </div>
                      <span className="text-xs text-slate-500">
                        Rating {mUser.rating || "4.5"} &middot; Joined recently
                      </span>
                    </div>
                  </div>);

            })}
            </div>
          </div>
        </div>}


      {reportModal.isOpen &&
      <ReportModal
      isOpen={reportModal.isOpen}
      onClose={() => setReportModal({ isOpen: false })}
      targetId={trip._id}
      targetType="group"
      reportedUserId={trip.creator?._id || trip.creator} />}

      <TripOverlapConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflictType={overlapConflict.conflictType || "ACTIVE_JOURNEY_CONFLICT"}
        conflictingTrip={overlapConflict.conflictingTrip}
        currentTrip={trip}
        customMessage={overlapConflict.message}
      />


    </div>);

};

export default TravelBuddyDetails;