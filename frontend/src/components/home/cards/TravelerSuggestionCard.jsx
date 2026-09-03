import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Compass,
  MapPin,
  UserCheck,
  UserPlus,
  BadgeCheck,
  Sparkles,
  Award,
} from "lucide-react";
import { getAvatarUrl } from "../../../utils/avatar";
import { isActuallyVerified } from "../../../utils/verification";

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
      (myIdStr &&
        user?.followers?.some(
          (f) => String(f?._id || f?.id || f) === myIdStr
        ))
  );
  const isRequested = Boolean(
    relationship?.requestSent ||
      user?.isRequested ||
      (myIdStr &&
        user?.followRequests?.some(
          (r) => String(r?._id || r?.id || r) === myIdStr
        ))
  );
  const isFollowBack = Boolean(
    !isFollowing &&
      !isRequested &&
      (relationship?.requestReceived ||
        relationship?.isFollower ||
        user?.isFollower ||
        (myIdStr &&
          user?.following?.some(
            (f) => String(f?._id || f?.id || f) === myIdStr
          )))
  );

  const locationString = [user.city, user.state].filter(Boolean).join(", ");

  const primaryDetail =
    user.primaryDetail ||
    user.recommendationReason ||
    user.suggestionReasonText ||
    (user.interests && user.interests.length > 0
      ? user.interests.slice(0, 2).join(" · ")
      : user.completedTrips > 0
      ? `${user.completedTrips} ${
          user.completedTrips === 1 ? "trip" : "trips"
        } completed`
      : null);

  const getDetailConfig = () => {
    if (!primaryDetail) return null;
    const lower = primaryDetail.toLowerCase();

    if (
      user.isOngoing ||
      lower.includes("currently in") ||
      lower.includes("currently traveling") ||
      lower.startsWith("currently")
    ) {
      return {
        type: "current",
        icon: (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        ),
        badgeClass:
          "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-semibold",
      };
    }

    if (
      user.isUpcoming ||
      lower.includes("going to") ||
      lower.includes("visiting") ||
      lower.includes("traveling") ||
      lower.includes("upcoming")
    ) {
      return {
        type: "upcoming",
        icon: <Compass className="w-2.5 h-2.5 text-sky-500 shrink-0" />,
        badgeClass:
          "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 font-semibold",
      };
    }

    if (lower.includes("recently visited") || lower.includes("recently traveled")) {
      return {
        type: "past",
        icon: <Compass className="w-2.5 h-2.5 text-purple-500 shrink-0" />,
        badgeClass:
          "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 font-medium",
      };
    }

    if (lower.includes("trip completed") || lower.includes("trips completed")) {
      return {
        type: "completed",
        icon: <Award className="w-2.5 h-2.5 text-amber-500 shrink-0" />,
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 font-medium",
      };
    }

    return {
      type: "interests",
      icon: <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />,
      badgeClass:
        "bg-indigo-50/70 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 font-medium",
    };
  };

  const detailConfig = getDetailConfig();

  // Button config
  const getButtonConfig = () => {
    if (isFollowing) {
      return {
        label: "Following",
        icon: <Check className="w-3 h-3 stroke-[2.5]" />,
        className:
          "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200",
      };
    }
    if (isRequested) {
      return {
        label: "Requested",
        icon: <UserCheck className="w-3 h-3" />,
        className:
          "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
      };
    }
    if (isFollowBack) {
      return {
        label: "Follow back",
        icon: null,
        className:
          "bg-brand-50 hover:bg-brand-100 text-brand-dark border border-brand-200 font-bold",
      };
    }
    return {
      label: "Follow",
      icon: null,
      className:
        "bg-primary-500 hover:bg-brand text-white shadow-sm shadow-brand/20",
    };
  };

  const btnConfig = getButtonConfig();

  return (
    <div
      className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-background transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/profile/${user._id || user.id}`)}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={getAvatarUrl(user, user.name)}
          alt={user.name}
          className="w-10 h-10 rounded-xl object-cover border border-border shadow-xs"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name || "Explorer"
            )}&background=0284c7&color=fff&bold=true`;
          }}
        />
        {/* Online/status dot */}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
      </div>

      {/* Info: Name, Location, Primary Detail */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[12px] font-bold text-text-primary truncate leading-tight group-hover:text-brand transition-colors">
            {user.name || "Explorer"}
          </span>
          {isActuallyVerified(user) && (
            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 fill-blue-50" title="Verified Traveler" />
          )}
        </div>

        {/* Home / Origin Location with distinct rose map pin and neutral slate text */}
        {locationString && (
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-rose-500" />
            <span className="truncate">{locationString}</span>
          </p>
        )}

        {/* Travel Status / Current Journey badge: clearly distinct in style, color and icon */}
        {detailConfig && (
          <div className="mt-1 flex items-center">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] border max-w-full truncate ${detailConfig.badgeClass}`}
            >
              {detailConfig.icon}
              <span className="truncate">{primaryDetail}</span>
            </span>
          </div>
        )}
      </div>

      {/* Follow Button - compact pill */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onFollowToggle && !followLoading) {
            onFollowToggle(user);
          }
        }}
        disabled={followLoading}
        className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-0.5 cursor-pointer disabled:opacity-60 ${btnConfig.className}`}
      >
        {followLoading ? (
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {btnConfig.icon}
            {btnConfig.label}
          </>
        )}
      </button>
    </div>
  );
};

export default TravelerSuggestionCard;