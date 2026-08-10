import React from "react";
import StoryViewer from "../../story/StoryViewer";

export const StoryViewerWrapper = ({
  activeStoryGroup,
  activeStoryIndex,
  myUserId,
  isStoryMuted,
  setIsStoryMuted,
  isStoryPaused,
  setIsStoryPaused,
  onClose,
  nextStory,
  prevStory,
  storyReplyText,
  setStoryReplyText,
  replyingToStory,
  setReplyingToStory,
  showViewersList,
  setShowViewersList,
  onStoriesUpdate,
}) => {
  if (!activeStoryGroup) return null;

  return (
    <StoryViewer
      activeStoryGroup={activeStoryGroup}
      activeStoryIndex={activeStoryIndex}
      myUserId={myUserId}
      isStoryMuted={isStoryMuted}
      setIsStoryMuted={setIsStoryMuted}
      isStoryPaused={isStoryPaused}
      setIsStoryPaused={setIsStoryPaused}
      onClose={onClose}
      nextStory={nextStory}
      prevStory={prevStory}
      storyReplyText={storyReplyText}
      setStoryReplyText={setStoryReplyText}
      replyingToStory={replyingToStory}
      setReplyingToStory={setReplyingToStory}
      showViewersList={showViewersList}
      setShowViewersList={setShowViewersList}
      onStoriesUpdate={onStoriesUpdate}
    />
  );
};

export default StoryViewerWrapper;
