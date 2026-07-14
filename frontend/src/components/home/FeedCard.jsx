import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  MoreHorizontal,
  ShieldAlert,
  Edit2,
  Trash2,
  Music2,
  Pause,
  Play,
  Bookmark,
  Loader2,
  Send,
  Globe,
  Calendar,
} from "lucide-react";
import moment from "moment";
import Avatar from "../common/Avatar";
import LazyImage from "../common/LazyImage";
import { getAvatarUrl } from "../../utils/avatar";

const renderClickableText = (text) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const formatLocation = (location) => {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim());
  const shortLoc = parts.slice(0, 2).join(", ");
  return shortLoc.length > 30 ? shortLoc.slice(0, 27) + "..." : shortLoc;
};

const getTravelTag = (post) => {
  if (post?.postType && post.postType !== "general") {
    const mapping = {
      travel_memory: "Travel Memory",
      travel_photo: "Travel Photo",
      travel_video: "Travel Video",
      document: "Document",
      profile_update: "Profile Update",
    };
    return mapping[post.postType];
  }
  if (post?.tags && post.tags.length > 0) {
    return post.tags[0];
  }
  return null;
};

const getAllComments = (post) => {
  return Array.isArray(post?.comments) ? post.comments : [];
};

const getVisibleComments = (post) => {
  return getAllComments(post).filter(
    (comment) => !comment.hidden && !comment.deleted,
  );
};

const getPreviewComments = (post) => {
  return getVisibleComments(post).slice(-3);
};

const getTotalCommentCount = (post) => {
  if (post.commentsCount !== undefined) return post.commentsCount;
  return getAllComments(post).filter((comment) => !comment.deleted).length;
};

const getVisibleCommentCount = (post) => {
  return getVisibleComments(post).length;
};

