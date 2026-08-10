import React from "react";
import FeedSkeleton from "./FeedSkeleton";
import ErrorFeed from "./ErrorFeed";
import EmptyFeed from "./EmptyFeed";
import FeedList from "./FeedList";

export const Feed = ({
  loadingMemories,
  errorMemories,
  memories,
  fetchMemories,
  myUserId,
  savedPostIds,
  likeLoadingMap,
  saveLoadingMap,
  commentsLoadingMap,
  activeCommentPost,
  handleLike,
  handlePostTap,
  handleOpenComments,
  handleShare,
  handleSaveToggle,
  handleDeletePost,
  handleDeleteComment,
  handleCommentSubmit,
  commentText,
  setCommentText,
  isSubmittingComment,
  playingAudioId,
  toggleAudio,
  audioRefs,
  postRefs,
  setReportModal,
  setEditPostData,
  setShowEditPostModal,
  journeyLikeAnim,
  onlineUsersMap,
  handleAvatarError,
  user,
}) => {
  if (loadingMemories && memories.length === 0) {
    return <FeedSkeleton />;
  }

  if (errorMemories) {
    return <ErrorFeed onRetry={() => fetchMemories(1)} />;
  }

  if (memories.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <FeedList
      memories={memories}
      myUserId={myUserId}
      savedPostIds={savedPostIds}
      likeLoadingMap={likeLoadingMap}
      saveLoadingMap={saveLoadingMap}
      commentsLoadingMap={commentsLoadingMap}
      activeCommentPost={activeCommentPost}
      handleLike={handleLike}
      handlePostTap={handlePostTap}
      handleOpenComments={handleOpenComments}
      handleShare={handleShare}
      handleSaveToggle={handleSaveToggle}
      handleDeletePost={handleDeletePost}
      handleDeleteComment={handleDeleteComment}
      handleCommentSubmit={handleCommentSubmit}
      commentText={commentText}
      setCommentText={setCommentText}
      isSubmittingComment={isSubmittingComment}
      playingAudioId={playingAudioId}
      toggleAudio={toggleAudio}
      audioRefs={audioRefs}
      postRefs={postRefs}
      setReportModal={setReportModal}
      setEditPostData={setEditPostData}
      setShowEditPostModal={setShowEditPostModal}
      journeyLikeAnim={journeyLikeAnim}
      onlineUsersMap={onlineUsersMap}
      handleAvatarError={handleAvatarError}
      user={user}
    />
  );
};

export default Feed;
