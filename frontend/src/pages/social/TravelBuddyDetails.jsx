import React, { useState, useEffect, useContext } from "react";
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
  Globe,
  Heart,
  Award,
  Star,
  ShieldAlert,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import ReportModal from "../../components/modals/ReportModal";

const TravelBuddyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [trip, setTrip] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCancelJoinModal, setShowCancelJoinModal] = useState(false);

  const [manageAction, setManageAction] = useState(null); // { type: 'remove'|'ban'|'promote'|'warn', memberId, memberName }
  const [warningMsg, setWarningMsg] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const res = await axios.get(`/social/buddy/${id}`, {
        withCredentials: true,
      });
      setTrip(res.data.trip);
    } catch (err) {
      showToast.error("Failed to load group details");
      navigate("/social/buddy");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast.error("Please login to submit join requests");
      navigate("/login");
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await axios.post(
        `/social/buddy/join-request/${id}`,
        { message: requestMessage },
        { withCredentials: true },
      );
      setRequestMessage("");
      showToast.success(res.data.message || "Request submitted successfully!");
      await fetchTripDetails();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Submit failed";
      showToast.error(errorMsg);
      if (errorMsg === "You are already a member of this group") {
        await fetchTripDetails();
      }
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleManageRequest = async (requestId, status) => {
    try {
      await axios.post(
        `/social/buddy/manage-request/${id}`,
        { requestId, status },
        { withCredentials: true },
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
          { withCredentials: true },
        );
        showToast.success("Warning sent");
      } else if (type === "ban") {
        await axios.post(
          `/social/buddy-trips/${id}/ban/${memberId}`,
          {},
          { withCredentials: true },
        );
        showToast.success("User banned");
      } else if (type === "remove") {
        await axios.delete(`/social/buddy-trips/${id}/member/${memberId}`, {
          withCredentials: true,
        });
        showToast.success("Member removed");
      } else if (type === "promote") {
        await axios.post(
          `/social/buddy-trips/${id}/promote/${memberId}`,
          {},
          { withCredentials: true },
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
        { withCredentials: true },
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
        { withCredentials: true },
      );
      showToast.success("Travel group cancelled");
      setTrip((prev) => ({
        ...prev,
        status: "cancelled",
        lifecycleStatus: "cancelled",
      }));
      setShowCancelModal(false);
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to cancel group");
    }
  };

  const handleLike = async () => {
    if (!user) {
      showToast.error("Please login to save groups");
      return;
    }

    try {
      const res = await axios.post(
        `/social/buddy/like/${id}`,
        {},
        { withCredentials: true },
      );
      setTrip((prev) => ({
        ...prev,
        likes: res.data.isLiked
          ? [...(prev.likes || []), user._id]
          : (prev.likes || []).filter(
              (lid) => lid?.toString() !== user._id?.toString(),
            ),
      }));
      showToast.success(
        res.data.isLiked ? "You felt this vibe!" : "Removed from Felt Vibes",
      );
    } catch (err) {
      showToast.error("Action failed");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAFAFA] text-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!trip) return null;

  const currentUserId = (user?._id || user?.id || "").toString();
  const isHost =
    user && (trip.userId?._id || trip.userId)?.toString() === currentUserId;
  const myMemberObj = trip?.members?.find(
    (m) => (m?.user?._id || m?.user)?.toString() === currentUserId,
  );
  const myRole = isHost ? "host" : myMemberObj?.role || "member";
  const isCompanion =
    user &&
    (trip.companions?.some(
      (c) => (c?._id || c)?.toString() === currentUserId,
    ) ||
      trip.members?.some((m) => (m?._id || m)?.toString() === currentUserId));
  const userRequest =
    user &&
    trip.joinRequests?.find(
      (r) => (r?.userId?._id || r?.userId)?.toString() === currentUserId,
    );
  const isPending = userRequest && userRequest.status === "Pending";
  const isApproved = userRequest && userRequest.status === "Approved";
  const isRejected = userRequest && userRequest.status === "Rejected";

  const showChat = isHost || isCompanion || isApproved;
  const routeFrom = trip.from || trip.startLocation || "Anywhere";
  const maxMembers = trip.maxMembers || trip.maxCompanions || 0;
  const memberCount = (trip.companions?.length || 0) + 1;
  const slotsOpen = Math.max(0, maxMembers - memberCount);
  const pendingRequests =
    trip.joinRequests?.filter((r) => r.status === "Pending") || [];
  const hasFelt = trip.likes?.some(
    (likeId) => likeId?.toString() === currentUserId,
  );

  const formattedDate =
    new Date(trip.startDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }) +
    " \u2013 " +
    new Date(trip.endDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  const tripDuration = Math.ceil(
    (new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24),
  );

  const getAvatar = (usr) => {
    return getAvatarUrl(usr?.pic, usr?.img, usr?.name);
  };

  return (
    <div className="bg-[#FAFAFA] text-[#111827] pt-4 sm:pt-5 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        {/* Back and Title Navigation */}
        <div className="flex justify-between items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/social/buddy")}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#111827] font-black text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />{" "}
            <span
              className="hidden sm:inline"
              aria-label="Go back to groups list"
            >
              Back to groups
            </span>
          </button>

          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={trip.status === "cancelled"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border font-semibold text-xs transition-all rounded-xl ${trip.status === "cancelled" ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
              >
                Cancel Group
              </button>
            )}
            <button
              onClick={handleLike}
              aria-label={hasFelt ? "Remove Felt reaction" : "Felt This"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-medium text-sm transition-all ${hasFelt ? "bg-[#FAFAFA] border-[#E5E7EB] text-[#111827] hover:bg-slate-50" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <span
                className={`text-[14px] leading-none transition-all duration-300 ${hasFelt ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}`}
              >
                ✨
              </span>
              {hasFelt ? "Felt This!" : "Felt This"}
            </button>
          </div>
        </div>

        {/* 12-Column Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT 8 COLUMNS: Trip Parameters, Chat */}
          <div className="lg:col-span-8 space-y-4">
            {/* Trip Main Information & Hero Cover */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Hero Cover Image */}
              <div className="w-full h-[220px] sm:h-64 bg-slate-200 relative">
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
                      className={`w-full h-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"} ${imgError ? "hidden" : ""}`}
                    />
                    {imgError && (
                      <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-[#AFA9EC]" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#8B5CF6]/20 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-[#8B5CF6]/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                    {trip.title}
                  </h1>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-black px-2.5 py-1 rounded-full">
                      {trip.category}
                    </span>
                    {trip.isPrivate ? (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#FF5A7A]" /> Private
                      </span>
                    ) : (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#8B5CF6]" /> Public
                      </span>
                    )}
                    {trip.status === "cancelled" && (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-100 text-rose-700"
                        role="status"
                      >
                        Cancelled by host
                      </span>
                    )}
                    {trip.lifecycleStatus && trip.status !== "cancelled" && (
                      <span
                        role="status"
                        className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full ${
                          trip.lifecycleStatus === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : trip.lifecycleStatus === "upcoming"
                              ? "bg-blue-100 text-blue-700"
                              : trip.lifecycleStatus === "completed"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {trip.lifecycleStatus}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-medium text-emerald-600"
                    aria-live="polite"
                  >
                    {slotsOpen > 0 ? `${slotsOpen} slots open` : "Group full"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#FF5A7A] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-slate-500 block mb-0.5">
                        Route
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#8B5CF6] truncate">
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
                    <Calendar className="w-4 h-4 text-[#8B5CF6] mt-0.5 shrink-0" />
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
                        {memberCount} of {maxMembers || "many"} joined
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

                {/* Tags Display */}
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

            {/* CHAT / DISCUSSION BOARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4"
            >
              <h3 className="text-sm font-medium text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-[#8B5CF6]" /> Group Chat
              </h3>

              {showChat ? (
                <div className="bg-[#FAFAFA] p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-[#111827]">
                      You have access to this group chat.
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Open messages to coordinate plans, meetups, and updates
                      with the group.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {!isHost && (
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl text-[10px] font-black transition-all border border-rose-200"
                      >
                        Leave Group
                      </button>
                    )}
                    <button
                      onClick={() =>
                        navigate("/social/chat", {
                          state: { groupId: trip._id },
                        })
                      }
                      className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl text-[10px] font-black transition-all shadow-sm"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAFAFA] p-6 rounded-xl border border-slate-100 text-center space-y-2">
                  <Lock className="w-7 h-7 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-black text-[#111827]">
                    Chat Access Locked
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Request to join this group and wait for host approval to
                    enter the chat.
                  </p>
                </div>
              )}

              {trip.status === "cancelled" && trip.cancellationReason && (
                <div className="p-4 sm:p-5 bg-rose-50 border-t border-rose-100 text-rose-700 text-xs font-semibold">
                  <span className="font-black text-[10px] block mb-1">
                    Reason for Cancellation
                  </span>
                  "{trip.cancellationReason}"
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT 4 COLUMNS: Sidebar Actions, Host Request Manager, Companion Profiles */}
          <div className="lg:col-span-4 space-y-4">
            {/* Host Profile Info Card */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#FF5A7A]" /> Host
              </h3>

              <div className="flex items-center gap-3">
                <img
                  onClick={() => navigate(`/profile/${trip.userId?._id}`)}
                  src={getAvatar(trip.userId)}
                  alt={trip.userId?.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4
                      onClick={() => navigate(`/profile/${trip.userId?._id}`)}
                      className="text-sm font-black text-[#111827] truncate cursor-pointer hover:text-[#8B5CF6] transition-colors"
                    >
                      {trip.userId?.name || "Traveler"}
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-[#8B5CF6] capitalize">
                    {trip.userId?.type || "Traveler"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-2">
                <div className="bg-[#FAFAFA] p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-medium text-slate-400 block mb-0.5">
                    Rating
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-0.5 text-amber-500">
                    <Star
                      className="w-3.5 h-3.5 fill-amber-500"
                      aria-hidden="true"
                    />{" "}
                    <span className="sr-only">Rating</span>{" "}
                    {trip.userId?.rating || "4.6"}
                  </span>
                </div>
                <div className="bg-[#FAFAFA] p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 block mb-0.5">
                    Trips
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {trip.userId?.completedTrips || 0} hosted
                  </span>
                </div>
              </div>

              <div className="bg-[#FAFAFA] p-2.5 rounded-xl border border-slate-100 text-center mt-2">
                <span className="text-[8px] font-black text-slate-400 block mb-0.5">
                  Response Rate
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {trip.userId?.hostResponseRate || 100}%
                </span>
              </div>

              {trip.userId?.interests && trip.userId.interests.length > 0 && (
                <div className="pt-2">
                  <span className="text-[8px] font-medium text-slate-400 block mb-1.5">
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {trip.userId.interests?.map((interest) => (
                      <span
                        key={interest}
                        className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[8px] font-bold text-slate-500 shadow-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Panel / Booking Request Form */}
            {!isHost && (
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2">
                  Join group
                </h3>

                {isCompanion || isApproved ? (
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full py-2.5 bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-xl font-black text-[10px] shadow-sm flex items-center justify-center gap-1.5 opacity-100 cursor-default"
                    >
                      <UserCheck className="w-4 h-4" /> Joined
                    </button>
                  </div>
                ) : isPending ? (
                  <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Your join request is pending approval from the host.
                    </span>
                  </div>
                ) : trip.lifecycleStatus === "completed" ||
                  trip.lifecycleStatus === "cancelled" ? (
                  <div className="bg-slate-50 border border-slate-100 text-slate-500 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      This group is no longer active and cannot be joined.
                    </span>
                  </div>
                ) : trip.status === "full" ? (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>
                      This group is full and is no longer accepting new members.
                    </span>
                  </div>
                ) : isRejected ? (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <Lock className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>Your join request was declined by the host.</span>
                  </div>
                ) : trip.isPrivate ? (
                  <form onSubmit={handleSendRequest} className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Submit a message to introduce yourself to the host:
                    </p>
                    <textarea
                      placeholder="Describe your interests, why you want to join..."
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-slate-200 rounded-xl p-3 text-slate-800 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all resize-none h-20 shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />{" "}
                      {submittingRequest ? "Submitting..." : "Request to Join"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSendRequest} className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      This is a public group. You can join instantly without
                      approval.
                    </p>
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />{" "}
                      {submittingRequest ? "Joining..." : "Join Group"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Host Join Request Manager (Visible ONLY to the host) */}
            {isHost && (
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
                            <span className="text-xs font-black text-[#111827] block truncate">
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
                            onClick={() =>
                              handleManageRequest(req._id, "Approved")
                            }
                            disabled={trip.status === "cancelled"}
                            className={`flex-1 py-1.5 font-extrabold text-[9px] rounded-lg transition-all ${trip.status === "cancelled" ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleManageRequest(req._id, "Rejected")
                            }
                            disabled={trip.status === "cancelled"}
                            className={`flex-1 py-1.5 font-extrabold text-[9px] rounded-lg transition-all border ${trip.status === "cancelled" ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"}`}
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

            {/* Group Members Panel */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2">
                Members ({memberCount})
              </h3>

              <div className="space-y-3 max-h-[288px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {trip.members?.map((memberObj) => {
                  const mUser = memberObj.user || {};
                  if (!mUser._id) return null; // safety check
                  const mId = mUser._id.toString();
                  const isTargetHost = memberObj.role === "host";
                  const isMe = mId === currentUserId;
                  const canManage =
                    (myRole === "host" || myRole === "cohost") &&
                    !isMe &&
                    !isTargetHost;

                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 relative group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          onClick={() => navigate(`/profile/${mId}`)}
                          src={getAvatar(mUser)}
                          alt={mUser.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-sm cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4
                              onClick={() => navigate(`/profile/${mId}`)}
                              className="text-xs font-bold text-[#111827] leading-tight truncate cursor-pointer hover:text-brand-600"
                            >
                              {mUser.name || "User"}
                            </h4>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded ${memberObj.role === "host" ? "bg-brand-50 text-brand-600" : memberObj.role === "cohost" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                            >
                              {memberObj.role}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-semibold">
                            Rating {mUser.rating || "4.5"}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === mId ? null : mId,
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === mId && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  setManageAction({
                                    type: "warn",
                                    memberId: mId,
                                    memberName: mUser.name,
                                  });
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 hover:bg-slate-50"
                              >
                                Send Warning
                              </button>
                              {myRole === "host" && (
                                <button
                                  onClick={() => {
                                    setManageAction({
                                      type: "promote",
                                      memberId: mId,
                                      memberName: mUser.name,
                                    });
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-600 hover:bg-slate-50"
                                >
                                  {memberObj.role === "cohost"
                                    ? "Demote to Member"
                                    : "Make Co-host"}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setManageAction({
                                    type: "remove",
                                    memberId: mId,
                                    memberName: mUser.name,
                                  });
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-slate-50 border-t border-slate-100"
                              >
                                Remove Member
                              </button>
                              {myRole === "host" && (
                                <button
                                  onClick={() => {
                                    setManageAction({
                                      type: "ban",
                                      memberId: mId,
                                      memberName: mUser.name,
                                    });
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50"
                                >
                                  Ban User
                                </button>
                              )}
                            </div>
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

      {/* Management Modals */}
      {manageAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <h3 className="text-xl font-black text-[#111827] mb-2 flex items-center gap-2">
              <AlertTriangle
                className={`w-5 h-5 ${manageAction.type === "remove" || manageAction.type === "ban" ? "text-rose-500" : "text-amber-500"}`}
              />
              {manageAction.type === "warn"
                ? "Send Warning"
                : manageAction.type === "ban"
                  ? "Ban User"
                  : manageAction.type === "remove"
                    ? "Remove Member"
                    : "Change Role"}
            </h3>

            <p className="text-xs font-semibold text-slate-500 mb-4">
              {manageAction.type === "warn" &&
                `Send a warning to ${manageAction.memberName}.`}
              {manageAction.type === "remove" &&
                `Are you sure you want to remove ${manageAction.memberName}? They will lose access to the group chat.`}
              {manageAction.type === "ban" &&
                `Are you sure you want to permanently ban ${manageAction.memberName}? They will not be able to rejoin.`}
              {manageAction.type === "promote" &&
                `Change the role of ${manageAction.memberName}.`}
            </p>

            {manageAction.type === "warn" && (
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-[#111827] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 resize-none h-24 mb-4"
                placeholder="Warning message..."
                value={warningMsg}
                onChange={(e) => setWarningMsg(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setManageAction(null);
                  setWarningMsg("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleManageMember}
                className={`px-4 py-2 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 ${manageAction.type === "warn" ? "bg-amber-500 hover:bg-amber-600" : manageAction.type === "remove" || manageAction.type === "ban" ? "bg-rose-500 hover:bg-rose-600" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-black text-[#111827] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Leave Group
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-6">
              Are you sure you want to leave this travel group? You will lose
              access to group chat and trip updates.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveTrip}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-black text-[#111827] mb-2">
              Cancel this trip?
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              This action cannot be undone. Joined members will be notified.
            </p>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-[#111827] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 placeholder:text-slate-400 resize-none h-24 mb-4"
              placeholder="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm"
              >
                Keep Group
              </button>
              <button
                onClick={handleCancelTrip}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
              >
                Cancel Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-bold text-[#111827] mb-2">
              Cancel your join request?
            </h3>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelJoinModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                Keep request
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(
                      `/social/buddy/manage-request/${id}`,
                      { requestId: userRequest._id, status: "Cancelled" },
                      { withCredentials: true },
                    );
                    fetchTripDetails();
                    setShowCancelJoinModal(false);
                  } catch (e) {
                    setShowCancelJoinModal(false);
                    fetchTripDetails();
                  }
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg text-sm shadow-md transition-all active:scale-95"
              >
                Cancel request
              </button>
            </div>
          </div>
        </div>
      )}

      {showMembersModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMembersModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#111827] mb-4">
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
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <img
                      src={getAvatar(mUser)}
                      alt={mUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#111827] truncate">
                          {mUser.name || "User"}
                        </h4>
                        {memberObj.role === "host" && (
                          <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        Rating {mUser.rating || "4.5"} &middot; Joined recently
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ isOpen: false })}
          targetId={trip._id}
          targetType="group"
          reportedUserId={trip.creator?._id || trip.creator}
        />
      )}
    </div>
  );
};

export default TravelBuddyDetails;

