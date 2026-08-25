import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, Compass, MapPin, Sparkles, UserCheck, UserPlus, BadgeCheck } from "lucide-react";
import { getAvatarUrl } from "../../../utils/avatar";

const TravelerSuggestionCard = ({
  user,
  currentUserId,
  relationship,
  followLoading,
  onFollowToggle,
}) => {
  const navigate = useNavigate();

  const myIdStr = String(currentUserId || "");
  const isFollowing = Boolean(
    relationship?.isFollowing ||
    user?.isFollowing ||
    (myIdStr && user?.followers?.some((f) => String(f?._id || f?.id || f) === myIdStr))
  );
  const isRequested = Boolean(
    relationship?.requestSent ||
    user?.isRequested ||
    (myIdStr && user?.followRequests?.some((r) => String(r?._id || r?.id || r) === myIdStr))
  );
  const isFollowBack = Boolean(
    !isFollowing &&
    !isRequested &&
    (relationship?.requestReceived ||
      relationship?.isFollower ||
      user?.isFollower ||
      (myIdStr && user?.following?.some((f) => String(f?._id || f?.id || f) === myIdStr)))
  );

  const locationString = [user.city, user.state].filter(Boolean).join(", ");
  const isSameCity = Boolean(user.isSameCity || (user.city && locationString.toLowerCase().includes("pune")));

  const matchPercentage =
    user.matchPercentage ||
    (isSameCity ? 96 : user.isSameState ? 88 : 82);

  const primaryDetail =
    user.primaryDetail ||
    user.recommendationReason ||
    user.suggestionReasonText ||
    (user.interests && user.interests.length > 0
      ? user.interests.slice(0, 2).join(" • ")
      : user.completedTrips > 0
      ? `${user.completedTrips} ${user.completedTrips === 1 ? "trip" : "trips"} completed`
      : "Active Explorer");

  const isTripDetail = primaryDetail.toLowerCase().includes("going to") ||
    primaryDetail.toLowerCase().includes("visiting") ||
    primaryDetail.toLowerCase().includes("traveling");

  return (
    <div
      className="group flex flex-col shrink-0 p-3 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-brand-300/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.08)] transition-all duration-200"
    >
      <div
        className="cursor-pointer space-y-2.5"
        onClick={() => navigate(`/profile/${user._id || user.id}`)}
      >
        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar Container */}
          <div className="shrink-0 relative">
            <img
              src={getAvatarUrl(user, user.name)}
              alt={user.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name || "Explorer"
                )}&background=7C3AED&color=fff&bold=true`;
              }}
            />

            {/* Status dot / Compass Badge */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs border border-slate-100 flex items-center justify-center">
              {isSameCity ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block ring-2 ring-white animate-pulse" title="In Your City" />
              ) : (
                <Compass className="w-2.5 h-2.5 text-brand-600" />
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[13px] font-extrabold text-slate-800 truncate block group-hover:text-brand-600 transition-colors font-heading">
                  {user.name || "Explorer"}
                </span>
                {user.isVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 fill-blue-50" />
                )}
              </div>

              {/* Match Percentage Chip */}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-[#7C3AED] border border-purple-100 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-[#7C3AED]" />
                {matchPercentage}%
              </span>
            </div>

            {/* Location Chip */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10.5px] font-semibold text-slate-500 truncate flex items-center gap-1">
                <MapPin className={`w-3 h-3 shrink-0 ${isSameCity ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="truncate">{locationString || "Explorer"}</span>
              </p>
              {isSameCity && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  Local
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Highlight Pill */}
        {primaryDetail && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border truncate ${
              isTripDetail
                ? "bg-gradient-to-r from-violet-50 via-purple-50/70 to-indigo-50/50 text-violet-900 border-violet-100/90 shadow-[inset_0_1px_2px_rgba(124,58,237,0.03)]"
                : "bg-slate-50 text-slate-700 border-slate-100"
            }`}
          >
            {isTripDetail ? (
              <Compass className="w-3 h-3 text-[#7C3AED] shrink-0" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <span className="truncate">{primaryDetail}</span>
          </div>
        )}
      </div>

      {/* Follow Action Button */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 relative z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onFollowToggle && !followLoading) {
              onFollowToggle(user);
            }
          }}
          disabled={followLoading}
          className={`w-full text-[11px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
            isFollowing
              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              : isRequested
              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_2px_10px_rgba(124,58,237,0.25)] hover:shadow-[0_4px_14px_rgba(124,58,237,0.35)]"
          }`}
        >
          {followLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            <><Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Following</>
          ) : isRequested ? (
            <><UserCheck className="w-3.5 h-3.5 text-amber-600" /> Requested</>
          ) : isFollowBack ? (
            <><UserPlus className="w-3.5 h-3.5 text-white" /> Follow Back</>
          ) : (
            <><UserPlus className="w-3.5 h-3.5 text-white" /> Follow</>
          )}
        </button>
      </div>
    </div>
  );
};

export default TravelerSuggestionCard;