import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import axiosInstance from "../../api/axios";
import MemberSelector from "./MemberSelector";

const InviteBuddyModal = ({ journey, isOpen, onClose, onInvited }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !journey) return null;

  const currentMemberIds =
    journey?.members?.map((m) => (m.user?._id || m.user).toString()) || [];

  const handleSendInvites = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/invite`, {
        userIds: selectedIds,
        role,
      });

      if (res.data.success) {
        alert(`Invited ${selectedIds.length} travel buddy(s)!`);
        if (onInvited) onInvited();
        onClose();
      }
    } catch (err) {
      console.error("Invite error:", err);
      alert("Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6C4DF6] rounded-2xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Invite Travel Buddies</h3>
              <p className="text-xs text-slate-400">
                Add buddies to "{journey.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Control */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Assign Role
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="Member">🎒 Member</option>
            <option value="Co-Organizer">🛡️ Co-Organizer</option>
          </select>
        </div>

        {/* Member Selector */}
        <div className="p-4 overflow-y-auto flex-1">
          <MemberSelector
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            excludeUserIds={currentMemberIds}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">
              {selectedIds.length} Selected
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvites}
              disabled={selectedIds.length === 0 || loading}
              className="flex-1 py-3 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? "Sending..." : `Send Invite${selectedIds.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteBuddyModal;
