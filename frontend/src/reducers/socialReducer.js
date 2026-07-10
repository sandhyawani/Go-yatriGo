export const initialSocialState = {
  notifications: [],
  unreadCount: 0,
  journeyInvitations: [],
  searchResults: null,
  searchLoading: false,
  searchTab: "all"
};

export const socialReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_NOTIFICATIONS": {
      const notifications = action.payload || [];
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      return {
        ...state,
        notifications,
        unreadCount
      };
    }

    case "ADD_NOTIFICATION": {
      const newNotif = action.payload;
      return {
        ...state,
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    }

    case "LOAD_JOURNEY_INVITATIONS": {
      const invitations = action.payload || [];
      return {
        ...state,
        journeyInvitations: invitations,
        unreadCount: state.unreadCount + invitations.length
      };
    }

    case "MARK_ALL_NOTIFS_READ": {
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      };
    }

    case "MARK_NOTIF_READ": {
      const notifId = action.payload;
      const alreadyRead = state.notifications.find((n) => n._id === notifId)?.isRead;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === notifId ? { ...n, isRead: true } : n
        ),
        unreadCount: alreadyRead ? state.unreadCount : Math.max(0, state.unreadCount - 1)
      };
    }

    case "REMOVE_FOLLOW_REQUEST": {
      const requesterId = action.payload;
      const targetNotif = state.notifications.find(
        (n) => n.type === "follow_request" && n.sender?._id === requesterId
      );
      const isUnread = targetNotif && !targetNotif.isRead;
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => !(n.type === "follow_request" && n.sender?._id === requesterId)
        ),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }

    case "REMOVE_NOTIFICATION_BY_ID": {
      const notifId = action.payload;
      const targetNotif = state.notifications.find((n) => n._id === notifId);
      const isUnread = targetNotif && !targetNotif.isRead;
      return {
        ...state,
        notifications: state.notifications.filter((n) => n._id !== notifId),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }

    case "REMOVE_JOURNEY_INVITATION": {
      const invId = action.payload;
      return {
        ...state,
        journeyInvitations: state.journeyInvitations.filter((i) => i._id !== invId),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    }

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload
      };

    case "SET_SEARCH_RESULTS":
      return {
        ...state,
        searchResults: action.payload
      };

    case "SET_SEARCH_LOADING":
      return {
        ...state,
        searchLoading: action.payload
      };

    case "SET_SEARCH_TAB":
      return {
        ...state,
        searchTab: action.payload
      };

    default:
      return state;
  }
};
export default socialReducer;

