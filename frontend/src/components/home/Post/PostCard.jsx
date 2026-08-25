import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  MoreHorizontal,
  ShieldAlert,
  Edit2,
  Trash2,
  Bookmark,
  Clock,
  Camera,
  Compass,
} from "lucide-react";
import moment from "moment";
import { motion } from "framer-motion";
import Avatar from "../../common/Avatar";
import LazyImage from "../../common/LazyImage";

import { formatLocation } from "../../../utils/locationUtils";
import {
  getVisibleComments,
  getPreviewComments,
  getTotalCommentCount,
  getVisibleCommentCount,
} from "../../../utils/commentUtils";
import ChangeCoverModal from "../../modals/ChangeCoverModal";

// Local Sub-components
import AudioPlayer from "./AudioPlayer";
import LikeAnimation from "./LikeAnimation";
import CommentSection from "./CommentSection";

export const PostCard = ({
  post,
  myUserId,
  isSaved,
  isCreator,
  likesCount,
  hasLiked,
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
  // Loaders
  likeLoadingMap,
  saveLoadingMap,
  commentsLoadingMap,
  onPostUpdated,
}) => {
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  React.useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const currentPost = localPost || post;

  const visibleComments = getVisibleComments(currentPost);
  const previewComments = getPreviewComments(currentPost);
  const totalCommentsCount = getTotalCommentCount(currentPost);
  const visibleCommentsCount = getVisibleCommentCount(currentPost);

  const coverUrl =
    currentPost.mediaUrl ||
    currentPost.image ||
    currentPost.img ||
    (Array.isArray(currentPost.mediaUrls) && currentPost.mediaUrls[0]) ||
    "";

  const handleCoverUpdated = (updatedMemory) => {
    setLocalPost((prev) => ({
      ...prev,
      ...updatedMemory,
    }));
    if (onPostUpdated) {
      onPostUpdated(updatedMemory);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        ref={(el) => {
          if (postRefs && postRefs.current) {
            postRefs.current[currentPost._id] = el;
          }
        }}
        data-post-id={currentPost._id}
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.08)] transition-all duration-300 hover:-translate-y-0.5 group w-full mb-6"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <Link
              to={
                isCreator
                  ? `/profile`
                  : `/profile/${currentPost.userId?._id || currentPost.userId}`
              }
              className="relative select-none shrink-0"
            >
              <Avatar
                user={currentPost.userId || currentPost}
                size="w-10 h-10"
                border="border-2 border-primary-100 dark:border-slate-700"
                onError={(e) => handleAvatarError(e, currentPost.userName)}
              />
              {onlineUsersMap[
                (currentPost.userId?._id || currentPost.userId)?.toString()
              ] && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={
                    isCreator
                      ? `/profile`
                      : `/profile/${currentPost.userId?._id || currentPost.userId}`
                  }
                  className="text-sm font-bold text-slate-800 dark:text-white hover:text-primary-600 transition-colors block truncate leading-tight font-heading"
                >
                  {currentPost.userName || currentPost.userId?.name}
                </Link>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.2 rounded-full border border-primary-200/80 shrink-0">
                  TRAVEL MEMORY
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{moment(currentPost.createdAt).fromNow()}</span>
                {currentPost.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 hover:text-primary-600 transition-colors max-w-[120px] sm:max-w-[180px] truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">
                        {formatLocation(currentPost.location)}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="relative dropdown-container">
            <button
              aria-label="Travel Memory options"
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const menu = e.currentTarget.nextElementSibling;
                if (menu) menu.classList.toggle("hidden");
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="hidden absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 z-35 text-left overflow-hidden">
              {isCreator ? (
                <>
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add("hidden");
                      setEditPostData(currentPost);
                      setShowEditPostModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors hover:text-primary-600"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary-500" />
                    Edit Travel Memory
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add("hidden");
                      setShowChangeCoverModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors hover:text-primary-600"
                  >
                    <Camera className="w-3.5 h-3.5 text-primary-500" />
                    Change Cover Photo
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.parentElement.classList.add("hidden");
                      handleDeletePost(currentPost._id);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-rose-500 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-700 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Travel Memory
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.currentTarget.parentElement.classList.add("hidden");
                    setReportModal({
                      isOpen: true,
                      targetId: currentPost._id,
                      targetType: "post",
                      reportedUserId: currentPost.userId?._id || currentPost.userId,
                    });
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold text-rose-500 flex items-center gap-2 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Report Travel Memory
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Image/Video Container - 16:9 Aspect Ratio with hover change cover */}
        <div
          className="group/cover relative overflow-hidden cursor-pointer select-none bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center aspect-[16/9] max-h-[380px]"
          onClick={(e) => handlePostTap(e, currentPost._id, currentPost.likes)}
        >
          {currentPost.mediaType === "video" ||
          coverUrl.match(/\.(mp4|webm|mov)$/i) ? (
            <video
              src={coverUrl}
              controls
              loop
              muted
              preload="metadata"
              className="w-full h-full object-cover object-center bg-black"
            />
          ) : (
            <LazyImage
              src={coverUrl}
              alt={currentPost.location || currentPost.caption || "Travel Memory image"}
              className="w-full h-full object-cover object-center hover:scale-[1.01] transition-all duration-500"
            />
          )}

          {/* Owner hover Change Cover button */}
          {isCreator && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowChangeCoverModal(true);
              }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white text-[11px] font-bold backdrop-blur-md shadow-md opacity-0 group-hover/cover:opacity-100 transition-all duration-200 active:scale-95 z-20"
            >
              <Camera className="w-3.5 h-3.5 text-primary-300" />
              <span>Change Cover</span>
            </button>
          )}

          {/* Tags overlay */}
          {currentPost.tags?.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 pointer-events-none">
              {currentPost.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-auto"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Audio Player */}
          <AudioPlayer
            post={currentPost}
            playingAudioId={playingAudioId}
            toggleAudio={toggleAudio}
            audioRefs={audioRefs}
          />

          {/* Like animation double tap ripple */}
          <LikeAnimation post={currentPost} journeyLikeAnim={journeyLikeAnim} />
        </div>

        {/* Footer Info / Captions & Comments */}
        <div className="px-4 pt-3 pb-2">
          {/* Action Row */}
          <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs transition-colors duration-300">
            <div className="flex items-center gap-5 shrink-0 overflow-hidden">
              <button
                onClick={() => handleLike(currentPost._id)}
                disabled={likeLoadingMap?.[currentPost._id]}
                aria-label={
                  hasLiked
                    ? "Remove Felt This reaction"
                    : "Felt This Travel Memory"
                }
                className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap"
              >
                <span
                  className={`text-[15px] transition-all duration-300 ${
                    hasLiked
                      ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.7)] scale-110"
                      : "opacity-75 group-hover:scale-110 group-hover:opacity-100"
                  } leading-none`}
                >
                  ✨
                </span>
                <span
                  className={`text-[12px] font-bold transition-colors duration-300 ${
                    hasLiked
                      ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
                      : "text-slate-600 group-hover:text-amber-500"
                  }`}
                >
                  {likesCount > 0 ? `${likesCount}` : "0"}
                </span>
              </button>

              <button
                onClick={() => handleOpenComments(currentPost._id)}
                aria-label="Open Thoughts"
                className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap"
              >
                <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-opacity leading-none">
                  💭
                </span>
                <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                  {totalCommentsCount > 0 ? `${totalCommentsCount}` : "0"}
                </span>
              </button>

              <button
                onClick={() => handleShare(currentPost._id)}
                aria-label="Spread Vibes"
                className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap hidden sm:flex"
              >
                <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-all group-hover:-rotate-12 leading-none">
                  🌍
                </span>
                <span className="text-[12px] font-bold text-slate-600 group-hover:text-primary-600 transition-colors">
                  Share
                </span>
              </button>
            </div>

            <button
              onClick={() => handleSaveToggle(currentPost._id)}
              disabled={saveLoadingMap?.[currentPost._id?.toString()]}
              aria-label={
                isSaved ? "Remove saved Travel Memory" : "Save Travel Memory"
              }
              className="group transition-all duration-200 active:scale-95 hover:scale-110 shrink-0 ml-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved
                    ? "text-primary-600 fill-primary-600"
                    : "text-slate-500 group-hover:text-primary-600"
                } transition-colors`}
              />
            </button>
          </div>

          {/* Title & Caption Section */}
          <div className="pt-2 text-left space-y-1">
            {currentPost.title && (
              <h3 className="text-sm font-bold text-slate-900 font-heading leading-tight px-1">
                {currentPost.title}
              </h3>
            )}
            <div className="text-xs sm:text-sm px-1 pb-1 leading-relaxed text-slate-800 dark:text-slate-200">
              <span className="font-bold text-slate-900 dark:text-white mr-1.5 font-heading">
                {currentPost.userName}
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-sans">
                {currentPost.caption || currentPost.title}
              </span>
            </div>

            {/* Travel Metadata Pills */}
            <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5 text-[10px] font-semibold text-slate-500">
              {currentPost.location && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                  <span className="truncate">{currentPost.location}</span>
                </span>
              )}
              {currentPost.createdAt && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <Clock className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                  <span>{moment(currentPost.createdAt).format("MMM D, YYYY")}</span>
                </span>
              )}
              {currentPost.journeyId && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-primary-700 border border-primary-100/60">
                  <Compass className="w-2.5 h-2.5 text-primary-600 shrink-0" />
                  <span>Trip</span>
                </span>
              )}
            </div>
          </div>

          {/* Comments section */}
          <CommentSection
            post={currentPost}
            myUserId={myUserId}
            isCreator={isCreator}
            activeCommentPost={activeCommentPost}
            visibleComments={visibleComments}
            previewComments={previewComments}
            visibleCommentsCount={visibleCommentsCount}
            handleDeleteComment={handleDeleteComment}
            handleOpenComments={handleOpenComments}
            handleCommentSubmit={handleCommentSubmit}
            commentText={commentText}
            setCommentText={setCommentText}
            isSubmittingComment={isSubmittingComment}
            user={user}
            handleAvatarError={handleAvatarError}
          />
        </div>
      </motion.div>

      {/* Change Cover Modal */}
      {showChangeCoverModal && (
        <ChangeCoverModal
          isOpen={showChangeCoverModal}
          onClose={() => setShowChangeCoverModal(false)}
          memory={currentPost}
          onCoverUpdated={handleCoverUpdated}
        />
      )}
    </>
  );
};

export default PostCard;
