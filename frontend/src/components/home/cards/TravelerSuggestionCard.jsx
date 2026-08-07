import React from "react";
import { Link } from "react-router-dom";
import { Check, Compass } from "lucide-react";
import Card from "../../common/Card";
import { getAvatarUrl } from "../../../utils/avatar";

const TravelerSuggestionCard = ({
  user,
  currentUserId,
  isFollowing,
  isRequested,
  followLoading,
  onFollowToggle
}) => {
  return (
    <Card variant="default" padding="sm" interactive className="group flex flex-col shrink-0 min-w-[240px] max-w-[280px]">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <Link to={`/profile/${user._id}`} className="shrink-0 relative">
          <img
          src={getAvatarUrl(user, user.name)}
          alt={user.name}
          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name || "Explorer"
            )}&background=7C3AED&color=fff&bold=true`;
          }} />

          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
            <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
          to={`/profile/${user._id}`}
          className="text-sm font-black text-slate-800 truncate block hover:text-[#7C3AED] transition-colors">

            {user.name}
          </Link>
          <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
            {user.isSameCity ? "Same City" : "Traveler"} • {user.interestMatchesCount > 0 ? `${user.interestMatchesCount} common interests` : user.interests?.length ? `${user.interests.length} interests` : "Explorer"}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 relative z-10">
        <button
        onClick={() => onFollowToggle(user)}
        disabled={followLoading}
        className={`w-full text-[11px] font-bold uppercase tracking-widest py-2 rounded-[var(--radius-button)] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60 ${
        isFollowing ?
        "bg-emerald-50 text-emerald-700 border border-emerald-200" :
        isRequested ?
        "bg-amber-50 text-amber-700 border border-amber-200" :
        "bg-white text-slate-600 hover:text-[#7C3AED] hover:border-[#7C3AED] border border-slate-200 hover:bg-[#F3E8FF]"
        }`}>

          {isFollowing ?
          <><Check className="w-3.5 h-3.5 text-emerald-600" /> Connected</> :
          isRequested ?
          "Pending" :

          "+ Mate"}

        </button>
      </div>
    </Card>);

};

export default TravelerSuggestionCard;