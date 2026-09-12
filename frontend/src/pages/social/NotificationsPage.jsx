import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Compass,
  UserPlus,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import moment from "moment";
import { useNotificationContext } from "../../context/NotificationContext";
import { getAvatar } from "../../utils/chat/chatHelpers";
import { chatService } from "../../services/chatService";

const CATEGORIES = [
  { key: "All", label: "All", icon: Bell },
  { key: "Journey", label: "Journey", icon: Compass },
  { key: "Social", label: "Social", icon: UserPlus },
  { key: "Messages", label: "Messages", icon: MessageSquare },
  { key: "Safety", label: "Safety", icon: ShieldAlert },
];

const getNormalizedCategory = (notif) => {
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
      icon: <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />,
      bg: "bg-rose-50 text-rose-600 border-rose-200",
      badge: "Emergency Alert",
      colorType: "danger",
      isEmergency: true,
    };
  }

  if (t.includes("warning") || t.includes("admin_warning")) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50 text-amber-600 border-amber-200",
      badge: "Safety Warning",
      colorType: "warning",
    };
  }

  if (
    t.includes("cancelled") ||
    t.includes("rejected") ||
    t.includes("reject")
  ) {
    return {
      icon: <X className="w-5 h-5 text-rose-500" />,
      bg: "bg-rose-50 text-rose-500 border-rose-100",
      badge: "Declined",
      colorType: "danger",
    };
  }

  if (t.includes("safe") || t.includes("checkin")) {
    return {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      badge: "Safe Check-in",
      colorType: "success",
    };
  }

  if (
    t.includes("accepted") ||
    t.includes("approved") ||
    t.includes("accept") ||
    t.includes("completed")
  ) {
    return {
      icon: <CheckCheck className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      badge: "Accepted",
      colorType: "success",
    };
  }

  if (
    t.includes("message") ||
    t.includes("chat") ||
    t.includes("direct") ||
    c === "messages" ||
    c === "message"
  ) {
    return {
      icon: <MessageSquare className="w-5 h-5 text-sky-600" />,
      bg: "bg-sky-50 text-sky-600 border-sky-200",
      badge: t === "message_request" ? "Message Request" : "Message",
      colorType: "primary",
    };
  }

  if (
    t.includes("journey") ||
    t.includes("trip") ||
    t.includes("join")
  ) {
    return {
      icon: <Compass className="w-5 h-5 text-brand" />,
      bg: "bg-brand-50 text-brand border-brand-100",
      badge: "Journey",
      colorType: "primary",
    };
  }

  if (t.includes("follow")) {
    return {
      icon: <UserPlus className="w-5 h-5 text-brand" />,
      bg: "bg-brand-50 text-brand border-brand-100",
      badge: "Social",
      colorType: "primary",
    };
  }

  if (t.includes("like") || t.includes("reaction")) {
    return {
      icon: <Sparkles className="w-5 h-5 text-brand fill-brand" />,
      bg: "bg-primary-50 text-brand border-primary-100",
      badge: "Interaction",
      colorType: "primary",
    };
  }

  return {
    icon: <Bell className="w-5 h-5 text-brand" />,
    bg: "bg-brand-50 text-brand border-brand-100",
    badge: "Update",
    colorType: "primary",
  };
};

