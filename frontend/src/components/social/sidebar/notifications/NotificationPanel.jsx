import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Compass,
  UserPlus,
  Heart,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Clock,
  UserMinus,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useSidebar } from "../SidebarProvider";
import { useNotificationContext } from "../../../../context/NotificationContext";
import { notificationVariants } from "../animations/sidebarAnimations";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { getAvatar } from "../../../../utils/chat/chatHelpers";
import { chatService } from "../../../../services/chatService";

const CATEGORIES = [
  { key: "All", label: "All", icon: Bell },
  { key: "Journey", label: "Journey", icon: Compass },
  { key: "Social", label: "Social", icon: UserPlus },
  { key: "Messages", label: "Messages", icon: MessageSquare },
  { key: "Safety", label: "Safety", icon: ShieldAlert },
];

export const getNormalizedCategory = (notif) => {
  if (!notif) return "Social";
  const c = (notif.category || "").toLowerCase();
  const t = (notif.type || "").toLowerCase();

  if (
    c === "safety" ||
    c === "safe" ||
    c === "emergency" ||
    t.includes("safe") ||
    t.includes("sos") ||
    t.includes("emergency") ||
    t.includes("warning") ||
    t.includes("admin_warning")
  ) {
    return "Safety";
  }

  if (
    c === "messages" ||
    c === "message" ||
    c === "chat" ||
    t.includes("message") ||
    t.includes("direct") ||
    t.includes("chat") ||
    t === "new_message" ||
    t === "message_request"
  ) {
    return "Messages";
  }

  if (
    c === "journey" ||
    t.includes("journey") ||
    t.includes("trip") ||
    t.includes("group") ||
    t.includes("join") ||
    t.includes("host_transferred")
  ) {
    return "Journey";
  }

  return "Social";
};

const getNotificationVisuals = (type, category) => {
  const t = (type || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (t.includes("sos") || t.includes("emergency")) {
    return {
      icon: <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />,
      bg: "bg-rose-50 text-rose-600 border-rose-200",
      badge: "Emergency Alert",
      colorType: "danger",
      isEmergency: true
    };
  }
  if (t.includes("warning") || t.includes("admin_warning")) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      bg: "bg-amber-50 text-amber-600 border-amber-200",
      badge: "Safety Warning",
      colorType: "warning"
    };
  }
  if (t.includes("cancelled") || t.includes("rejected") || t.includes("reject")) {
    return {
      icon: <X className="w-4 h-4 text-rose-500" />,
      bg: "bg-rose-50 text-rose-500 border-rose-100",
      badge: "Declined",
      colorType: "danger"
    };
  }

  if (t.includes("safe") || t.includes("checkin")) {
    return {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      badge: "Safe Check-in",
      colorType: "success"
    };
  }
  if (t.includes("accepted") || t.includes("approved") || t.includes("accept") || t.includes("completed")) {
    return {
      icon: <CheckCheck className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      badge: "Accepted",
      colorType: "success"
    };
  }

  if (t.includes("message") || t.includes("chat") || t.includes("direct") || c === "messages" || c === "message") {
    return {
      icon: <MessageSquare className="w-4 h-4 text-sky-600" />,
      bg: "bg-sky-50 text-sky-600 border-sky-200",
      badge: t === "message_request" ? "Message Request" : "Message",
      colorType: "primary"
    };
  }

  if (t.includes("journey") || t.includes("trip") || t.includes("join")) {
    return {
      icon: <Compass className="w-4 h-4 text-brand" />,
      bg: "bg-brand-50 text-brand border-brand-100",
      badge: "Journey",
      colorType: "primary"
    };
  }
  if (t.includes("follow")) {
    return {
      icon: <UserPlus className="w-4 h-4 text-brand" />,
      bg: "bg-brand-50 text-brand border-brand-100",
      badge: "Social",
      colorType: "primary"
    };
  }
  if (t.includes("like") || t.includes("reaction")) {
    return {
      icon: <Sparkles className="w-4 h-4 text-brand fill-brand" />,
      bg: "bg-primary-50 text-brand border-primary-100",
      badge: "Like",
      colorType: "primary"
    };
  }
  if (t.includes("memory")) {
    return {
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      badge: "Memory",
      colorType: "primary"
    };
  }

  return {
    icon: <Bell className="w-4 h-4 text-text-muted" />,
    bg: "bg-background text-text-secondary border-slate-200",
    badge: category || "Alert",
    colorType: "neutral"
  };
};

