import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2, X, Compass, UserPlus, Heart, MessageSquare, ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { useSidebar } from "../SidebarProvider";
import { useNotificationContext } from "../../../../context/NotificationContext";
import { notificationVariants } from "../animations/sidebarAnimations";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { getAvatar } from "../../../../utils/chat/chatHelpers";
import { chatService } from "../../../../services/chatService";

const CATEGORIES = ["All", "Journey", "Social", "Messages", "Safety"];

// Semantic styling and icon mapping adhering to Go YatriGo design tokens
const getNotificationVisuals = (type, category) => {
  const t = (type || "").toLowerCase();

  // Safety / Urgent
  if (t.includes("sos") || t.includes("emergency")) {
    return {
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      badge: "Urgent",
      colorType: "danger"
    };
  }
  if (t.includes("warning") || t.includes("admin_warning")) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      badge: "Warning",
      colorType: "danger"
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

  // Safety / Success
  if (t.includes("safe") || t.includes("checkin")) {
    return {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      badge: "Safe",
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

  // Primary Journey / Social / Message Actions
  if (t.includes("journey") || t.includes("trip") || t.includes("join")) {
    return {
      icon: <Compass className="w-4 h-4 text-brand-600" />,
      bg: "bg-brand-50 text-brand-600 border-brand-100",
      badge: "Journey",
      colorType: "primary"
    };
  }
  if (t.includes("follow")) {
    return {
      icon: <UserPlus className="w-4 h-4 text-brand-600" />,
      bg: "bg-brand-50 text-brand-600 border-brand-100",
      badge: "Social",
      colorType: "primary"
    };
  }
  if (t.includes("like") || t.includes("reaction")) {
    return {
      icon: <Sparkles className="w-4 h-4 text-[#7C3AED] fill-[#7C3AED]" />,
      bg: "bg-purple-50 text-[#7C3AED] border-purple-100",
      badge: "Activity",
      colorType: "primary"
    };
  }
  if (t.includes("comment") || t.includes("message") || t.includes("reply") || t.includes("chat")) {
    return {
      icon: <MessageSquare className="w-4 h-4 text-brand-600" />,
      bg: "bg-brand-50 text-brand-600 border-brand-100",
      badge: "Chat",
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

  // Fallback Informational
  return {
    icon: <Bell className="w-4 h-4 text-slate-500" />,
    bg: "bg-slate-100 text-slate-600 border-slate-200",
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
        description: "Safe check-ins and emergency updates from your journeys will appear here."
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
    return n.category === activeCategory;
  });

  const handleNotificationClick = async (n) => {
    const notifId = n._id || n.id;
    if (!n.isRead && notifId) {
      await markAsRead(notifId);
    }

    setShowNotifPanel(false);

    // Authoritative navigation routing
    const type = (n.type || "").toLowerCase();

    // 1. Journey / Squad
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

    // 2. Chat / Messages
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

    // 3. Social / Profile
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

    // 4. Safety
    if (type.includes("sos") || type.includes("emergency")) {
      navigate("/emergency-contacts");
      return;
    }

    // Default
    navigate("/");
  };

  const getTabCount = (cat) => {
    switch (cat) {
      case "All":
        return counts.all || notifications.length;
      case "Journey":
        return counts.journey || notifications.filter((n) => n.category === "Journey").length;
      case "Social":
        return counts.social || notifications.filter((n) => n.category === "Social").length;
      case "Messages":
        return counts.messages || notifications.filter((n) => n.category === "Messages").length;
      case "Safety":
        return counts.safety || notifications.filter((n) => n.category === "Safety").length;
      default:
        return 0;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <motion.div
        key="notif-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowNotifPanel(false)}
        className="fixed inset-0 z-[1001] bg-slate-900/30 backdrop-blur-xs lg:hidden"
      />

      <AnimatePresence>
        <motion.div
          ref={panelRef}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={notificationVariants}
          className="fixed top-14 lg:top-4 left-2 right-2 sm:left-6 sm:right-6 lg:left-64 lg:right-auto lg:w-[480px] max-h-[82vh] lg:max-h-[80vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 z-[1002] overflow-hidden select-none font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-heading truncate">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-brand-600 truncate font-sans">
                    {unreadCount} unread alert{unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] sm:text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors lg:hidden"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 overflow-x-auto shrink-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = getTabCount(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                      : "bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-600 border border-slate-200/80"
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-brand-100"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-3.5 space-y-2.5">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 px-4 flex flex-col items-center justify-center text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 font-heading">
                  {getCategoryEmptyDetails(activeCategory).title}
                </h4>
                <p className="text-xs text-slate-400 max-w-[260px] mx-auto mt-1 leading-relaxed font-sans">
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
                        : "bg-white border-slate-100 hover:bg-slate-50/80"
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
                      <div className="text-[13px] text-slate-800 leading-snug">
                        <span className="font-bold text-slate-900 hover:underline">
                          {senderName}
                        </span>{" "}
                        <span className="text-slate-700 font-normal">
                          {notif.message || notif.content || notif.text || "New notification"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
                        <span>{moment(notif.createdAt).fromNow()}</span>
                        {visuals.badge && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              {visuals.badge}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Inline Actions */}
                      {isUnread && (
                        <div
                          className="mt-2.5 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer"
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
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
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
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
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
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
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
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
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
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
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
                      <div className="w-2 h-2 bg-brand-600 rounded-full shrink-0 mt-2 ring-2 ring-brand-200/50" />
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
          className="fixed inset-0 z-[1050] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 font-heading">
              Clear All Notifications?
            </h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans">
              Are you sure you want to permanently delete all notifications? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
