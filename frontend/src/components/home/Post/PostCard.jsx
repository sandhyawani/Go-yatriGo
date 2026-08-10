import React from "react";
import { Link } from "react-router-dom";
import { MapPin, MoreHorizontal, ShieldAlert, Edit2, Trash2, Bookmark, Clock } from "lucide-react";
import moment from "moment";
import { motion } from "framer-motion";
import Avatar from "../../common/Avatar";
import LazyImage from "../../common/LazyImage";
import { getAvatarUrl } from "../../../utils/avatar";
import { formatLocation } from "../../../utils/locationUtils";
import { getVisibleComments, getPreviewComments, getTotalCommentCount, getVisibleCommentCount } from "../../../utils/commentUtils";

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
}) => {
  const visibleComments = getVisibleComments(post);
  const previewComments = getPreviewComments(post);
  const totalCommentsCount = getTotalCommentCount(post);
  const visibleCommentsCount = getVisibleCommentCount(post);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      ref={(el) => {
        if (postRefs && postRefs.current) {
          postRefs.current[post._id] = el;
        }
      }}
      data-post-id={post._id}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-0.5 group w-full"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={isCreator ? `/profile` : `/profile/${post.userId?._id || post.userId}`}
            className="relative select-none shrink-0"
          >
            <Avatar
              user={post.userId || post}
              size="w-10 h-10"
              border="border-2 border-white dark:border-slate-700"
              onError={(e) => handleAvatarError(e, post.userName)}
            />
            {onlineUsersMap[(post.userId?._id || post.userId)?.toString()] && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
            )}
          </Link>
          <div className="min-w-0">
            <Link
              to={isCreator ? `/profile` : `/profile/${post.userId?._id || post.userId}`}
              className="text-sm font-bold text-slate-800 dark:text-white hover:text-[#6C4DF6] transition-colors block truncate leading-tight"
            >
              {post.userName || post.userId?.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{moment(post.createdAt).fromNow()}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 hover:text-[#6C4DF6] transition-colors max-w-[120px] sm:max-w-[180px] truncate">
                    <MapPin className="w-3 h-3 text-[#6C4DF6]/80 shrink-0" />
                    <span className="truncate">{formatLocation(post.location)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Options Dropdown */}
        <div className="relative dropdown-container">
          <button
            aria-label="Post options"
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const menu = e.currentTarget.nextElementSibling;
              if (menu) menu.classList.toggle("hidden");
            }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <div className="hidden absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-35 text-left overflow-hidden">
            {isCreator ? (
              <>
                <button
                  onClick={(e) => {
                    e.currentTarget.parentElement.classList.add("hidden");
                    setEditPostData(post);
                    setShowEditPostModal(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#6C4DF6]" />
                  Edit Post
                </button>
                <button
                  onClick={(e) => {
                    e.currentTarget.parentElement.classList.add("hidden");
                    handleDeletePost(post._id);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-rose-500 flex items-center gap-2 transition-colors border-t border-slate-50 dark:border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Post
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.currentTarget.parentElement.classList.add("hidden");
                  setReportModal({
                    isOpen: true,
                    targetId: post._id,
                    targetType: "post",
                    reportedUserId: post.userId?._id || post.userId,
                  });
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-bold text-rose-500 flex items-center gap-2 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Post
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Image/Video Container */}
      <div
        className="relative overflow-hidden cursor-pointer select-none bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center"
        onClick={(e) => handlePostTap(e, post._id, post.likes)}
      >
        {post.mediaType === "video" ||
        (post.mediaUrl || post.image || "").match(/\.(mp4|webm|mov)$/i) ? (
          <video
            src={post.mediaUrl || post.image}
            controls
            loop
            muted
            preload="metadata"
            className="w-full aspect-[4/3] md:aspect-video object-cover object-center bg-black"
          />
        ) : (
          <LazyImage
            src={post.mediaUrl || post.image}
            alt={post.location || post.caption || "Post image"}
            className="w-full aspect-[4/3] md:aspect-video object-cover object-center hover:scale-[1.01] transition-all duration-500"
          />
        )}

        {/* Tags overlay */}
        {post.tags?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 pointer-events-none">
            {post.tags.slice(0, 3).map((tag, i) => (
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
          post={post}
          playingAudioId={playingAudioId}
          toggleAudio={toggleAudio}
          audioRefs={audioRefs}
        />

        {/* Like animation double tap ripple */}
        <LikeAnimation post={post} journeyLikeAnim={journeyLikeAnim} />
      </div>

      {/* Footer Info / Captions & Comments */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl px-4 py-2 rounded-[20px] border border-white/80 dark:border-slate-700 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-6 shrink-0 overflow-hidden">
            <button
              onClick={() => handleLike(post._id)}
              disabled={likeLoadingMap?.[post._id]}
              aria-label={hasLiked ? "Remove Felt This reaction" : "Felt This post"}
              className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap"
            >
              <span
                className={`text-[15px] transition-all duration-300 ${
                  hasLiked
                    ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.7)] scale-110"
                    : "opacity-75 group-hover:drop-shadow-[0_0_4px_rgba(250,204,21,0.4)] group-hover:scale-110 group-hover:opacity-100"
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
              onClick={() => handleOpenComments(post._id)}
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
              onClick={() => handleShare(post._id)}
              aria-label="Spread Vibes"
              className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap hidden sm:flex"
            >
              <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-all group-hover:-rotate-12 leading-none">
                🌍
              </span>
              <span className="text-[12px] font-bold text-slate-600 group-hover:text-blue-500 transition-colors">
                Share
              </span>
            </button>
          </div>
          <button
            onClick={() => handleSaveToggle(post._id)}
            disabled={saveLoadingMap?.[post._id?.toString()]}
            aria-label={isSaved ? "Remove saved post" : "Save post"}
            className="group transition-all duration-200 active:scale-95 hover:scale-110 shrink-0 ml-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50"
          >
            <Bookmark
              className={`w-5 h-5 ${
                isSaved ? "text-[#6C4DF6] fill-[#6C4DF6]" : "text-slate-500 group-hover:text-[#6C4DF6]"
              } transition-colors`}
            />
          </button>
        </div>

        {/* Caption Section */}
        <div className="pt-1">
          <div className="text-base px-2 pb-1 leading-snug">
            <span className="font-bold text-slate-900">{post.userName}</span>
            <span className="ml-2 text-slate-800">{post.caption || post.title}</span>
          </div>
        </div>

        {/* Comments section */}
        <CommentSection
          post={post}
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
  );
};

export default PostCard;
