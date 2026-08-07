import { useState, useEffect } from "react";
import axios from "../../../../api/axios";
import { useNotificationSocket } from "./useNotificationSocket";

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [journeyInvitations, setJourneyInvitations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCategory, setNotifCategory] = useState("All");

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await axios.get("/notifications", {
            withCredentials: true,
          });
          if (res.data.success) {
            setNotifications(res.data.notifications || []);
            setUnreadCount(
              (res.data.notifications || []).filter((n) => !n.isRead).length
            );
          }
          const invRes = await axios.get(
            "/journeys/invitations/my?status=pending",
            { withCredentials: true }
          );
          if (invRes.data?.success) {
            setJourneyInvitations(invRes.data.invitations || []);
            setUnreadCount(
              (prev) => prev + (invRes.data.invitations?.length || 0)
            );
          }
        } catch (e) {
          console.error("Failed to fetch notifications", e);
        }
      };
      fetchNotifs();
    }
  }, [user]);

  useNotificationSocket(setNotifications, setUnreadCount);

  const handleMarkAllRead = async () => {
    try {
      await axios.put("/notifications/read-all", {}, { withCredentials: true });
      setNotifications((prev) => prev?.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`, { withCredentials: true });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete("/notifications/clear-all", { withCredentials: true });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const removeJourneyInvitation = (id) => {
    setJourneyInvitations((prev) => prev.filter((i) => i._id !== id));
  };

  return {
    notifications,
    setNotifications,
    journeyInvitations,
    unreadCount,
    notifCategory,
    setNotifCategory,
    handleMarkAllRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    removeNotification,
    removeJourneyInvitation,
  };
};
