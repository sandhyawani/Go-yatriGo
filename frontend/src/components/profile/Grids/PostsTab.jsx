import React from "react";
import { Globe, Plus, AlertCircle, Loader2 } from "lucide-react";
import ProfileMemoryCard from "./ProfileMemoryCard";

export const PostsTab = ({
  postsLoading,
  postsError,
  userMemories = [],
  setSelectedMemory,
  isOwnProfile,
  setShowCreatePostModal,
  setEditPostData,
  setShowEditPostModal,
  setPostToDelete,
  setShowDeletePostModal,
  hasMorePosts,
  loadMorePosts,
  retryPosts,
  currentUser,
  profileUser,
  handleFelt,
  handleLikeMemory,
  savedPostIds,
  saveLoadingMap,
  feltLoadingMap,
  commentsLoadingMap,
  isSubmittingComment,
  commentText,
  setCommentText,
  activeCommentPost,
  playingAudioId,
  journeyLikeAnim,
  handlePostTap,
  handleOpenComments,
  handleDispatch,
  handleSaveToggle,
  handleDeleteComment,
  handleCommentSubmit,
  toggleAudio,
  setReportModal,
  handleDeletePost,
  handleAvatarError,
  audioRefs,
}) => {
  if (postsLoading && userMemories.length === 0) {
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/80 bg-surface p-3 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-24 h-3 bg-secondary-200 rounded-md" />
                <div className="w-16 h-2 bg-secondary-100 rounded-md" />
              </div>
            </div>

            <div className="w-full aspect-[4/3] bg-secondary-100 rounded-xl" />

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex gap-3">
                <div className="w-10 h-3.5 bg-secondary-100 rounded-md" />
                <div className="w-10 h-3.5 bg-secondary-100 rounded-md" />
              </div>
              <div className="w-4 h-3.5 bg-secondary-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (postsError && userMemories.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center shadow-sm">
        <div className="w-12 h-12 bg-red-100 text-danger rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-dark mb-1">
          Unable to load Travel Memories
        </h3>
        <p className="text-xs text-red-500 font-medium max-w-xs mx-auto mb-4 leading-relaxed">
          {postsError}
        </p>
        {retryPosts && (
          <button
            type="button"
            onClick={retryPosts}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-5 py-2 font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (userMemories.length === 0) {
    return (
      <div className="w-full rounded-3xl border border-border bg-surface p-8 sm:p-12 text-center select-none shadow-sm">
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3.5 relative shadow-xs border border-primary-100">
          <div className="absolute inset-0 bg-primary-600/10 rounded-full blur-xl animate-pulse" />
          <Globe className="w-7 h-7 text-primary-600 relative z-10" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-dark mb-1">
          {isOwnProfile
            ? "Share Your First Travel Memory"
            : "No Travel Memories Yet"}
        </h3>
        <p className="text-xs sm:text-sm text-muted font-medium max-w-sm mx-auto mb-5 leading-relaxed">
          {isOwnProfile
            ? "Publish photos and moments from your adventures to inspire other explorers."
            : "This traveler has not shared any travel memories yet."}
        </p>
        {isOwnProfile && setShowCreatePostModal && (
          <button
            type="button"
            onClick={() => setShowCreatePostModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-5 py-2.5 font-bold text-xs sm:text-sm transition-all shadow-md shadow-primary-600/20 active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Travel Memory
          </button>
        )}
      </div>
    );
  }

  const myUserId = (currentUser?._id || currentUser?.id)?.toString();

  return (
    <div className="w-full space-y-6">
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {userMemories.map((memory, index) => {
          const memoryId = memory._id || memory.id || `memory-${index}`;
          const memoryAuthorId = (
            memory.userId?._id ||
            memory.userId ||
            profileUser?._id ||
            profileUser?.id
          )?.toString();

          const isCreator = Boolean(
            isOwnProfile ||
              (myUserId && memoryAuthorId && myUserId === memoryAuthorId)
          );

          const hasFelt = Array.isArray(memory.likes)
            ? memory.likes.some(
                (id) => (id?._id || id)?.toString() === myUserId
              )
            : false;

          const isSaved = savedPostIds
            ? savedPostIds.has(memoryId?.toString())
            : false;

          const normalizedPost = {
            ...memory,
            _id: memoryId,
            userId:
              typeof memory.userId === "object" && memory.userId !== null
                ? {
                    ...memory.userId,
                    _id: memoryAuthorId,
                    name:
                      memory.userId.name ||
                      memory.userName ||
                      profileUser?.name ||
                      "Traveler",
                    pic:
                      memory.userId.pic ||
                      memory.userId.avatar ||
                      memory.userPic ||
                      profileUser?.pic,
                    isVerified:
                      memory.userId.isVerified ?? profileUser?.isVerified,
                  }
                : {
                    _id: memoryAuthorId,
                    name:
                      memory.userName ||
                      profileUser?.name ||
                      "Traveler",
                    pic: memory.userPic || profileUser?.pic,
                    isVerified: profileUser?.isVerified,
                  },
            userName:
              memory.userName ||
              memory.userId?.name ||
              profileUser?.name ||
              "Traveler",
            userPic:
              memory.userPic ||
              memory.userId?.pic ||
              profileUser?.pic,
            mediaUrl:
              memory.mediaUrl ||
              memory.image ||
              memory.mediaUrls?.[0] ||
              memory.media ||
              memory.img,
            caption: memory.caption || memory.title || "",
            likes: Array.isArray(memory.likes) ? memory.likes : [],
            comments: Array.isArray(memory.comments) ? memory.comments : [],
            commentsCount:
              typeof memory.commentsCount === "number"
                ? memory.commentsCount
                : Array.isArray(memory.comments)
                ? memory.comments.length
                : 0,
            createdAt: memory.createdAt,
          };

          return (
            <ProfileMemoryCard
              key={memoryId}
              post={normalizedPost}
              user={currentUser}
              myUserId={myUserId}
              hasFelt={hasFelt}
              isSaved={isSaved}
              isCreator={isCreator}
              feltLoadingMap={feltLoadingMap || {}}
              saveLoadingMap={saveLoadingMap || {}}
              totalCommentsCount={normalizedPost.commentsCount}
              playingAudioId={playingAudioId}
              journeyLikeAnim={journeyLikeAnim}
              handleFelt={handleFelt || handleLikeMemory}
              handlePostTap={
                handlePostTap || ((e) => setSelectedMemory?.(memory))
              }
              handleOpenComments={handleOpenComments}
              handleDispatch={handleDispatch}
              handleSaveToggle={handleSaveToggle}
              toggleAudio={toggleAudio}
              setReportModal={setReportModal}
              setEditPostData={setEditPostData}
              setShowEditPostModal={setShowEditPostModal}
              handleDeletePost={
                handleDeletePost ||
                (() => {
                  setPostToDelete?.(memory);
                  setShowDeletePostModal?.(true);
                })
              }
              handleAvatarError={handleAvatarError}
              audioRefCallback={(el) => {
                if (audioRefs && audioRefs.current) {
                  audioRefs.current[memoryId] = el;
                }
              }}
              onCardClick={() => setSelectedMemory?.(memory)}
            />
          );
        })}
      </div>

      {/* ─── 5. PAGINATION: LOAD MORE BUTTON ────────────────────────────────── */}
      {hasMorePosts && userMemories.length > 0 && (
        <div className="pt-2 pb-4 flex justify-center w-full">
          <button
            type="button"
            onClick={loadMorePosts}
            disabled={postsLoading}
            className="px-6 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-800 rounded-full font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 active:scale-95 disabled:opacity-60"
          >
            {postsLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                <span>Loading more memories...</span>
              </>
            ) : (
              <span>Load More Memories</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostsTab;