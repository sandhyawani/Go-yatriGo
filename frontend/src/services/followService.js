import axiosInstance from "../api/axios";

export const followService = {
  followUser: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.post(`/users/${id}/follow`);
    return res.data;
  },

  unfollowUser: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.post(`/users/${id}/unfollow`);
    return res.data;
  },

  cancelFollowRequest: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.delete(`/users/follow-requests/${id}`);
    return res.data;
  },

  acceptFollowRequest: async (requesterId) => {
    const id = typeof requesterId === "object" && requesterId !== null
      ? requesterId._id || requesterId.id
      : requesterId;
    if (!id) throw new Error("Invalid requester ID");
    const res = await axiosInstance.post(`/users/${id}/follow-request/accept`);
    return res.data;
  },

  rejectFollowRequest: async (requesterId) => {
    const id = typeof requesterId === "object" && requesterId !== null
      ? requesterId._id || requesterId.id
      : requesterId;
    if (!id) throw new Error("Invalid requester ID");
    const res = await axiosInstance.post(`/users/${id}/follow-request/reject`);
    return res.data;
  },

  removeFollower: async (followerId) => {
    const id = typeof followerId === "object" && followerId !== null
      ? followerId._id || followerId.id
      : followerId;
    if (!id) throw new Error("Invalid follower ID");
    const res = await axiosInstance.delete(`/users/me/followers/${id}`);
    return res.data;
  }
};

export default followService;
