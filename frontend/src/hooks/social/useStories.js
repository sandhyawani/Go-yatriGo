import { useState } from "react";
import { storyService } from "../../services/storyService";

export const useStories = () => {
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const viewStory = async (storyId) => {
    try {
      const res = await storyService.getStoryDetails(storyId);
      return res;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return {
    activeStoryGroup,
    setActiveStoryGroup,
    activeStoryIndex,
    setActiveStoryIndex,
    viewStory
  };
};
export default useStories;

