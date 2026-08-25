import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Trash2,
  Clock,
  RefreshCw,
  XCircle,
  Award,
  Crown,
  ChevronDown,
  MessageSquare,
  AlertTriangle
} from "lucide-react";
import axiosInstance from "../../api/axios";
import Avatar from "../common/Avatar";
import { showToast } from "../../utils/showToast";
import { getJourneyLifecycle, getEligibilityErrorMessage } from "../../utils/journeyLifecycle";
import SendWarningModal from "./SendWarningModal";

const JourneyMembers = ({
  journey,
  currentUserId,
  onInviteClick,
  onRemoveMember,
  onRefreshJourney
}) => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [warningTarget, setWarningTarget] = useState(null);

  const lifecycle = getJourneyLifecycle(journey);
  const isOngoing = lifecycle.isOngoing;
  const isUpcoming = lifecycle.isUpcoming || lifecycle.isPlanning;

  const isHost =
    (journey?.creator?._id || journey?.creator)?.toString() === currentUserId?.toString();
  const isCoLeader = journey?.members?.some(
    (m) =>
      (m.user?._id || m.user).toString() === currentUserId?.toString() &&
      (m.role === "Co-Organizer" || m.role === "cohost" || m.role === "Co-Leader")
  );

  const canInvite = isHost && isUpcoming;

  const handleAssignCoLeader = async (targetUserId) => {
    try {
      const res = await axiosInstance.post(
        `/journeys/${journey._id}/co-leader/${targetUserId}`
      );
      if (res.data?.success) {
        showToast.success("Co-leader assigned successfully.");
        setOpenMenuId(null);
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to assign co-leader"));
    }
  };

  const handleRemoveCoLeader = async (targetUserId) => {
    try {
      const res = await axiosInstance.delete(
        `/journeys/${journey._id}/co-leader/${targetUserId}`
      );
      if (res.data?.success) {
        showToast.success("Co-leader removed.");
        setOpenMenuId(null);
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to remove co-leader"));
    }
  };

  const handleLeaveJourney = async () => {
    if (!window.confirm(`Are you sure you want to leave "${journey?.title}"?`)) {
      return;
    }
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/leave`);
      if (res.data?.success) {
        showToast.success("Left journey successfully.");
        if (onRefreshJourney) onRefreshJourney();
        navigate("/social/journeys");
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to leave journey"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const fetchInvitationsAndRequests = () => {
    if (!journey?._id || (!isHost && !isCoLeader) || isOngoing) return;
    setLoadingInvites(true);
    
    Promise.all([
      axiosInstance.get(`/journeys/${journey._id}/invitations`),
      axiosInstance.get(`/journeys/${journey._id}/join-requests`)
    ])
      .then(([invRes, reqRes]) => {
        if (invRes.data?.success) {
          setInvitations(invRes.data.invitations?.filter((i) => i.status === "pending") || []);
        }
        if (reqRes.data?.success) {
          setJoinRequests(reqRes.data.requests?.filter((r) => r.status === "pending") || []);
        }
      })
      .catch((err) => console.error("Error loading pending requests:", err))
      .finally(() => setLoadingInvites(false));
  };

  useEffect(() => {
    fetchInvitationsAndRequests();
  }, [journey, isOngoing]);

  const handleAcceptJoinRequest = async (requestId) => {
    try {
      const res = await axiosInstance.post(`/journeys/join-requests/${requestId}/accept`);
      if (res.data?.success) {
        setJoinRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to accept request"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      const res = await axiosInstance.post(`/journeys/join-requests/${requestId}/reject`);
      if (res.data?.success) {
        setJoinRequests((prev) => prev.filter((r) => r._id !== requestId));
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to reject request"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await axiosInstance.put(
        `/journeys/${journey._id}/members/${targetUserId}/role`,
        { role: newRole }
      );
      if (res.data?.success) {
        if (onRefreshJourney) onRefreshJourney();
        setOpenMenuId(null);
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to update member role"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const handleResendInvite = async (invitationId) => {
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitationId}/resend`
      );
      if (res.data?.success) {
        showToast.success("Invitation resent successfully!");
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to resend invitation"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const handleCancelInvite = async (invitationId) => {
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitationId}/cancel`
      );
      if (res.data?.success) {
        setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      showToast.error(getEligibilityErrorMessage(err, "Failed to cancel invitation"));
      if (onRefreshJourney) onRefreshJourney();
    }
  };

  const hostList =
    journey?.members?.filter((m) => {
      const u = m.user || {};
      const isCreator = (journey?.creator?._id || journey?.creator)?.toString() === (u._id || u)?.toString();
      return m.role === "Organizer" || m.role === "host" || isCreator;
    }) || [];

  const coLeadersList =
    journey?.members?.filter((m) => {
      const u = m.user || {};
      const isCreator = (journey?.creator?._id || journey?.creator)?.toString() === (u._id || u)?.toString();
      return !isCreator && (m.role === "Co-Organizer" || m.role === "cohost" || m.role === "Co-Leader");
    }) || [];

  const regularMembersList =
    journey?.members?.filter((m) => {
      const u = m.user || {};
      const isCreator = (journey?.creator?._id || journey?.creator)?.toString() === (u._id || u)?.toString();
      const isCoLeaderRole = m.role === "Co-Organizer" || m.role === "cohost" || m.role === "Co-Leader";
      return !isCreator && !isCoLeaderRole && m.role !== "Organizer" && m.role !== "host";
    }) || [];

  const renderMemberCard = (mem) => {
    const u = mem.user || {};
    const userIdStr = (u._id || u).toString();
    const isSelf = userIdStr === currentUserId?.toString();
    const isMenuOpen = openMenuId === userIdStr;

    const isMemberHost =
      (journey?.creator?._id || journey?.creator)?.toString() === userIdStr ||
      mem.role === "Organizer" ||
      mem.role === "host";

    const standardRole = isMemberHost
      ? "Host"
      : mem.role === "Co-Organizer" || mem.role === "cohost" || mem.role === "Co-Leader"
      ? "Co-Leader"
      : "Member";

    const canManage = (isHost || isCoLeader) && !isSelf && !isMemberHost;
    const canSelfLeave = isSelf && !isHost && isUpcoming;
    const hasActions = canManage || canSelfLeave;

    return (
      <div
        key={userIdStr}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
          isSelf
            ? "bg-gradient-to-br from-brand-500/10 via-white dark:via-slate-900 to-brand-500/5 border-brand-300 dark:border-brand-800 shadow-sm"
            : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800 hover:border-[#7C3AED]/40 shadow-xs"
        }`}
      >
        {/* Main Member Summary Row */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-3 min-w-0 pr-1">
            <div className="relative shrink-0">
              <Avatar
                user={u}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-brand-500/20 shadow-xs"
              />
              {u.online && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                  title="Online"
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {u.name || "Traveler"}
                </h4>
                {isSelf && (
                  <span className="text-[9px] bg-[#7C3AED] text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                    YOU
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                {u.bio || "Passionate travel explorer"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {standardRole === "Host" && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
                <Crown className="w-3 h-3 stroke-[2.5] text-amber-500" /> Host
              </span>
            )}

            {standardRole === "Co-Leader" && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-purple-200 dark:border-purple-800/60">
                <ShieldAlert className="w-3 h-3 stroke-[2.5] text-purple-500" /> Co-Leader
              </span>
            )}

            {standardRole === "Member" && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                Member
              </span>
            )}

            {hasActions && (
              <button
                type="button"
                onClick={() => setOpenMenuId(isMenuOpen ? null : userIdStr)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isMenuOpen ? "Collapse Member Options" : "Expand Member Options"}
                aria-expanded={isMenuOpen}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMenuOpen ? "rotate-180 text-[#7C3AED]" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* In-Flow Expanded Actions Panel */}
        {isMenuOpen && hasActions && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 animate-fade-in text-[11px] font-semibold">
            {canManage && (
              <>
                {/* Co-Leader Actions (Host only) */}
                {isHost && standardRole === "Member" && !coLeadersList.length && (
                  <button
                    type="button"
                    onClick={() => handleAssignCoLeader(userIdStr)}
                    className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] dark:hover:bg-[#7C3AED]/20 dark:hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-[#7C3AED]" /> Assign Co-Leader
                  </button>
                )}

                {isHost && standardRole === "Co-Leader" && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCoLeader(userIdStr)}
                    className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Remove Co-Leader
                  </button>
                )}

                {/* Send Warning (Host & Co-Leader - always available!) */}
                <button
                  type="button"
                  onClick={() => {
                    setWarningTarget({
                      userId: userIdStr,
                      name: u.name || "Traveler"
                    });
                    setOpenMenuId(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-2 transition-colors font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Send Warning</span>
                </button>

                {/* Transfer Host Role (Host only) */}
                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Transfer full Journey ownership to ${u.name}?`)) {
                        handleRoleChange(userIdStr, "Organizer");
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center gap-2 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Transfer Host Role
                  </button>
                )}

                {/* Remove Member (Host only, Upcoming only — Roster is locked on Ongoing) */}
                {isHost && isUpcoming && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${u.name} from journey?`)) {
                        onRemoveMember(userIdStr);
                        setOpenMenuId(null);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Remove from Roster
                  </button>
                )}
              </>
            )}

            {canSelfLeave && (
              <button
                type="button"
                onClick={handleLeaveJourney}
                className="w-full px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 font-bold transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Leave Journey
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600/10 via-brand-600/10 to-brand-600/10 dark:from-brand-900/40 dark:via-brand-900/40 dark:to-brand-900/40 border border-brand-200/60 dark:border-brand-800/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-[#7C3AED] dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/50">
            <Users className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Journey Members ({journey?.members?.length ?? 0})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Type:{" "}
              <span className="font-extrabold text-[#7C3AED] uppercase">
                {journey?.journeyType || "Private Journey"}
              </span>
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              navigate(journey?.chatRoomId ? `/social/chat/${journey.chatRoomId}` : `/social/chat`);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all border shadow-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#7C3AED] border-slate-200 dark:border-slate-700 active:scale-95"
            title="Open Group Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Group Chat</span>
          </button>
          {canInvite && (
            <button
              onClick={onInviteClick}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#7C3AED] text-white text-xs font-black shadow-md shadow-[#7C3AED]/20 transition-all active:scale-95 group"
            >
              <UserPlus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />{" "}
              Invite Companions
            </button>
          )}
        </div>
      </div>

      {/* Journey Host Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 stroke-[2.5]" /> Journey Host
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
          {hostList.map(renderMemberCard)}
        </div>
      </div>

      {/* Co-Leaders Section */}
      {coLeadersList.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" /> Co-Leaders
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
            {coLeadersList.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Members Section */}
      {regularMembersList.length > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 stroke-[2.5]" /> Members (
              {regularMembersList.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
            {regularMembersList.map(renderMemberCard)}
          </div>
        </div>
      ) : (
        <div className="py-8 px-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2 mt-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isOngoing ? "Journey Roster Locked" : "Build your travel group"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
            {isOngoing
              ? "This journey is in progress. The roster is locked."
              : "Invite companions to coordinate plans, check-ins and memories."}
          </p>
          {canInvite && (
            <button
              onClick={onInviteClick}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite Companions
            </button>
          )}
        </div>
      )}

      {/* Pending Invitations (Upcoming only) */}
      {!isOngoing && isHost && invitations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-pulse stroke-[2.5]" />{" "}
              Pending Roster Invitations ({invitations.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {invitations.map((inv) => {
              const u = inv.inviteeId || {};
              return (
                <div
                  key={inv._id}
                  className="bg-gradient-to-br from-amber-500/10 via-white dark:via-slate-900 to-amber-500/5 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                    <Avatar
                      user={u}
                      className="w-9 h-9 rounded-xl object-cover grayscale opacity-80 shrink-0"
                    />

                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                        {u.name || u.email}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" /> Awaiting
                        Acceptance
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResendInvite(inv._id)}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700 transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                      title="Resend Invite"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(inv._id)}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                      title="Cancel Invite"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Join Requests (Upcoming only) */}
      {!isOngoing && isHost && joinRequests.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />{" "}
              Pending Join Requests ({joinRequests.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {joinRequests.map((req) => {
              const u = req.userId || {};
              return (
                <div
                  key={req._id}
                  className="bg-gradient-to-br from-[#7C3AED]/10 via-white dark:via-slate-900 to-[#7C3AED]/5 p-3 rounded-2xl border border-[#7C3AED]/30 dark:border-[#7C3AED]/40 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                    <Avatar
                      user={u}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />

                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                        {u.name || u.email}
                      </span>
                      <span className="text-[10px] text-[#7C3AED] dark:text-[#7C3AED] font-bold flex items-center gap-1 mt-0.5">
                        {req.message ? `"${req.message.substring(0, 15)}..."` : "Wants to join"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptJoinRequest(req._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#7c3aed] transition-all shadow-xs border border-[#7C3AED]/60 text-[10px] font-black uppercase tracking-wider"
                      title="Accept Request"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectJoinRequest(req._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-black uppercase tracking-wider"
                      title="Reject Request"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning Modal */}
      <SendWarningModal
        isOpen={Boolean(warningTarget)}
        targetMember={warningTarget}
        journeyId={journey?._id}
        onClose={() => setWarningTarget(null)}
        onSuccess={() => {
          setWarningTarget(null);
          if (onRefreshJourney) onRefreshJourney();
        }}
      />
    </div>
  );
};

export default JourneyMembers;