import axios from "../api/axios";
import followService from "./followService";

const getAuthHeaders = () => {
  let token = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      token =
        user?.token ||
        user?.accessToken ||
        user?.access_token ||
        user?.details?.token ||
        user?.data?.token;
    }
    if (!token) {
      token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token");
    }
  } catch (e) {
    console.error("[NotificationService] Error reading auth token:", e);
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getRequestConfig = (extraConfig = {}) => ({
  withCredentials: true,
  ...extraConfig,
  headers: {
    ...getAuthHeaders(),
    ...(extraConfig.headers || {})
  }
});

export const notificationService = {
  getNotifications: async (category = "All") => {
    const params = category && category !== "All" ? `?category=${category}` : "";
    const res = await axios.get(`/notifications${params}`, getRequestConfig());
    return res.data;
  },

  getJourneyInvitations: async () => {
    const res = await axios.get("/journeys/invitations/my?status=pending", getRequestConfig());
    return res.data;
  },

  markAllRead: async () => {
    const res = await axios.put("/notifications/read-all", {}, getRequestConfig());
    return res.data;
  },

  markAsRead: async (notificationId) => {
    const res = await axios.put(
      `/notifications/${notificationId}/read`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  deleteNotification: async (notificationId) => {
    const res = await axios.delete(`/notifications/${notificationId}`, getRequestConfig());
    return res.data;
  },

  clearAllNotifications: async () => {
    const res = await axios.delete(`/notifications/clear-all`, getRequestConfig());
    return res.data;
  },

  acceptJourneyInvitation: async (invitationId) => {
    const res = await axios.post(
      `/journeys/invitations/${invitationId}/accept`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  rejectJourneyInvitation: async (invitationId) => {
    const res = await axios.post(
      `/journeys/invitations/${invitationId}/reject`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  acceptFollowRequest: async (requesterId) => {
    return followService.acceptFollowRequest(requesterId);
  },

  rejectFollowRequest: async (requesterId) => {
    return followService.rejectFollowRequest(requesterId);
  },

  acceptMessageRequest: async (roomId) => {
    const res = await axios.put(
      `/chat/room/${roomId}/accept`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  rejectMessageRequest: async (roomId) => {
    const res = await axios.put(
      `/chat/room/${roomId}/decline`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  manageJoinRequest: async (groupId, requestId, status) => {
    const res = await axios.post(
      `/social/buddy/manage-request/${groupId}`,
      { requestId, status },
      getRequestConfig()
    );
    return res.data;
  },

  searchSocial: async (query) => {
    const res = await axios.get(
      `/social/search?q=${encodeURIComponent(query)}`,
      getRequestConfig()
    );
    return res.data;
  },

  getSentRequests: async () => {
    const res = await axios.get("/notifications/sent", getRequestConfig());
    return res.data;
  },

  cancelSentRequest: async (requestOrId, cancelType) => {
    if (typeof requestOrId === "object" && requestOrId !== null) {
      const type = cancelType || requestOrId.cancelType;
      const targetId = requestOrId.cancelId || requestOrId.targetId || requestOrId._id || requestOrId.id;

      if (type === "follow") {
        return notificationService.cancelFollowRequest(targetId);
      }
      if (type === "buddy") {
        return notificationService.cancelBuddyJoinRequest(targetId);
      }
      if (type === "journey_join") {
        return notificationService.cancelJourneyJoinRequest(targetId);
      }
      if (type === "journey_invite") {
        return notificationService.cancelJourneyInvitation(targetId);
      }

      const res = await axios.delete(`/notifications/sent/${targetId}`, {
        ...getRequestConfig(),
        data: { cancelType: type, cancelId: targetId }
      });
      return res.data;
    }

    const res = await axios.delete(`/notifications/sent/${requestOrId}`, {
      ...getRequestConfig(),
      data: { cancelType }
    });
    return res.data;
  },

  cancelFollowRequest: async (targetUserId) => {
    return followService.cancelFollowRequest(targetUserId);
  },

  cancelBuddyJoinRequest: async (groupId) => {
    const res = await axios.post(
      `/social/buddy/cancel-request/${groupId}`,
      {},
      getRequestConfig()
    );
    return res.data;
  },

  cancelJourneyJoinRequest: async (requestId) => {
    const res = await axios.delete(`/journeys/join-requests/${requestId}`, getRequestConfig());
    return res.data;
  },

  cancelJourneyInvitation: async (invitationId) => {
    const res = await axios.delete(`/journeys/invitations/${invitationId}/cancel`, getRequestConfig());
    return res.data;
  }
};

export default notificationService;