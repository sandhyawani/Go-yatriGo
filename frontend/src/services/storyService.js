import axios from "../api/axios";

export const storyService = {
  getStoryDetails: async (dispatchId) => {
    const res = await axios.get(`/social/story/${dispatchId}`, {
      withCredentials: true
    });
    return res.data;
  }
};