const NotificationsPage = () => {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    counts,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    handleAcceptJourneyInvitation,
    handleRejectJourneyInvitation,
    handleAcceptFollow,
    handleRejectFollow,
    handleAcceptMessage,
    handleRejectMessage,
    handleManageJoin,
  } = useNotificationContext();

  const [activeTab, setActiveTab] = useState("All");
  const [filterRead, setFilterRead] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab !== "All") {
        if (getNormalizedCategory(n) !== activeTab) return false;
      }

      if (filterRead === "unread" && n.isRead) return false;
      if (filterRead === "read" && !n.isRead) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();

        const sender = (
          n.sender?.name ||
          n.sender?.username ||
          ""
        ).toLowerCase();

        const text = (
          n.message ||
          n.title ||
          ""
        ).toLowerCase();

        return sender.includes(q) || text.includes(q);
      }

      return true;
    });
  }, [notifications, activeTab, filterRead, searchQuery]);

  const handleNotificationClick = async (n) => {
    const notifId = n._id || n.id;

    if (!n.isRead && notifId) {
      await markAsRead(notifId);
    }

    if (n.link) {
      navigate(n.link);
      return;
    }

    const type = (n.type || "").toLowerCase();

    if (n.journey || type.includes("journey") || type.includes("invite")) {
      const journeyId =
        typeof n.journey === "object"
          ? n.journey?._id
          : n.journey;

      if (journeyId) {
        navigate(`/social/journeys/${journeyId}`);
        return;
      }

      navigate("/social/journeys");
      return;
    }

    if (
      n.group ||
      type.includes("group") ||
      type.includes("join_request")
    ) {
      const groupId =
        typeof n.group === "object"
          ? n.group?._id
          : n.group;

      if (groupId) {
        navigate(`/social/buddy/${groupId}`);
        return;
      }

      navigate("/social/buddy");
      return;
    }

    if (
      n.room ||
      type.includes("message") ||
      type.includes("chat") ||
      type.includes("direct")
    ) {
      const roomId =
        typeof n.room === "object"
          ? n.room?._id
          : n.room;

      if (roomId) {
        navigate(`/social/chat/${roomId}`);
        return;
      }

      const targetUserId =
        n.sender?._id ||
        n.sender?.id;

      if (targetUserId) {
        try {
          const directRoomId =
            await chatService.getDirectRoomId(targetUserId);

          if (directRoomId) {
            navigate(`/social/chat/${directRoomId}`);
            return;
          }
        } catch (error) {
          console.error("Failed to get direct room:", error);
        }
      }

      navigate("/social/chat");
      return;
    }

    if (type.includes("follow")) {
      const actorId =
        n.sender?._id ||
        n.sender?.id ||
        (typeof n.sender === "string" ? n.sender : null);

      if (actorId) {
        navigate(`/profile/${actorId}`);
        return;
      }

      navigate("/profile");
      return;
    }

    if (n.story || type.includes("story")) {
      const dispatchId =
        typeof n.story === "object"
          ? n.story?._id
          : n.story;

      navigate("/", {
        state: dispatchId ? { dispatchId } : undefined,
      });

      return;
    }

    if (
      n.post ||
      type.includes("post") ||
      type.includes("memory")
    ) {
      const memoryId =
        typeof n.post === "object"
          ? n.post?._id
          : n.post;

      const actorId =
        n.sender?._id ||
        n.sender?.id;

      if (memoryId && actorId) {
        navigate(`/profile/${actorId}?postId=${memoryId}`);
      } else {
        navigate(actorId ? `/profile/${actorId}` : "/");
      }

      return;
    }

    if (
      type.includes("sos") ||
      type.includes("emergency")
    ) {
      navigate("/emergency-contacts");
      return;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 font-heading">
                Notifications
              </h1>

              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Stay updated with trips, messages, interactions, and safety alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshNotifications()}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.key;
              const countKey = cat.key.toLowerCase();

              const badgeCount =
                cat.key === "All"
                  ? counts.all || notifications.length
                  : counts[countKey] || 0;

              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveTab(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-brand text-white shadow-sm shadow-brand/25"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />

                  <span>{cat.label}</span>

                  {badgeCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Sub-filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand focus:bg-white transition-all text-slate-800 font-medium"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">
                Filter:
              </span>

              {["all", "unread", "read"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterRead(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    filterRead === f
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300 mb-4">
                <Bell className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-slate-800 font-heading">
                No notifications found
              </h3>

              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No notifications matching your search query."
                  : filterRead === "unread"
                  ? "You don't have any unread notifications right now."
                  : "All caught up! Notifications about your journeys, messages, and social updates will show up here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const notifId = (
                notif._id ||
                notif.id
              ).toString();

              const visuals = getNotificationVisuals(
                notif.type,
                notif.category
              );

              const senderName =
                notif.sender?.name ||
                notif.sender?.username ||
                "Go YatriGo";

              const isUnread = !notif.isRead;
              const type = (notif.type || "").toLowerCase();

              const isJourneyInvite =
                type === "journey_invitation" &&
                notif.invitation;

              const isFollowRequest =
                type === "follow_request";

              const isMessageRequest =
                type === "message_request";

              const isJoinRequest =
                (
                  type === "join_request" ||
                  type === "journey_join_request"
                ) &&
                (notif.group || notif.journey);

              return (
                <div
                  key={notifId}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isUnread
                      ? "bg-white border-brand-200 shadow-xs ring-1 ring-brand-100"
                      : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Actor Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={getAvatar(notif.sender, senderName)}
                      alt={senderName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />

                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${visuals.bg}`}
                    >
                      {visuals.icon}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {notif.title || senderName}
                      </span>

                      {visuals.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {visuals.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                      {notif.message ||
                        notif.content ||
                        notif.text}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />

                      <span>
                        {moment(notif.createdAt).fromNow()}
                      </span>

                      {notif.link && (
                        <>
                          <span>•</span>

                          <span className="text-brand flex items-center gap-1 font-semibold hover:underline">
                            View details
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </>
                      )}
                    </div>

                    {/* Inline Action Buttons */}
                    {isUnread && (
                      <div
                        className="mt-3 flex items-center gap-2 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Journey Invitation */}
                        {isJourneyInvite && (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleAcceptJourneyInvitation(
                                  notif.invitation
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              Accept Squad Invite
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleRejectJourneyInvitation(
                                  notif.invitation
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {/* Follow Request */}
                        {isFollowRequest && (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleAcceptFollow(
                                  notif.sender?._id ||
                                    notif.sender,
                                  notifId
                                );

                                setIsProcessing(false);
                              }}
                              className="w-[145px] h-10 inline-flex items-center justify-center bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                            >
                              Accept Follow
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleRejectFollow(
                                  notif.sender?._id ||
                                    notif.sender,
                                  notifId
                                );

                                setIsProcessing(false);
                              }}
                              className="w-[145px] h-10 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                            >
                              Decline Follow
                            </button>
                          </>
                        )}

                        {/* Join Request */}
                        {isJoinRequest && (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleManageJoin(
                                  notif.group ||
                                    notif.journey,
                                  notif.sender?._id ||
                                    notif.sender,
                                  "accept",
                                  notif.entityId ||
                                    notif.journeyJoinRequest
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              Approve Join
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                await handleManageJoin(
                                  notif.group ||
                                    notif.journey,
                                  notif.sender?._id ||
                                    notif.sender,
                                  "reject",
                                  notif.entityId ||
                                    notif.journeyJoinRequest
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {/* Message Request */}
                        {isMessageRequest && (
                          <>
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                const roomId =
                                  typeof notif.room === "object"
                                    ? notif.room?._id
                                    : (
                                        notif.room ||
                                        notif.entityId
                                      );

                                await handleAcceptMessage(
                                  roomId,
                                  notifId
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              Accept Chat
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setIsProcessing(true);

                                const roomId =
                                  typeof notif.room === "object"
                                    ? notif.room?._id
                                    : (
                                        notif.room ||
                                        notif.entityId
                                      );

                                await handleRejectMessage(
                                  roomId,
                                  notifId
                                );

                                setIsProcessing(false);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Decline Chat
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notifId);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-50 rounded-lg transition-all cursor-pointer"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notifId);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clear All Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-bold text-slate-900 font-heading">
              Clear All Notifications?
            </h4>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently clear your notifications history? This action cannot be undone.
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
                className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
