import axios from "../api/axios";

export const storyService = {
  getStoryDetails: async (storyId) => {
    const res = await axios.get(`/social/story/${storyId}`, {
      withCredentials: true,
    });
    return res.data;
  }
};