const getCategoryEmptyDetails = (category) => {
  switch (category) {
    case "Journey":
      return {
        title: "No journey notifications",
        description: "You're all caught up with your trips, invitations, and squad requests."
      };
    case "Social":
      return {
        title: "No social updates",
        description: "Follow requests, likes, and comments on your travel memories will appear here."
      };
    case "Messages":
      return {
        title: "No message alerts",
        description: "Direct chat requests and incoming messages will be notified here."
      };
    case "Safety":
      return {
        title: "No safety alerts",
        description: "Safe check-ins, SOS notices, and emergency updates will appear here."
      };
    default:
      return {
        title: "All caught up!",
        description: "No new notifications to display right now."
      };
  }
};

export const NotificationPanel = () => {
  const { showNotifPanel, setShowNotifPanel } = useSidebar();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const {
    notifications,
    unreadCount,
    counts,
    activeCategory,
    setActiveCategory,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    handleAcceptJourneyInvitation,
    handleRejectJourneyInvitation,
    handleAcceptFollow,
    handleRejectFollow,
    handleAcceptMessage,
    handleRejectMessage,
    handleManageJoin
  } = useNotificationContext();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest(".bell-btn") &&
        !document.getElementById("confirm-clear-modal")?.contains(e.target)
      ) {
        setShowNotifPanel(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowNotifPanel(false);
      }
    };

    if (showNotifPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifPanel, setShowNotifPanel]);

  if (!showNotifPanel) return null;

  // Filter notifications precisely by active category
  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === "All") return true;
    return getNormalizedCategory(n) === activeCategory;
  });


  const handleNotificationClick = async (n) => {
    const notifId = n._id || n.id;
    if (!n.isRead && notifId) {
      await markAsRead(notifId);
    }

    setShowNotifPanel(false);

    const type = (n.type || "").toLowerCase();

    if (n.journey || type.includes("journey") || type.includes("invite")) {
      const journeyId = typeof n.journey === "object" ? n.journey?._id : n.journey;
      if (journeyId) {
        navigate(`/social/journeys/${journeyId}`);
        return;
      }
      navigate("/social/journeys");
      return;
    }

    if (n.group || type.includes("group") || type.includes("join_request")) {
      const groupId = typeof n.group === "object" ? n.group?._id : n.group;
      if (groupId) {
        navigate(`/social/buddy/${groupId}`);
        return;
      }
      navigate("/social/buddy");
      return;
    }

    if (n.room || type.includes("message") || type.includes("chat") || type.includes("direct")) {
      const roomId = typeof n.room === "object" ? n.room?._id : n.room;
      if (roomId) {
        navigate(`/social/chat/${roomId}`);
        return;
      }

      const targetUserId = n.sender?._id || n.sender?.id;
      if (targetUserId) {
        try {
          const directRoomId = await chatService.getDirectRoomId(targetUserId);
          if (directRoomId) {
            navigate(`/social/chat/${directRoomId}`);
            return;
          }
        } catch {
        }
      }
      navigate("/social/chat");
      return;
    }

    if (type.includes("follow")) {
      const actorId = n.sender?._id || n.sender?.id || (typeof n.sender === "string" ? n.sender : null);
      if (actorId) {
        navigate(`/profile/${actorId}`);
        return;
      }
      navigate("/profile");
      return;
    }

    if (n.story || type.includes("story")) {
      const dispatchId = typeof n.story === "object" ? n.story?._id : n.story;
      navigate("/", { state: dispatchId ? { dispatchId } : undefined });
      return;
    }

    if (n.post || type.includes("post") || type.includes("memory")) {
      const memoryId = typeof n.post === "object" ? n.post?._id : n.post;
      const actorId = n.sender?._id || n.sender?.id;
      if (memoryId && actorId) {
        navigate(`/profile/${actorId}?postId=${memoryId}`);
      } else {
        navigate(actorId ? `/profile/${actorId}` : "/");
      }
      return;
    }

    if (type.includes("sos") || type.includes("emergency")) {
      navigate("/emergency-contacts");
      return;
    }

    navigate("/");
  };


  const getTabCount = (catKey) => {
    if (catKey === "All") return counts.all || notifications.length;
    return notifications.filter((n) => getNormalizedCategory(n) === catKey).length;
  };


  return (
    <>
      {/* Backdrop for Desktop */}
      <motion.div
        key="notif-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowNotifPanel(false)}
        className="fixed inset-0 z-[1001] bg-slate-900/20 backdrop-blur-xs hidden lg:block"
      />

      <AnimatePresence>
        <motion.div
          ref={panelRef}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={notificationVariants}
          className="fixed inset-0 lg:inset-auto lg:top-4 lg:left-64 lg:w-[480px] lg:max-h-[85vh] flex flex-col bg-surface rounded-none lg:rounded-[var(--radius-card)] shadow-none lg:shadow-2xl border-0 lg:border lg:border-slate-100 z-[1002] overflow-hidden select-none font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                onClick={() => setShowNotifPanel(false)}
                className="p-1.5 -ml-1 rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-100 active:scale-95 transition-all lg:hidden cursor-pointer shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-50 hidden lg:flex items-center justify-center text-brand shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-text-primary font-heading truncate">
                  Notifications
                </h3>
                {unreadCount > 0 ? (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-brand truncate font-sans">
                    {unreadCount} unread alert{unreadCount > 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-text-muted truncate font-sans">
                    All caught up
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] sm:text-xs font-bold text-brand hover:text-brand-dark bg-brand-50 hover:bg-brand-100 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mark all read</span><span className="sm:hidden">Read all</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] sm:text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear all</span><span className="sm:hidden">Clear</span>
                </button>
              )}

              <button
                onClick={() => setShowNotifPanel(false)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-background transition-colors hidden lg:flex cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 overflow-x-auto shrink-0 scrollbar-none">
            {CATEGORIES.map((catItem) => {
              const count = getTabCount(catItem.key);
              const isActive = activeCategory === catItem.key;
              const Icon = catItem.icon;
              return (
                <button
                  key={catItem.key}
                  onClick={() => setActiveCategory(catItem.key)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-brand text-white shadow-xs"
                      : "bg-white text-text-secondary hover:bg-brand-50 hover:text-brand border border-slate-200/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{catItem.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-background text-text-secondary"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List Content */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-3.5 sm:p-4 space-y-2.5 pb-20 lg:pb-4">
            {/* RECEIVED NOTIFICATIONS LIST */}
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-muted">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 px-4 flex flex-col items-center justify-center text-text-muted">
                <div className="w-12 h-12 rounded-2xl bg-background border border-slate-200/60 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-text-muted" />
                </div>
                <h4 className="text-sm font-bold text-text-primary font-heading">
                  {getCategoryEmptyDetails(activeCategory).title}
                </h4>
                <p className="text-xs text-text-muted max-w-[260px] mx-auto mt-1 leading-relaxed font-sans">
                  {getCategoryEmptyDetails(activeCategory).description}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const notifId = notif._id || notif.id;
                const visuals = getNotificationVisuals(notif.type, notif.category);
                const senderName = notif.sender?.name || notif.sender?.username || "Go YatriGo";
                const isUnread = !notif.isRead;
                const type = (notif.type || "").toLowerCase();

                // Has inline actionable buttons
                const isJourneyInvite = type === "journey_invitation" && notif.invitation;
                const isFollowRequest = type === "follow_request";
                const isMessageRequest = type === "message_request";
                const isJoinRequest = (type === "join_request" || type === "journey_join_request") && (notif.group || notif.journey);

                return (
                  <div
                    key={notifId}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isUnread
                        ? "bg-brand-50/40 border-brand-100/80 hover:bg-brand-50/60 shadow-xs"
                        : "bg-white border-slate-100 hover/80"
                    }`}
                  >
                    {/* Actor Avatar with event badge */}
                    <div className="relative shrink-0">
                      <img
                        src={getAvatar(notif.sender, senderName)}
                        alt={senderName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${visuals.bg}`}
                      >
                        {visuals.icon}
                      </div>
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="text-[13px] text-slate-900 leading-snug break-words">
                        <span className="font-bold text-slate-900 hover:underline">
                          {senderName}
                        </span>{" "}
                        <span className="text-slate-700 font-normal">
                          {notif.message || notif.content || notif.text || "New notification"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted font-medium">
                        <span>{moment(notif.createdAt).fromNow()}</span>
                        {visuals.badge && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                              {visuals.badge}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Prominent Emergency / Safety Callout */}
                      {visuals.isEmergency && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                            <span className="truncate font-bold">Emergency SOS Alert</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotifPanel(false);
                              navigate("/emergency-contacts");
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            View Contacts
                          </button>
                        </div>
                      )}

                      {/* Inline Actions */}
                      {isUnread && (
                        <div
                          className="mt-2.5 flex items-center gap-2 flex-wrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Direct message quick action */}
                          {(type === "new_message" || type === "direct") && (
                            <button
                              onClick={() => handleNotificationClick(notif)}
                              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                              <span>Open Chat</span>
                            </button>
                          )}

                          {isJourneyInvite && (
                            <>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const invId = typeof notif.invitation === "object" ? notif.invitation._id : notif.invitation;
                                  await handleAcceptJourneyInvitation(invId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="btn-primary"
                              >
                                Accept <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const invId = typeof notif.invitation === "object" ? notif.invitation._id : notif.invitation;
                                  await handleRejectJourneyInvitation(invId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="px-3 py-1 bg-background hover active:scale-95 text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isFollowRequest && (
                            <>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const reqId = notif.sender?._id || notif.sender;
                                  await handleAcceptFollow(reqId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="btn-primary"
                              >
                                Accept
                              </button>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const reqId = notif.sender?._id || notif.sender;
                                  await handleRejectFollow(reqId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="px-3 py-1 bg-background hover active:scale-95 text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isMessageRequest && (
                            <>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const roomId = typeof notif.room === "object" ? notif.room._id : notif.room;
                                  await handleAcceptMessage(roomId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="btn-primary"
                              >
                                Accept Chat
                              </button>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const roomId = typeof notif.room === "object" ? notif.room._id : notif.room;
                                  await handleRejectMessage(roomId, notifId);
                                  setIsProcessingAction(false);
                                }}
                                className="px-3 py-1 bg-background hover active:scale-95 text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isJoinRequest && (
                            <>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const reqId = typeof notif.joinRequest === "object" ? notif.joinRequest._id : notif.joinRequest;
                                  const groupId = typeof notif.group === "object" ? notif.group._id : notif.group;
                                  if (groupId && reqId) {
                                    await handleManageJoin(groupId, reqId, "approved", notifId);
                                  }
                                  setIsProcessingAction(false);
                                }}
                                className="btn-primary"
                              >
                                Accept Join
                              </button>
                              <button
                                disabled={isProcessingAction}
                                onClick={async () => {
                                  setIsProcessingAction(true);
                                  const reqId = typeof notif.joinRequest === "object" ? notif.joinRequest._id : notif.joinRequest;
                                  const groupId = typeof notif.group === "object" ? notif.group._id : notif.group;
                                  if (groupId && reqId) {
                                    await handleManageJoin(groupId, reqId, "rejected", notifId);
                                  }
                                  setIsProcessingAction(false);
                                }}
                                className="px-3 py-1 bg-background hover active:scale-95 text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Unread Indicator */}
                    {isUnread && (
                      <div className="w-2 h-2 bg-brand rounded-full shrink-0 mt-2 ring-2 ring-brand-200/50" />
                    )}

                    {/* Delete Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notifId);
                      }}
                      className="absolute right-2.5 top-2.5 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div
          id="confirm-clear-modal"
          className="fixed inset-0 z-[1050] bg-brand/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface rounded-[var(--radius-card)] p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-text-primary font-heading">
              Clear All Notifications?
            </h4>
            <p className="text-xs text-text-muted mt-2 leading-relaxed font-sans">
              Are you sure you want to permanently delete all notifications? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-background rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllNotifications();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm shadow-rose-500/20 active:scale-95 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPanel;