const FeedCard = React.forwardRef(
  (
    {
      post,
      user,
      myUserId,
      hasLiked,
      isSaved,
      isCreator,
      likeLoadingMap,
      saveLoadingMap,
      commentsLoadingMap,
      isSubmittingComment,
      commentText,
      activeCommentPost,
      playingAudioId,
      journeyLikeAnim,
      handleLike,
      handlePostTap,
      handleOpenComments,
      handleShare,
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
    ref,
  ) => {
    const totalCommentsCount = getTotalCommentCount(post);
    const visibleComments = getVisibleComments(post);
    const previewComments = getPreviewComments(post);
    const visibleCommentsCount = getVisibleCommentCount(post);
    const likesCount = post.likes?.length ?? 0;

    return (
      <motion.div
        layout
        ref={ref}
        data-post-id={post._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        className="card shadow-md hover:shadow-lg overflow-hidden group transition-all duration-300"
      >
        {/* Post header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to={`/profile/${post.userId?._id || post.userId}`}
              className="shrink-0"
            >
              <Avatar
                user={post.userId}
                pic={post.userId?.pic}
                img={post.userId?.img || post.userPic}
                name={post.userId?.name || post.userName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            </Link>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.userId?._id || post.userId}`}>
                  <h4 className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors truncate">
                    {post.userName}
                  </h4>
                </Link>
                {(post.userId?.isVerified || post.isVerified) && (
                  <span
                    className="bg-blue-550 text-white p-[2px] rounded-full flex items-center justify-center shrink-0"
                    title="Verified Traveler"
                  >
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </div>

              {(() => {
                const metadataItems = [];

                if (post.location) {
                  metadataItems.push(
                    <span key="location" className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{formatLocation(post.location)}</span>
                    </span>
                  );
                }

                metadataItems.push(
                  <span key="date" className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{moment(post.createdAt).fromNow()}</span>
                  </span>
                );

                if (post.visibility) {
                  metadataItems.push(
                    <span key="visibility" className="flex items-center gap-1.5 shrink-0">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{post.visibility}</span>
                    </span>
                  );
                }

                const travelTag = getTravelTag(post);
                if (travelTag) {
                  metadataItems.push(
                    <span key="travel-tag" className="bg-brand-50 text-brand-600 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                      {travelTag}
                    </span>
                  );
                }

                return (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 min-w-0">
                    {metadataItems.reduce((acc, item, index) => {
                      if (index === 0) return [item];
                      return [
                        ...acc,
                        <span key={`sep-${index}`} className="text-slate-300 select-none">â€¢</span>,
                        item
                      ];
                    }, [])}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="ml-auto relative group/menu flex items-center justify-center shrink-0">
            <button
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 min-w-[140px]">
              {!isCreator && (
                <button
                  onClick={() =>
                    setReportModal({
                      isOpen: true,
                      targetId: post._id,
                      targetType: "post",
                      reportedUserId: post.userId?._id || post.userId,
                    })
                  }
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" /> Report
                </button>
              )}
              {(isCreator || user?.isAdmin) && (
                <>
                  {isCreator && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditPostData(post);
                        setShowEditPostModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post image */}
        <div
          onClick={(e) => handlePostTap(e, post._id, post.likes)}
          style={{ touchAction: "manipulation" }}
          className="relative mx-5 my-4 rounded-2xl border border-slate-100 bg-slate-50 select-none overflow-hidden cursor-pointer flex items-center justify-center shadow-sm"
        >
          {post.mediaType === "video" ? (
            <video
              src={`${post.mediaUrl || post.image}#t=0.1`}
              controls
              controlsList="nodownload"
              playsInline
              muted
              preload="metadata"
              className="w-full h-[380px] object-cover bg-black"
            />
          ) : (
            <LazyImage
              src={post.mediaUrl || post.image}
              alt={post.location || post.caption || "Travel memory image"}
              className="w-full h-[380px] object-cover hover:scale-[1.01] transition-all duration-500"
            />
          )}
          {post.tags?.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 pointer-events-none">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={`${post._id}-${tag}`}
                  className="bg-black/40 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-1 rounded-full pointer-events-auto"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {post.music && post.music.title && (
            <div
              className="absolute bottom-3 left-3 flex items-center gap-2 bg-white rounded-full border border-slate-100 shadow-md px-3 py-1.5 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Music2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
              <div className="flex flex-col max-w-[120px] sm:max-w-[150px]">
                <span className="truncate text-[10px] font-bold text-slate-800 leading-tight">
                  {post.music.title}
                </span>
                <span className="truncate text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                  {post.music.artist}
                </span>
              </div>
              {post.music.preview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAudio(post._id);
                  }}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-xs transition-all hover:scale-105 active:scale-95"
                >
                  {playingAudioId === post._id ? (
                    <Pause className="h-3 w-3 fill-current" />
                  ) : (
                    <Play className="h-3 w-3 fill-current ml-0.5" />
                  )}
                </button>
              )}
              {post.music.preview && (
                <audio
                  ref={(el) => audioRefCallback && audioRefCallback(el)}
                  src={post.music.preview}
                  onEnded={() => toggleAudio(post._id)}
                />
              )}
            </div>
          )}
          <AnimatePresence>
            {journeyLikeAnim?.postId === post._id && (
              <motion.div
                key={journeyLikeAnim.key}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-black/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <span className="text-6xl drop-shadow-md">âœ¨</span>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 bg-black/60 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md"
                >
                  Journey Felt
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Post actions & comments */}
        <div className="px-5 pt-3.5 pb-2">
          <div className="flex items-center justify-between w-full bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-6 shrink-0 overflow-hidden">
              <button
                onClick={() => handleLike(post._id)}
                disabled={likeLoadingMap[post._id]}
                aria-label={
                  hasLiked ? "Remove Felt This reaction" : "Felt this travel memory"
                }
                className={`flex items-center gap-2 group transition-all duration-200 active:scale-90 px-2 py-1 rounded-xl whitespace-nowrap ${likeLoadingMap[post._id] ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`text-[15px] transition-all duration-200 ${hasLiked ? "scale-110" : "opacity-75 group-hover:scale-110 group-hover:opacity-100"} leading-none`}
                >
                  âœ¨
                </span>
                <span
                  className={`text-xs font-bold transition-colors duration-200 ${hasLiked ? "text-brand-600" : "text-slate-500 group-hover:text-brand-600"}`}
                >
                  {likesCount > 0 ? `${likesCount}` : "0"}
                </span>
              </button>
              <button
                onClick={() => handleOpenComments(post._id)}
                aria-label="Open Thoughts"
                className="flex items-center gap-2 group transition-all duration-200 active:scale-90 px-2 py-1 rounded-xl whitespace-nowrap"
              >
                <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-opacity leading-none">
                  ðŸ’­
                </span>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                  {totalCommentsCount > 0 ? `${totalCommentsCount}` : "0"}
                </span>
              </button>
              <button
                onClick={() => handleShare(post._id)}
                aria-label="Spread Vibes"
                className="flex items-center gap-2 group transition-all duration-200 active:scale-90 px-2 py-1 rounded-xl whitespace-nowrap hidden sm:flex"
              >
                <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-all leading-none">
                  ðŸŒ
                </span>
                <span className="text-xs font-bold text-slate-500 group-hover:text-brand-600 transition-colors">
                  Share
                </span>
              </button>
            </div>
            <button
              onClick={() => handleSaveToggle(post._id)}
              disabled={saveLoadingMap[post._id?.toString()]}
              aria-label={isSaved ? "Remove saved travel memory" : "Save travel memory"}
              className="group transition-all duration-200 active:scale-95 hover:scale-105 disabled:opacity-50 shrink-0 ml-2 p-1.5 rounded-full hover:bg-slate-200"
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? "text-brand-600 fill-brand-600" : "text-slate-500 group-hover:text-brand-600"} transition-colors`}
              />
            </button>
          </div>

          {/* Caption Section */}
          <div className="pt-2">
            <div className="text-sm px-1 pb-1 leading-relaxed">
              <span className="font-bold text-slate-800">{post.userName}</span>
              <span className="ml-2 text-slate-600">
                {renderClickableText(post.caption || post.title)}
              </span>
            </div>
          </div>

          {(activeCommentPost === post._id ? visibleComments : previewComments)
            .length > 0 && (
            <>
              <div className="mt-3 border-t border-slate-100" />

              {/* Comments Section */}
              <div className="mt-3 space-y-2 pl-1">
                {(activeCommentPost === post._id
                  ? visibleComments
                  : previewComments
                ).map((comment) => (
                  <div
                    key={comment._id}
                    className="text-xs group relative pr-6 leading-relaxed"
                  >
                    <span className="font-semibold text-slate-800 mr-2">
                      {comment.userName}
                    </span>
                    <span className="text-slate-600 break-words">
                      {renderClickableText(comment.text)}
                    </span>
                    {((comment.userId?._id || comment.userId)?.toString() ===
                      myUserId ||
                      isCreator) && (
                      <button
                        onClick={() =>
                          handleDeleteComment(post._id, comment._id)
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity absolute right-0 top-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {commentsLoadingMap[post._id] && (
            <div className="flex justify-center my-2">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
            </div>
          )}
          {visibleCommentsCount > previewComments.length &&
            activeCommentPost !== post._id &&
            !commentsLoadingMap[post._id] && (
              <button
                onClick={() => handleOpenComments(post._id)}
                className="text-xs font-semibold text-slate-400 hover:text-brand-600 mt-2 pl-1 block transition-colors"
              >
                View all {visibleCommentsCount} Thoughts
              </button>
            )}

          {/* Comment input */}
          <form
            onSubmit={(e) => handleCommentSubmit(e, post._id)}
            className="flex items-center gap-2.5 pt-3 mt-3 border-t border-slate-100"
          >
            <Avatar
              user={user}
              pic={user?.pic || user?.profilePic}
              img={user?.img}
              name={user?.name}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={commentText[post._id] || ""}
                onChange={(e) =>
                  setCommentText((prev) => ({
                    ...prev,
                    [post._id]: e.target.value,
                  }))
                }
                placeholder="Share your thoughts..."
                maxLength={500}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-10 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500/50 focus:bg-white focus:shadow-xs transition-all"
              />
              <button
                type="submit"
                disabled={
                  isSubmittingComment[post._id] || !commentText[post._id]?.trim()
                }
                aria-label="Post comment"
                className="absolute right-1 p-1.5 bg-brand-600 text-white rounded-full active:scale-90 transition-all disabled:opacity-0 disabled:scale-75 disabled:pointer-events-none shadow-xs"
              >
                {isSubmittingComment[post._id] ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 -ml-0.5 mt-0.5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    );
  },
);

FeedCard.displayName = "FeedCard";

export default FeedCard;

