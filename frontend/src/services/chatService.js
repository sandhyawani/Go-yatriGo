import axios from "../api/axios";

export const chatService = {
  getRooms: async () => {
    const res = await axios.get("/chat/rooms", { withCredentials: true });
    return res.data;
  },

  getDirectRoom: async (targetUserId) => {
    const res = await axios.post(
      `/chat/room/direct/${targetUserId}`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  getRoomMessages: async (roomId, page, limit = 50) => {
    const res = await axios.get(
      `/chat/room/${roomId}/messages?page=${page}&limit=${limit}`,
      { withCredentials: true }
    );
    return res.data;
  },

  sendMessage: async (roomId, payload) => {
    const res = await axios.post(
      `/chat/room/${roomId}/message`,
      payload,
      { withCredentials: true }
    );
    return res.data;
  },

  uploadFile: async (formData) => {
    const res = await axios.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  handleRequestAction: async (roomId, action) => {
    const res = await axios.put(
      `/chat/room/${roomId}/${action}`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  deleteMessageForMe: async (roomId, messageId) => {
    const res = await axios.delete(
      `/chat/room/${roomId}/messages/${messageId}/delete-for-me`,
      { withCredentials: true }
    );
    return res.data;
  },

  unsendMessage: async (roomId, messageId) => {
    const res = await axios.delete(
      `/chat/room/${roomId}/messages/${messageId}/unsend`,
      { withCredentials: true }
    );
    return res.data;
  },

  clearChat: async (roomId) => {
    const res = await axios.delete(`/chat/room/${roomId}/clear`, {
      withCredentials: true,
    });
    return res.data;
  },

  deleteChat: async (roomId) => {
    const res = await axios.delete(`/chat/room/${roomId}/delete-chat`, {
      withCredentials: true,
    });
    return res.data;
  },

  reportUser: async (userId, reason) => {
    const res = await axios.post(
      `/users/report/${userId}`,
      { reason },
      { withCredentials: true }
    );
    return res.data;
  },

  blockUser: async (userId) => {
    const res = await axios.post(
      `/users/block/${userId}`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  unblockUser: async (userId) => {
    const res = await axios.post(
      `/users/unblock/${userId}`,
      {},
      { withCredentials: true }
    );
    return res.data;
  },

  getUserProfile: async (userId) => {
    const res = await axios.get(`/users/${userId}`, {
      withCredentials: true,
    });
    return res.data;
  },

  searchUsersGlobal: async (query) => {
    const res = await axios.get(`/users/search?q=${encodeURIComponent(query)}`, {
      withCredentials: true,
    });
    return res.data;
  }
};

