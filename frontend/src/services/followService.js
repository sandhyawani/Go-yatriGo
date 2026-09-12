import axiosInstance from "../api/axios";

/**
 * Standardized service for all user follow, unfollow, and follow-request actions.
 * Automatically relies on axiosInstance interceptors for authentication and credentials.
 */
export const followService = {
  /**
   * Follow a user (or send follow request if private).
   * @param {string} targetUserId
   */
  followUser: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.post(`/users/${id}/follow`);
    return res.data;
  },

  /**
   * Unfollow a user.
   * @param {string} targetUserId
   */
  unfollowUser: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.post(`/users/${id}/unfollow`);
    return res.data;
  },

  /**
   * Cancel a pending outgoing follow request.
   * @param {string} targetUserId
   */
  cancelFollowRequest: async (targetUserId) => {
    const id = typeof targetUserId === "object" && targetUserId !== null
      ? targetUserId._id || targetUserId.id
      : targetUserId;
    if (!id) throw new Error("Invalid target user ID");
    const res = await axiosInstance.delete(`/users/follow-requests/${id}`);
    return res.data;
  },

  /**
   * Accept an incoming follow request.
   * @param {string} requesterId
   */
  acceptFollowRequest: async (requesterId) => {
    const id = typeof requesterId === "object" && requesterId !== null
      ? requesterId._id || requesterId.id
      : requesterId;
    if (!id) throw new Error("Invalid requester ID");
    const res = await axiosInstance.post(`/users/${id}/follow-request/accept`);
    return res.data;
  },

  /**
   * Reject/decline an incoming follow request.
   * @param {string} requesterId
   */
  rejectFollowRequest: async (requesterId) => {
    const id = typeof requesterId === "object" && requesterId !== null
      ? requesterId._id || requesterId.id
      : requesterId;
    if (!id) throw new Error("Invalid requester ID");
    const res = await axiosInstance.post(`/users/${id}/follow-request/reject`);
    return res.data;
  },

  /**
   * Remove a follower from own followers list.
   * @param {string} followerId
   */
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
