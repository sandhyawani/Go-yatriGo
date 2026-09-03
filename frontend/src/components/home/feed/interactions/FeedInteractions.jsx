import React from "react";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import ShareButton from "./ShareButton";
import SaveButton from "./SaveButton";

const FeedInteractions = ({
  post,
  hasFelt,
  isSaved,
  feltLoadingMap,
  saveLoadingMap,
  totalCommentsCount,
  handleFelt,
  handleOpenComments,
  handleDispatch,
  handleSaveToggle,
}) => {
  return (
    <div className="flex w-full items-center justify-between rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/40 via-white to-slate-50/60 px-2 sm:px-3 py-1.5 my-2 shadow-2xs">
      <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
        <LikeButton
          post={post}
          hasFelt={hasFelt}
          feltLoadingMap={feltLoadingMap}
          handleFelt={handleFelt}
        />

        <CommentButton
          post={post}
          totalCommentsCount={totalCommentsCount}
          handleOpenComments={handleOpenComments}
        />

        <ShareButton
          post={post}
          handleDispatch={handleDispatch}
        />
      </div>

      <SaveButton
        post={post}
        isSaved={isSaved}
        saveLoadingMap={saveLoadingMap}
        handleSaveToggle={handleSaveToggle}
      />
    </div>
  );
};

export default React.memo(FeedInteractions);
