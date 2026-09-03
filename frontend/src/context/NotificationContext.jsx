import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "./authContext";
import { SocketContext } from "./SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { notificationService } from "../services/notificationService";
import { showToast } from "../utils/showToast";

const NotificationContext = createContext(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  const [notifications, setNotifications] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [notificationTab, setNotificationTab] = useState("received"); // 'received' | 'sent'
  const [unreadCount, setUnreadCount] = useState(0);
  const [counts, setCounts] = useState({
    all: 0,
    journey: 0,
    social: 0,
    messages: 0,
    safety: 0,
    unread: 0
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchSentRequests = useCallback(async () => {
    if (!user) {
      setSentRequests([]);
      return;
    }
    try {
      setSentLoading(true);
      const data = await notificationService.getSentRequests();
      if (data && data.success) {
        setSentRequests(data.sentRequests || []);
      }
    } catch (err) {
      console.error("[NotificationProvider] Failed to fetch sent requests:", err);
    } finally {
      setSentLoading(false);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setCounts({ all: 0, journey: 0, social: 0, messages: 0, safety: 0, unread: 0 });
      return;
    }

    try {
      setLoading(true);
      const data = await notificationService.getNotifications("All");
      if (data && data.success) {
        const notifs = data.notifications || [];
        setNotifications(notifs);

        if (data.counts) {
          setCounts(data.counts);
          setUnreadCount(data.counts.unread || notifs.filter((n) => !n.isRead).length);
        } else {
          const calculatedUnread = notifs.filter((n) => !n.isRead).length;
          setUnreadCount(calculatedUnread);
          setCounts({
            all: notifs.length,
            journey: notifs.filter((n) => n.category === "Journey").length,
            social: notifs.filter((n) => n.category === "Social").length,
            messages: notifs.filter((n) => n.category === "Messages").length,
            safety: notifs.filter((n) => n.category === "Safety").length,
            unread: calculatedUnread
          });
        }
      }
    } catch (err) {
      console.error("[NotificationProvider] Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchSentRequests();
  }, [fetchNotifications, fetchSentRequests]);

  // Single authoritative Socket listener for notifications and sent request updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (newNotif) => {
      if (!newNotif || (!newNotif._id && !newNotif.id)) return;
      const notifId = (newNotif._id || newNotif.id).toString();

      setNotifications((prev) => {
        if (prev.some((n) => (n._id || n.id).toString() === notifId)) {
          return prev;
        }
        return [newNotif, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      let catKey = (newNotif.category || "").toLowerCase();
      if (catKey === "message" || catKey === "chat") catKey = "messages";
      if (catKey === "safe" || catKey === "emergency") catKey = "safety";
      if (!catKey || (catKey !== "journey" && catKey !== "social" && catKey !== "messages" && catKey !== "safety")) {
        const type = (newNotif.type || "").toLowerCase();
        if (type.includes("journey") || type.includes("trip") || type.includes("group") || type.includes("join")) catKey = "journey";
        else if (type.includes("message") || type.includes("chat") || type.includes("direct")) catKey = "messages";
        else if (type.includes("safe") || type.includes("sos") || type.includes("emergency") || type.includes("warning")) catKey = "safety";
        else catKey = "social";
      }

      setCounts((prev) => ({
        ...prev,
        all: (prev.all || 0) + 1,
        [catKey]: (prev[catKey] || 0) + 1,
        unread: (prev.unread || 0) + 1
      }));
    };

    const handleSentRequestUpdated = () => {
      fetchSentRequests();
    };

    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, handleSentRequestUpdated);
    socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, handleSentRequestUpdated);
    socket.on("follow_request_sent", handleSentRequestUpdated);
    socket.on("join_request_sent", handleSentRequestUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, handleSentRequestUpdated);
      socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, handleSentRequestUpdated);
      socket.off("follow_request_sent", handleSentRequestUpdated);
      socket.off("join_request_sent", handleSentRequestUpdated);
    };
  }, [socket, user, fetchSentRequests]);

  const handleCancelSentRequest = async (reqItem) => {
    if (!reqItem) return false;
    try {
      const targetId = reqItem.cancelId || reqItem.targetId || reqItem._id || reqItem.id;
      // Optimistic removal
      setSentRequests((prev) => prev.filter((r) => (r._id || r.id) !== (reqItem._id || reqItem.id)));

      await notificationService.cancelSentRequest(reqItem);
      showToast.info("Request cancelled successfully");
      return true;
    } catch (err) {
      console.error("[NotificationProvider] Error cancelling sent request:", err);
      showToast.error(err.response?.data?.message || "Failed to cancel request");
      fetchSentRequests();
      return false;
    }
  };

  const markAsRead = async (id) => {
    if (!id) return;
    try {
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id).toString() === id.toString() ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));

      await notificationService.markAsRead(id);
    } catch (err) {
      console.error("[NotificationProvider] Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setCounts((prev) => ({ ...prev, unread: 0 }));

      await notificationService.markAllRead();
      showToast.success("All notifications marked as read");
    } catch (err) {
      console.error("[NotificationProvider] Error marking all read:", err);
      showToast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (id) => {
    if (!id) return;
    try {
      const target = notifications.find((n) => (n._id || n.id).toString() === id.toString());
      const isTargetUnread = target && !target.isRead;
      const targetCategory = (target?.category || "Social").toLowerCase();

      setNotifications((prev) =>
        prev.filter((n) => (n._id || n.id).toString() !== id.toString())
      );

      if (isTargetUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setCounts((prev) => ({
        ...prev,
        all: Math.max(0, (prev.all || 1) - 1),
        [targetCategory]: Math.max(0, (prev[targetCategory] || 1) - 1),
        unread: isTargetUnread ? Math.max(0, (prev.unread || 1) - 1) : prev.unread
      }));

      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error("[NotificationProvider] Error deleting notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await notificationService.clearAllNotifications();
      const preservedTypes = [
        "follow_request",
        "journey_invitation",
        "message_request",
        "join_request",
        "journey_join_request"
      ];
      
      const remainingNotifications = notifications.filter(n => preservedTypes.includes(n.type));
      setNotifications(remainingNotifications);
      setUnreadCount(res?.unreadCount || 0);
      
      const newCounts = remainingNotifications.reduce((acc, notif) => {
        acc.all++;
        if (!notif.isRead) acc.unread++;
        const cat = (notif.category || "").toLowerCase();
        if (acc[cat] !== undefined) acc[cat]++;
        return acc;
      }, {
        all: 0,
        journey: 0,
        social: 0,
        messages: 0,
        safety: 0,
        unread: 0
      });
      setCounts(newCounts);
      
      showToast.success("Notifications cleared (pending requests preserved)");
      return true;
    } catch (err) {
      console.error("[NotificationProvider] Error clearing notifications:", err);
      showToast.error("Failed to clear notifications");
      return false;
    }
  };

  const handleAcceptJourneyInvitation = async (invitationId, notificationId) => {
    try {
      const res = await notificationService.acceptJourneyInvitation(invitationId);
      if (res && res.success) {
        showToast.success("Journey invitation accepted!");
        if (notificationId) {
          await markAsRead(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to accept invitation");
      return false;
    }
  };

  const handleRejectJourneyInvitation = async (invitationId, notificationId) => {
    try {
      const res = await notificationService.rejectJourneyInvitation(invitationId);
      if (res && res.success) {
        showToast.info("Journey invitation declined");
        if (notificationId) {
          deleteNotification(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to decline invitation");
      return false;
    }
  };

  const handleAcceptFollow = async (requesterId, notificationId) => {
    try {
      const res = await notificationService.acceptFollowRequest(requesterId);
      if (res && res.success) {
        showToast.success("Follow request accepted");
        if (notificationId) {
          deleteNotification(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to accept request");
      return false;
    }
  };

  const handleRejectFollow = async (requesterId, notificationId) => {
    try {
      const res = await notificationService.rejectFollowRequest(requesterId);
      if (res && res.success) {
        showToast.info("Follow request declined");
        if (notificationId) {
          deleteNotification(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to decline request");
      return false;
    }
  };

  const handleAcceptMessage = async (roomId, notificationId) => {
    try {
      const res = await notificationService.acceptMessageRequest(roomId);
      if (res && res.success) {
        showToast.success("Message request accepted");
        if (notificationId) {
          await markAsRead(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to accept chat request");
      return false;
    }
  };

  const handleRejectMessage = async (roomId, notificationId) => {
    try {
      const res = await notificationService.rejectMessageRequest(roomId);
      if (res && res.success) {
        showToast.info("Message request declined");
        if (notificationId) {
          deleteNotification(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to decline chat request");
      return false;
    }
  };

  const handleManageJoin = async (groupId, requestId, status, notificationId) => {
    try {
      const res = await notificationService.manageJoinRequest(groupId, requestId, status);
      if (res && res.success) {
        showToast.success(`Join request ${status.toLowerCase()}`);
        if (notificationId) {
          await markAsRead(notificationId);
        }
        return true;
      }
      return false;
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to process join request");
      return false;
    }
  };

  const value = {
    notifications,
    sentRequests,
    sentCount: sentRequests.length,
    sentLoading,
    notificationTab,
    setNotificationTab,
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
    handleManageJoin,
    cancelSentRequest: handleCancelSentRequest,
    fetchSentRequests,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
