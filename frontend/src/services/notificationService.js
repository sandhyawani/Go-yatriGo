import axios from "../api/axios";

export const notificationService = {
  getNotifications: async (category = "All") => {
    const params = category && category !== "All" ? `?category=${category}` : "";
    const res = await axios.get(`/notifications${params}`, { withCredentials: true });
    return res.data;
  },

  getJourneyInvitations: async () => {
    const res = await axios.get("/journeys/invitations/my?status=pending", {
      withCredentials: true
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

  deleteNotification: async (notificationId) => {
    const res = await axios.delete(`/notifications/${notificationId}`, {
      withCredentials: true
    });
    return res.data;
  },

  clearAllNotifications: async () => {
    const res = await axios.delete(`/notifications/clear-all`, {
      withCredentials: true
    });
    return res.data;
  },

  acceptJourneyInvitation: async (invitationId) => {
    const res = await axios.post(
      `/journeys/invitations/${invitationId}/accept`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  rejectJourneyInvitation: async (invitationId) => {
    const res = await axios.post(
      `/journeys/invitations/${invitationId}/reject`,
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
  },

  getSentRequests: async () => {
    const res = await axios.get("/notifications/sent", { withCredentials: true });
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
        data: { cancelType: type, cancelId: targetId },
        withCredentials: true
      });
      return res.data;
    }

    const res = await axios.delete(`/notifications/sent/${requestOrId}`, {
      data: { cancelType },
      withCredentials: true
    });
    return res.data;
  },

  cancelFollowRequest: async (targetUserId) => {
    const res = await axios.delete(`/users/follow-requests/${targetUserId}`, {
      withCredentials: true
    });
    return res.data;
  },

  cancelBuddyJoinRequest: async (groupId) => {
    const res = await axios.post(
      `/social/buddy/cancel-request/${groupId}`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  cancelJourneyJoinRequest: async (requestId) => {
    const res = await axios.delete(`/journeys/join-requests/${requestId}`, {
      withCredentials: true
    });
    return res.data;
  },

  cancelJourneyInvitation: async (invitationId) => {
    const res = await axios.delete(`/journeys/invitations/${invitationId}/cancel`, {
      withCredentials: true
    });
    return res.data;
  }
};

export default notificationService;