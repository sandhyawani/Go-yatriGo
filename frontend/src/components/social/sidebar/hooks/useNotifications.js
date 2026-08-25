import { useNotificationContext } from "../../../../context/NotificationContext";

export const useNotifications = () => {
  const context = useNotificationContext();
  return {
    ...context,
    notifCategory: context.activeCategory,
    setNotifCategory: context.setActiveCategory,
    handleMarkAllRead: context.markAllAsRead,
    removeNotification: context.deleteNotification,
    journeyInvitations: []
  };
};

export default useNotifications;
