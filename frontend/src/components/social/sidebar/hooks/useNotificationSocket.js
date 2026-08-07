import { useEffect, useContext } from "react";
import { SocketContext } from "../../../../context/SocketContext";
import { SOCKET_EVENTS } from "../../../../constants/socketEvents";

export const useNotificationSocket = (setNotifications, setUnreadCount) => {
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };
      socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      return () => socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    }
  }, [socket, setNotifications, setUnreadCount]);
};
