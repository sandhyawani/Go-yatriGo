import React from "react";
import { motion } from "framer-motion";
import moment from "moment";

import FeedHeader from "./header/FeedHeader";
import FeedMedia from "./media/FeedMedia";
import FeedCaption from "./caption/FeedCaption";
import FeedInteractions from "./interactions/FeedInteractions";
import FeedComments from "./comments/FeedComments";

import {
  formatLocation,
  getTotalCommentCount,
  getVisibleComments,
  getPreviewComments,
  getVisibleCommentCount,
} from "./utils/feedHelpers";
import { FEED_CARD_SPRING } from "./constants/feedConstants";

const FeedCard = React.forwardRef(
  (
    {
      post,
      user,
      myUserId,
      hasFelt,
      isSaved,
      isCreator,
      feltLoadingMap,
      saveLoadingMap,
      commentsLoadingMap,
      isSubmittingComment,
      commentText,
      activeCommentPost,
      playingAudioId,
      journeyLikeAnim,
      handleFelt,
      handlePostTap,
      handleOpenComments,
      handleDispatch,
      handleSaveToggle,
      handleDeleteComment,
      handleCommentSubmit,
      setCommentText,
      toggleAudio,
      setReportModal,
      setEditPostData,
      setShowEditPostModal,
      handleDeletePost,
      handleAvatarError,
      audioRefCallback,
    },
    ref
  ) => {
    const totalCommentsCount = getTotalCommentCount(post);
    const visibleComments = getVisibleComments(post);
    const previewComments = getPreviewComments(post);
    const visibleCommentsCount = getVisibleCommentCount(post);

    const displayedComments =
      activeCommentPost === post._id ? visibleComments : previewComments;

    return (
      <motion.article
        layout
        ref={ref}
        data-post-id={post._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FEED_CARD_SPRING}
        className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all duration-300"
      >
        {/* Scrapbook Washi Tape Top Accent */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3.5 bg-amber-100/85 border border-amber-200/70 rounded-xs shadow-2xs rotate-[-1deg] backdrop-blur-[1px] z-20 pointer-events-none opacity-80" />

        {/* Vintage Postmark / Visited Ink Stamp */}
        {post.location && (
          <div className="absolute top-4 right-4 sm:right-6 w-20 h-20 border-[2px] border-dashed border-brand-500/25 rounded-full flex flex-col items-center justify-center pointer-events-none rotate-[-8deg] z-0 select-none opacity-45">
            <div className="absolute inset-1 border border-brand-500/20 rounded-full"></div>
            <span className="text-[7.5px] font-black uppercase text-brand-600/60 tracking-[0.18em]">
              JOURNEY
            </span>
            <span
              className="text-[10px] font-bold text-brand-700/70 truncate max-w-[62px] text-center my-0.5"
              title={post.location}
            >
              {formatLocation(post.location).split(",")[0]}
            </span>
            <span className="text-[7px] font-semibold text-brand-600/50">
              {moment(post.createdAt).format("DD MMM YYYY")}
            </span>
          </div>
        )}

        {/* Header */}
        <FeedHeader
          post={post}
          isCreator={isCreator}
          user={user}
          setReportModal={setReportModal}
          setEditPostData={setEditPostData}
          setShowEditPostModal={setShowEditPostModal}
          handleDeletePost={handleDeletePost}
          handleAvatarError={handleAvatarError}
        />

        {/* Media Section */}
        <FeedMedia
          post={post}
          playingAudioId={playingAudioId}
          journeyLikeAnim={journeyLikeAnim}
          toggleAudio={toggleAudio}
          handlePostTap={handlePostTap}
          audioRefCallback={audioRefCallback}
        />

        {/* Bottom Section: Caption, Interactions, Comments */}
        <div className="px-4 pb-3 pt-2 sm:px-5">
          <FeedCaption post={post} />

          <FeedInteractions
            post={post}
            hasFelt={hasFelt}
            isSaved={isSaved}
            feltLoadingMap={feltLoadingMap}
            saveLoadingMap={saveLoadingMap}
            totalCommentsCount={totalCommentsCount}
            handleFelt={handleFelt}
            handleOpenComments={handleOpenComments}
            handleDispatch={handleDispatch}
            handleSaveToggle={handleSaveToggle}
          />

          <FeedComments
            post={post}
            user={user}
            myUserId={myUserId}
            isCreator={isCreator}
            displayedComments={displayedComments}
            previewComments={previewComments}
            visibleCommentsCount={visibleCommentsCount}
            activeCommentPost={activeCommentPost}
            commentsLoadingMap={commentsLoadingMap}
            commentText={commentText}
            setCommentText={setCommentText}
            isSubmittingComment={isSubmittingComment}
            handleOpenComments={handleOpenComments}
            handleDeleteComment={handleDeleteComment}
            handleCommentSubmit={handleCommentSubmit}
          />
        </div>
      </motion.article>
    );
  }
);

FeedCard.displayName = "FeedCard";

export default React.memo(FeedCard, (prevProps, nextProps) => {
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.hasFelt === nextProps.hasFelt &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.feltLoadingMap[prevProps.post._id] === nextProps.feltLoadingMap[nextProps.post._id] &&
    prevProps.saveLoadingMap[prevProps.post._id] === nextProps.saveLoadingMap[nextProps.post._id] &&
    prevProps.activeCommentPost === nextProps.activeCommentPost &&
    prevProps.playingAudioId === nextProps.playingAudioId &&
    prevProps.journeyLikeAnim?.postId === nextProps.journeyLikeAnim?.postId
  );
});
