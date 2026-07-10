import React, { useState, useEffect } from "react";
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
  Sparkles,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import Avatar from "../common/Avatar";

const JourneyMembers = ({
  journey,
  currentUserId,
  onInviteClick,
  onRemoveMember,
  onRefreshJourney,
}) => {
  const [invitations, setInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const isOrganizer = journey?.members?.some(
    (m) =>
      (m.user?._id || m.user).toString() === currentUserId?.toString() &&
      m.role === "Organizer",
  );
  const isCoOrganizer = journey?.members?.some(
    (m) =>
      (m.user?._id || m.user).toString() === currentUserId?.toString() &&
      m.role === "Co-Organizer",
  );

  const fetchInvitations = () => {
    if (!journey?._id || (!isOrganizer && !isCoOrganizer)) return;
    setLoadingInvites(true);
    axiosInstance
      .get(`/journeys/${journey._id}/invitations`)
      .then((res) => {
        if (res.data?.success) {
          setInvitations(
            res.data.invitations.filter((i) => i.status === "pending") || [],
          );
        }
      })
      .catch((err) => console.error("Error loading sent invitations:", err))
      .finally(() => setLoadingInvites(false));
  };

  useEffect(() => {
    fetchInvitations();
  }, [journey]);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await axiosInstance.put(
        `/journeys/${journey._id}/members/${targetUserId}/role`,
        { role: newRole },
      );
      if (res.data?.success) {
        if (onRefreshJourney) onRefreshJourney();
        setOpenMenuId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update member role");
    }
  };

  const handleResendInvite = async (invitationId) => {
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitationId}/resend`,
      );
      if (res.data?.success) {
        alert("Invitation resent successfully!");
      }
    } catch (err) {
      alert("Failed to resend invitation");
    }
  };

  const handleCancelInvite = async (invitationId) => {
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitationId}/cancel`,
      );
      if (res.data?.success) {
        setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
        if (onRefreshJourney) onRefreshJourney();
      }
    } catch (err) {
      alert("Failed to cancel invitation");
    }
  };

  const organizersList =
    journey?.members?.filter((m) => m.role === "Organizer") || [];
  const coOrganizersList =
    journey?.members?.filter((m) => m.role === "Co-Organizer") || [];
  const regularMembersList =
    journey?.members?.filter(
      (m) => m.role !== "Organizer" && m.role !== "Co-Organizer",
    ) || [];

  const renderMemberCard = (mem) => {
    const u = mem.user || {};
    const userIdStr = (u._id || u).toString();
    const isSelf = userIdStr === currentUserId?.toString();
    const isMenuOpen = openMenuId === userIdStr;

    return (
      <div
        key={userIdStr}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between relative group overflow-hidden ${
          isSelf
            ? "bg-gradient-to-br from-brand-500/10 via-white dark:via-slate-900 to-brand-500/5 border-brand-300 dark:border-brand-800 shadow-sm"
            : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800 hover:border-[#8B5CF6]/40 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
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
                <span className="text-[9px] bg-[#8B5CF6] text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
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
          {/* Role Badge */}
          {mem.role === "Organizer" && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Crown className="w-3 h-3 stroke-[2.5]" /> Lead
            </span>
          )}
          {mem.role === "Co-Organizer" && (
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-600 to-brand-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <ShieldAlert className="w-3 h-3 stroke-[2.5]" /> Co-Lead
            </span>
          )}
          {mem.role === "Member" && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
              Buddy
            </span>
          )}

          {/* Organizer Quick Actions Dropdown */}
          {isOrganizer && !isSelf && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenuId(isMenuOpen ? null : userIdStr)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Manage Member"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-fade-in text-[11px] font-semibold">
                  {mem.role === "Member" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRoleChange(userIdStr, "Co-Organizer")
                      }
                      className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/40 hover:text-[#8B5CF6] flex items-center gap-2 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-brand-500" /> Promote
                      to Co-Org
                    </button>
                  )}

                  {mem.role === "Co-Organizer" && (
                    <button
                      type="button"
                      onClick={() => handleRoleChange(userIdStr, "Member")}
                      className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />{" "}
                      Demote to Member
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Transfer full Journey ownership to ${u.name}? You will become a Co-Organizer.`,
                        )
                      ) {
                        handleRoleChange(userIdStr, "Organizer");
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Transfer
                    Ownership
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${u.name} from squad?`)) {
                        onRemoveMember(userIdStr);
                        setOpenMenuId(null);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove from Roster
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* Actions */}
      <div className="bg-gradient-to-r from-brand-600/10 via-brand-600/10 to-brand-600/10 dark:from-brand-900/40 dark:via-brand-900/40 dark:to-brand-900/40 border border-brand-200/60 dark:border-brand-800/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-[#8B5CF6] dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/50">
            <Users className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Active Travelers ({journey?.members?.length || 1})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Origin Hub:{" "}
              <span className="font-extrabold text-[#8B5CF6] uppercase">
                {journey?.createdFrom || "Manual Creation"}
              </span>
            </p>
          </div>
        </div>

        {(isOrganizer || isCoOrganizer) && journey.status !== "Cancelled" && (
          <button
            onClick={onInviteClick}
            className="relative z-10 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#8B5CF6] text-white text-xs font-black shadow-md shadow-[#8B5CF6]/20 transition-all active:scale-95 shrink-0 group"
          >
            <UserPlus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />{" "}
            Invite Squad Buddies
          </button>
        )}
      </div>

      {/* Organizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 stroke-[2.5]" /> Expedition Lead
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {organizersList.map(renderMemberCard)}
        </div>
      </div>

      {/* Co-organizers */}
      {coOrganizersList.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" /> Co-Organizers
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {coOrganizersList.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Members */}
      {regularMembersList.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 stroke-[2.5]" /> Squad Buddies (
              {regularMembersList.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {regularMembersList.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {(isOrganizer || isCoOrganizer) && invitations.length > 0 && (
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
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60"
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
    </div>
  );
};

export default JourneyMembers;

