import { useReducer, useEffect, useContext } from "react";
import { SocketContext } from "../../context/SocketContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { notificationService } from "../../services/notificationService";
import { socialReducer, initialSocialState } from "../../reducers/socialReducer";

export const useNotifications = (user) => {
  const socket = useContext(SocketContext);
  const [state, dispatch] = useReducer(socialReducer, initialSocialState);
  const { notifications, unreadCount, journeyInvitations } = state;

  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res.success) {
          dispatch({ type: "LOAD_NOTIFICATIONS", payload: res.notifications || [] });
        }
        const invRes = await notificationService.getJourneyInvitations();
        if (invRes?.success) {
          dispatch({ type: "LOAD_JOURNEY_INVITATIONS", payload: invRes.invitations || [] });
        }
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    };

    fetchNotifs();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNotif) => {
      console.log("[SOCKET RECEIVED] useNotifications — new_notification", newNotif);
      dispatch({ type: "ADD_NOTIFICATION", payload: newNotif });
    };
    console.log("[SOCKET REGISTER] useNotifications — new_notification");
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    return () => {
      console.log("[SOCKET CLEANUP] useNotifications — new_notification");
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch({ type: "MARK_ALL_NOTIFS_READ" });
    } catch (e) {}
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: "MARK_NOTIF_READ", payload: notificationId });
    } catch (e) {}
  };

  const removeJourneyInvitation = (invId) => {
    dispatch({ type: "REMOVE_JOURNEY_INVITATION", payload: invId });
  };

  return {
    notifications,
    unreadCount,
    journeyInvitations,
    markAllRead,
    markAsRead,
    removeJourneyInvitation,
    dispatch
  };
};
export default useNotifications;
