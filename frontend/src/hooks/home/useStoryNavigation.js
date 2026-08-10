import { useState, useCallback } from "react";

export const useStoryNavigation = (sortedStories, myUserId) => {
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [showViewersList, setShowViewersList] = useState(false);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [replyingToStory, setReplyingToStory] = useState(false);

  const nextStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      const activeId = (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString();
      if (activeId === myUserId) {
        setActiveStoryGroup(null);
      } else {
        const groupIdx = sortedStories.findIndex(
          (g) => (g.userId?._id || g.userId)?.toString() === activeId
        );
        if (groupIdx !== -1 && groupIdx < sortedStories.length - 1) {
          setActiveStoryGroup(sortedStories[groupIdx + 1]);
          setActiveStoryIndex(0);
        } else {
          setActiveStoryGroup(null);
        }
      }
    }
  }, [activeStoryGroup, activeStoryIndex, sortedStories, myUserId]);

  const prevStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      const activeId = (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString();
      if (activeId === myUserId) {
        setActiveStoryGroup(null);
      } else {
        const groupIdx = sortedStories.findIndex(
          (g) => (g.userId?._id || g.userId)?.toString() === activeId
        );
        if (groupIdx > 0) {
          const prevGroup = sortedStories[groupIdx - 1];
          setActiveStoryGroup(prevGroup);
          setActiveStoryIndex(prevGroup.stories.length - 1);
        } else {
          setActiveStoryGroup(null);
        }
      }
    }
  }, [activeStoryGroup, activeStoryIndex, sortedStories, myUserId]);

  const handleOpenStory = useCallback((group, index = 0) => {
    setActiveStoryGroup(group);
    setActiveStoryIndex(index);
  }, []);

  return {
    activeStoryGroup,
    setActiveStoryGroup,
    activeStoryIndex,
    setActiveStoryIndex,
    isStoryMuted,
    setIsStoryMuted,
    showViewersList,
    setShowViewersList,
    isStoryPaused,
    setIsStoryPaused,
    storyReplyText,
    setStoryReplyText,
    replyingToStory,
    setReplyingToStory,
    nextStory,
    prevStory,
    handleOpenStory,
  };
};

export default useStoryNavigation;
