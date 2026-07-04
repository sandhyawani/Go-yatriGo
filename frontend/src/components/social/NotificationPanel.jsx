import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, Compass, Calendar, ArrowRight } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { showToast } from "../../utils/showToast";
import axios from "../../api/axios";

export const NotificationPanel = ({
  showNotifPanel,
  setShowNotifPanel,
  notifications,
  unreadCount,
  journeyInvitations,
  markAllRead,
  markAsRead,
  handleAcceptRequest,
  handleRejectRequest,
  handleAcceptMessage,
  handleRejectMessage,
  handleAcceptJoin,
  handleRejectJoin,
  removeJourneyInvitation
}) => {
  const navigate = useNavigate();

  const handleAcceptInvite = async (e, invitationId) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`/notifications/journey-invitation/${invitationId}/accept`, {}, { withCredentials: true });
      if (res.data.success) {
        showToast.success("Invitation accepted! Added to your journeys.");
        removeJourneyInvitation(invitationId);
        setShowNotifPanel(false);
        navigate("/social/journeys");
      }
    } catch (err) {
      showToast.error("Failed to accept invitation");
    }
  };

  const handleDeclineInvite = async (e, invitationId) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`/notifications/journey-invitation/${invitationId}/decline`, {}, { withCredentials: true });
      if (res.data.success) {
        showToast.success("Invitation declined");
        removeJourneyInvitation(invitationId);
      }
    } catch (err) {
      showToast.error("Failed to decline invitation");
    }
  };

  return (
    <AnimatePresence>
      {showNotifPanel && (
        <motion.div
          key="notif-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowNotifPanel(false)}
          className="fixed inset-0 z-[1000] bg-slate-900/20 backdrop-blur-[2px]"
        />
      )}
      {showNotifPanel && (
        <motion.div
          key="notif-drawer-content"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 z-[1001] w-full lg:w-[380px] lg:max-w-sm bg-white lg:border-l lg:border-slate-100 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent-500" /> Notifications
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                {unreadCount} Unread alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="px-2.5 py-1 text-[10px] font-bold text-brand-500 hover:bg-brand-500/5 rounded-lg transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifPanel(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 cs">
            {/* Journey Invitations Section */}
            {journeyInvitations.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Journey Invites</span>
                {journeyInvitations.map((invite) => (
                  <div
                    key={invite._id}
                    className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/20 flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-slate-700 font-medium leading-normal">
                          <span className="font-bold text-slate-900">{invite.hostName || "Host"}</span> invited you to join the journey:
                        </p>
                        <p className="text-[12.5px] font-bold text-[#D07A12] truncate mt-1">{invite.journeyTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <button
                        onClick={(e) => handleAcceptInvite(e, invite._id)}
                        className="px-3.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        Accept <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeclineInvite(e, invite._id)}
                        className="px-3.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Notifications list */}
            {notifications.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">All caught up!</p>
                <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-relaxed">
                  No new notifications to display
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {journeyInvitations.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Activity</span>
                )}
                {notifications.map((n) => (
                  <NotificationItem
                    key={n._id}
                    n={n}
                    navigate={navigate}
                    handleAcceptRequest={handleAcceptRequest}
                    handleRejectRequest={handleRejectRequest}
                    handleAcceptMessage={handleAcceptMessage}
                    handleRejectMessage={handleRejectMessage}
                    handleAcceptJoin={handleAcceptJoin}
                    handleRejectJoin={handleRejectJoin}
                    markAsRead={markAsRead}
                    setShowNotifPanel={setShowNotifPanel}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default NotificationPanel;
