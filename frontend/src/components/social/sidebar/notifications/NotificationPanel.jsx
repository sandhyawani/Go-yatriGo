import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";
import { notificationVariants } from "../animations/sidebarAnimations";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import axios from "../../../../api/axios";

// Helper components like NotificationItem could be extracted to separate files, but are kept here for simplicity
const notifIcon = (type) => {
  if (type === "post_like") return <ICONS.Sparkles className="w-3.5 h-3.5 text-amber-500" />;
  if (type === "post_comment") return <ICONS.MessageSquareIcon className="w-3.5 h-3.5 text-brand-600" />;
  if (type === "follow" || type === "new_follower" || type === "follow_request") return <ICONS.UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
  if (type === "story_reply") return <ICONS.Sparkles className="w-3.5 h-3.5 text-amber-500" />;
  if (type === "message_request") return <ICONS.MessageSquare className="w-3.5 h-3.5 text-brand-600" />;
  if (type === "join_request") return <ICONS.Compass className="w-3.5 h-3.5 text-brand-600" />;
  return <ICONS.Bell className="w-3.5 h-3.5 text-slate-400" />;
};

const NotificationPanel = () => {
  const { user, showNotifPanel, setShowNotifPanel } = useSidebar();
  const navigate = useNavigate();
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      // Don't close if clicking a bell icon which triggers it
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target) &&
        !e.target.closest('.bell-btn')
      ) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setShowNotifPanel]);
  const {
    notifications,
    journeyInvitations,
    unreadCount,
    notifCategory,
    setNotifCategory,
    handleMarkAllRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications(user);

  if (!showNotifPanel) return null;

  const handleNotificationClick = async (n) => {
    // Basic navigation mapping
    if (n.type?.includes("follow")) {
      if (n.sender?._id) navigate(`/profile/${n.sender._id}`);
    } else if (n.type?.includes("group") || n.type?.includes("trip") || n.type?.includes("join")) {
      const groupId = typeof n.group === "object" ? n.group?._id : n.group;
      if (groupId) navigate(`/social/buddy/${groupId}`);
    } else if (n.type?.includes("message") || n.type?.includes("direct")) {
      navigate(`/social/chat`);
    } else {
      navigate("/");
    }

    if (!n.isRead) {
      await markAsRead(n._id);
    }
    setShowNotifPanel(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (n.type === "journey_invitation" || n.type === "trip_invitation") return false;
    if (notifCategory === "All") return true;
    if (notifCategory === "Journey") return n.type?.includes("journey") || n.type?.includes("trip") || n.type?.includes("join");
    if (notifCategory === "Social") return n.type?.includes("post") || n.type?.includes("follow");
    if (notifCategory === "Messages") return n.type?.includes("message") || n.type?.includes("chat");
    if (notifCategory === "Safety") return n.type?.includes("sos") || n.type?.includes("emergency");
    return true;
  });

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={notificationVariants}
        className="fixed top-14 lg:top-4 left-4 right-4 lg:left-64 lg:right-auto lg:w-[460px] max-h-[85vh] lg:max-h-[80vh] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100 z-[1002] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-900">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                title="Clear all notifications"
              >
                <ICONS.Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ICONS.CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0 select-none">
          {["All", "Journey", "Social", "Messages", "Safety"].map((cat) => (
            <button
              key={cat}
              onClick={() => setNotifCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                notifCategory === cat
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-brand-50 border border-slate-200"
              }`}
            >
              {cat} {cat === "Journey" && journeyInvitations.length > 0 ? `(${journeyInvitations.length})` : ""}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-1 p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <ICONS.Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No notifications in this category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    !notif.isRead ? "bg-brand-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-full flex items-center justify-center">
                    {notifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm text-slate-800 line-clamp-2">
                      <span className="font-bold">{notif.sender?.name}</span> {notif.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{moment(notif.createdAt).fromNow()}</p>
                  </div>
                  {!notif.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-2" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <ICONS.Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPanel;
