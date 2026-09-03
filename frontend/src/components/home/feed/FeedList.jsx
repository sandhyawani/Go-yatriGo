import React from "react";
import FeedCard from "./FeedCard";
import { isPostCreator } from "../../../utils/postUtils";

export const FeedList = ({
  memories,
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
  return (
    <div className="space-y-6">
      {memories.map((post) => {
        const hasLiked = post.likes?.some(
          (id) => (id?._id || id)?.toString() === myUserId
        );
        const isSaved = savedPostIds.has(post._id?.toString());
        const isCreator = isPostCreator(post, myUserId);

        return (
          <FeedCard
            key={post._id}
            post={post}
            myUserId={myUserId}
            isSaved={isSaved}
            isCreator={isCreator}
            likesCount={post.likes?.length || 0}
            hasLiked={hasLiked}
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
            // Pass loaders if needed
            likeLoadingMap={likeLoadingMap}
            saveLoadingMap={saveLoadingMap}
            commentsLoadingMap={commentsLoadingMap}
          />
        );
      })}
    </div>
  );
};

export default FeedList;
