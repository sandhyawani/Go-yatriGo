import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Globe, Sparkles, MoreHorizontal, ShieldAlert, Edit2, Trash2, BadgeCheck } from "lucide-react";
import moment from "moment";
import Avatar from "../../../common/Avatar";
import { formatLocation, getTravelTag } from "../utils/feedHelpers";
import { isActuallyVerified } from "../../../../utils/verification";

const FeedHeader = ({
  post,
  isCreator,
  user,
  setReportModal,
  setEditPostData,
  setShowEditPostModal,
  handleDeletePost,
  handleAvatarError
}) => {
  const travelTag = getTravelTag(post);
  const isPostAuthorVerified = isActuallyVerified(post.userId) || isActuallyVerified(post);

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-slate-50/70 via-white to-amber-50/30 border-b border-slate-100/90 relative z-10">
      <div className="flex min-w-0 items-center gap-3">
        <Link to={`/profile/${post.userId?._id || post.userId}`} className="shrink-0 relative group">
          <Avatar
            user={post.userId}
            pic={post.userId?.pic}
            img={post.userId?.img || post.userPic}
            name={post.userId?.name || post.userName}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ring-2 ring-amber-200/50 border border-white shadow-2xs transition-transform duration-300 group-hover:scale-105"
            onError={handleAvatarError}
          />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/profile/${post.userId?._id || post.userId}`} className="min-w-0">
              <h4 className="truncate text-xs sm:text-[13px] font-extrabold text-slate-900 transition-colors hover:text-brand-600 font-heading">
                {post.userName}
              </h4>
            </Link>

            {isPostAuthorVerified && (
              <BadgeCheck
                className="w-3.5 h-3.5 text-blue-500 shrink-0 fill-blue-50"
                title="Verified Traveler"
              />
            )}

            <span className="text-[10px] font-semibold text-slate-400 font-sans">
              • Log Entry
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500">
            {post.location && (
              <span className="flex max-w-[190px] items-center gap-1 truncate font-bold text-brand-600">
                <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
                <span className="truncate">{formatLocation(post.location)}</span>
              </span>
            )}

            {post.location && <span className="text-slate-300">•</span>}

            <span className="flex items-center gap-1 font-medium text-slate-400">
              <Calendar className="h-3 w-3 text-slate-400" />
              {moment(post.createdAt).fromNow()}
            </span>

            {post.visibility && post.visibility !== "public" && (
              <>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:flex items-center gap-1 capitalize font-medium text-slate-400">
                  <Globe className="h-3 w-3" />
                  {post.visibility}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {travelTag && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
            <Sparkles className="h-3 w-3" />
            {travelTag}
          </span>
        )}

        <div className="relative group/menu">
          <button
            type="button"
            aria-label="More options"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-[150px] rounded-xl border border-slate-100 bg-white py-1.5 opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
            {!isCreator && (
              <button
                type="button"
                onClick={() =>
                  setReportModal({
                    isOpen: true,
                    targetId: post._id,
                    targetType: "post",
                    reportedUserId: post.userId?._id || post.userId,
                  })
                }
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50"
              >
                <ShieldAlert className="h-4 w-4" />
                Report
              </button>
            )}

            {(isCreator || user?.isAdmin) && (
              <>
                {isCreator && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditPostData(post);
                      setShowEditPostModal(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeletePost(post._id)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(FeedHeader);
