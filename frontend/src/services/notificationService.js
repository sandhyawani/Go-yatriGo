import axios from "../api/axios";

export const notificationService = {
  getNotifications: async () => {
    const res = await axios.get("/notifications", { withCredentials: true });
    return res.data;
  },

  getJourneyInvitations: async () => {
    const res = await axios.get("/journeys/invitations/my?status=pending", {
      withCredentials: true,
    });
    return res.data;
  },

  markAllRead: async () => {
    const res = await axios.put("/notifications/read-all", {}, { withCredentials: true });
    return res.data;
  },

  markAsRead: async (notificationId) => {
    const res = await axios.put(
      `/notifications/${notificationId}/read`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  acceptFollowRequest: async (requesterId) => {
    const res = await axios.post(
      `/users/${requesterId}/follow-request/accept`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  rejectFollowRequest: async (requesterId) => {
    const res = await axios.post(
      `/users/${requesterId}/follow-request/reject`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  acceptMessageRequest: async (roomId) => {
    const res = await axios.put(
      `/chat/direct/${roomId}/accept`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  rejectMessageRequest: async (roomId) => {
    const res = await axios.put(
      `/chat/direct/${roomId}/decline`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  manageJoinRequest: async (groupId, requestId, status) => {
    const res = await axios.post(
      `/social/buddy/manage-request/${groupId}`,
      { requestId, status },
      { withCredentials: true }
    );
    return res.data;
  },

  searchSocial: async (query) => {
    const res = await axios.get(
      `/social/search?q=${encodeURIComponent(query)}`,
      { withCredentials: true }
    );
    return res.data;
  }
};

