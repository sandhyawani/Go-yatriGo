import axios from "../api/axios";

export const profileService = {
  getProfile: (userId) => 
    axios.get(`/users/${userId}`, { withCredentials: true }),

  getSelfProfile: (selfId) => 
    axios.get(`/users/${selfId}`, { withCredentials: true }),

  getUserMemories: (userId, page = 1, limit = 9) => 
    axios.get(`/social/memory/user/${userId}?page=${page}&limit=${limit}`, { withCredentials: true }),

  getUserTrips: (userId) => 
    axios.get(`/groups/user/${userId}`, { withCredentials: true }),

  getUserStories: (userId) => 
    axios.get("/social/story", { params: { userId }, withCredentials: true }),

  getSavedMemories: () => 
    axios.get("/social/memory/save", { withCredentials: true }),

  getFeltMemories: (userId) => 
    axios.get(`/social/memory/felt/${userId}`, { withCredentials: true }),

  followToggle: (endpoint) => 
    axios.post(endpoint, {}, { withCredentials: true }),

  rateUser: (ratedUserId, rating) => 
    axios.post(`/users/rate/${ratedUserId}`, { rating }, { withCredentials: true }),

  reportUser: (reportedUserId, reason) => 
    axios.post("/users/report", { reportedUserId, reason }, { withCredentials: true }),

  blockToggle: (endpoint) => 
    axios.post(endpoint, {}, { withCredentials: true }),

  getRelations: (userId, type) => 
    axios.get(`/users/${userId}/${type}`, { withCredentials: true }),

  likeMemory: (postId) => 
    axios.post(`/social/memory/like/${postId}`, {}, { withCredentials: true }),

  addComment: (postId, text) => 
    axios.post(`/social/memory/comment/${postId}`, { text }, { withCredentials: true }),

  deleteComment: (postId, commentId) => 
    axios.post(`/social/memory/comment/${postId}/${commentId}/delete`, {}, { withCredentials: true }),

  editMemory: (postId, formData) => 
    axios.put(`/social/memory/${postId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }),

  deleteMemory: (postId) => 
    axios.delete(`/social/memory/${postId}`, { withCredentials: true }),

  editStory: (storyId, data) => 
    axios.put(`/social/story/${storyId}`, data, { withCredentials: true }),

  deleteStory: (storyId) => 
    axios.delete(`/social/story/${storyId}`, { withCredentials: true }),

  getSelfData: () =>
    axios.get("/users/me", { withCredentials: true }),

  acceptFollowRequest: (userId) =>
    axios.post(`/users/${userId}/follow-request/accept`, {}, { withCredentials: true }),

  declineFollowRequest: (userId) =>
    axios.post(`/users/${userId}/follow-request/reject`, {}, { withCredentials: true }),

  cancelFollowRequest: (userId) =>
    axios.delete(`/users/follow-requests/${userId}`, { withCredentials: true }),
};

export default profileService;
