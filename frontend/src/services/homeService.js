import axios from "../api/axios";

export const homeService = {
  fetchMemories: (pageNum) =>
    axios.get(`/social/memory?page=${pageNum}&limit=10`, { withCredentials: true }),

  fetchStories: () =>
    axios.get("/social/story", { withCredentials: true }),

  fetchSuggestions: () =>
    axios.get("/users/suggestions", { withCredentials: true }),

  fetchTrips: () =>
    axios.get("/social/buddy", { withCredentials: true }),

  fetchSavedPostIds: () =>
    axios.get("/social/memory/save?idsOnly=true", { withCredentials: true }),

  fetchComments: (postId) =>
    axios.get(`/social/memory/${postId}/comments`, { withCredentials: true }),

  submitComment: (postId, text) =>
    axios.post(`/social/memory/comment/${postId}`, { text }, { withCredentials: true }),

  deleteComment: (postId, commentId) =>
    axios.delete(`/social/memory/${postId}/comment/${commentId}`, { withCredentials: true }),

  likePost: (postId) =>
    axios.post(`/social/memory/like/${postId}`, {}, { withCredentials: true }),

  savePost: (postId) =>
    axios.post(`/social/memory/save/${postId}`, {}, { withCredentials: true }),

  deleteSavedPost: (postId) =>
    axios.delete(`/social/memory/save/${postId}`, { withCredentials: true }),

  followUser: (userId) =>
    axios.post(`/users/${userId}/follow`, {}, { withCredentials: true }),

  unfollowUser: (userId) =>
    axios.post(`/users/${userId}/unfollow`, {}, { withCredentials: true }),

  createPost: (caption, location, tags, image) =>
    axios.post(
      "/social/memory",
      { caption, location, tags, image },
      { withCredentials: true }
    ),

  editPost: (postId, data) =>
    axios.put(`/social/memory/${postId}`, data, { withCredentials: true }),

  deletePost: (postId) =>
    axios.delete(`/social/memory/${postId}`, { withCredentials: true }),

  deleteStory: (storyId) =>
    axios.delete(`/social/story/${storyId}`, { withCredentials: true }),

  search: (query) =>
    axios.get(`/social/search?q=${encodeURIComponent(query)}`, { withCredentials: true }),
};

export default homeService;
