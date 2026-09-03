import React, { useState } from "react";
import { UserPlus, X, Link2, Check } from "lucide-react";
import axiosInstance from "../../api/axios";
import MemberSelector from "./MemberSelector";
import { showToast } from "../../utils/showToast";

const InviteBuddyModal = ({ journey, isOpen, onClose, onInvited }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !journey) return null;

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/social/journeys/${journey._id}?inviteCode=${journey._id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentMemberIds =
  journey?.members?.map((m) => (m.user?._id || m.user).toString()) || [];

  const handleSendInvites = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/invite`, {
        userIds: selectedIds,
        role
      });

      if (res.data.success) {
        const inviteCount = res.data.invites ? res.data.invites.length : selectedIds.length;
        if (inviteCount > 0) {
          showToast.success(`Invited ${inviteCount} ${inviteCount === 1 ? "companion" : "companions"}!`);
        } else {
          showToast.success("Selected users are already members or have pending invites.");
        }
        if (onInvited) onInvited();
        onClose();
      }
    } catch (err) {
      console.error("Invite error:", err);
      showToast.error(err.response?.data?.message || "Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-brand/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="bg-white p-5 border-b border-slate-100 text-text-primary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand rounded-2xl shadow-md shadow-brand/20">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Invite Companions</h3>
              <p className="text-xs text-text-muted">
                Add travel companions to "{journey.title}"
              </p>
            </div>
          </div>
          <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-background text-text-muted hover:text-text-primary">

            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Selector Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <MemberSelector
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          excludeUserIds={currentMemberIds} />

        </div>

        {/* External Invitation Link */}
        <div className="px-4 py-3 bg-brand-50/70 border-t border-brand-100 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold text-text-primary truncate">
              Invite someone not on YatriGo?
            </p>
            <p className="text-[10px] text-text-muted truncate">
              Share private link via WhatsApp, Instagram, or Chat
            </p>
          </div>
          <button
          type="button"
          onClick={handleCopyLink}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border ${
          copied ?
          "bg-emerald-500 text-white border-emerald-500 shadow-xs" :
          "bg-white text-brand hover:bg-brand-100/50 border-brand-200 shadow-2xs active:scale-95"
          }`}>

            {copied ?
            <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Link Copied!</span>
              </> :

            <>
                <Link2 className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>}

          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-xs font-black text-text-muted truncate">
            {selectedIds.length > 0 ?
            `${selectedIds.length} ${selectedIds.length === 1 ? "companion" : "companions"} selected` :
            "No companions selected"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-slate-200/70 hover transition-colors">

              Cancel
            </button>
            <button
            onClick={handleSendInvites}
            disabled={selectedIds.length === 0 || loading}
            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-extrabold shadow-md shadow-brand/20 transition-all disabled:opacity-50 active:scale-95">

              {loading ?
              "Sending..." :
              selectedIds.length > 0 ?
              `Send ${selectedIds.length} Invite${selectedIds.length > 1 ? "s" : ""}` :
              "Send Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>);

};

export default InviteBuddyModal;