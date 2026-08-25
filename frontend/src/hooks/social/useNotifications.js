import { useNotificationContext } from "../../context/NotificationContext";

export const useNotifications = () => {
  const context = useNotificationContext();
  return {
    ...context,
    markAllRead: context.markAllAsRead,
    journeyInvitations: []
  };
};

export default useNotifications;