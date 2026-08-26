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
        className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white shadow-[var(--shadow-card-sm)] transition-all duration-300"
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%237C3AED' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Visited Stamp */}
        {post.location && (
          <div className="absolute top-5 right-5 w-24 h-24 border-[3px] border-brand-500/20 rounded-full flex flex-col items-center justify-center opacity-40 pointer-events-none rotate-[15deg] z-0">
            <div className="absolute inset-0 border border-dashed border-brand-500/30 rounded-full m-1"></div>
            <span className="text-[9px] font-black uppercase text-brand-600/50 tracking-[0.2em] mt-1">
              VISITED
            </span>
            <span
              className="text-[11px] font-bold text-brand-600/60 truncate max-w-[70px] text-center mt-0.5"
              title={post.location}
            >
              {formatLocation(post.location).split(",")[0]}
            </span>
            <span className="text-[7px] font-semibold text-brand-600/40 mt-1">
              {moment(post.createdAt).format("DD MMM YY")}
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

        {/* Perforation Divider */}
        <div className="w-full h-2 flex overflow-hidden opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-2 bg-slate-200 rounded-b-full mx-1 flex-shrink-0"
            />
          ))}
        </div>

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
