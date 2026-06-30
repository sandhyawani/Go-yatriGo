import React from "react";
import { Link } from "react-router-dom";
import { Compass, UserPlus, MapPin, Check } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const RightSidebar = ({
  user,
  suggestions,
  nearbyTrips,
  handleFollowToggle,
  followLoadingMap,
}) => {
  return (
    <div className="sticky top-6 w-[330px] max-w-[330px] hidden lg:flex flex-col space-y-6">
      {/* Profile Mini Card */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={getAvatarUrl(user?.pic, user?.img, user?.name)}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
            }}
          />
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-slate-800 truncate">
              {user?.name}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium block leading-none mt-0.5 truncate">
              {user?.type || "Traveler"}
            </span>
          </div>
        </div>
        <Link
          to="/profile"
          className="text-[10px] font-bold text-[#6C4DF6] hover:text-[#5b3ee0] transition-colors shrink-0"
        >
          Profile
        </Link>
      </div>

      {/* Suggested Explorers */}
      {suggestions?.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-wide">
              Suggested Explorers
            </h3>
            <Link
              to="/social/buddy"
              className="text-[10px] font-bold text-slate-400 hover:text-[#6C4DF6] transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-2 overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
            {suggestions.map((s) => {
              const myId = (user?._id || user?.id)?.toString();
              const isFollowing = s.followers?.some(
                (id) => id?.toString() === myId,
              );
              const isRequested = s.followRequests?.some(
                (id) => id?.toString() === myId,
              );
              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between group"
                >
                  <Link
                    to={`/profile/${s._id}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <img
                      src={getAvatarUrl(s, s.name)}
                      alt={s.name}
                      className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800 truncate flex items-center gap-1">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        @{s.name?.replace(/\s+/g, "").toLowerCase()}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleFollowToggle && handleFollowToggle(s)}
                    disabled={followLoadingMap && followLoadingMap[s._id]}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 ml-2 flex items-center justify-center gap-1 ${isFollowing || isRequested ? "bg-slate-100/50 text-slate-500 hover:bg-rose-50 hover:text-rose-500" : "bg-[#6C4DF6]/10 text-[#6C4DF6] hover:bg-[#6C4DF6] hover:text-white"}`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3" />
                        Following
                      </>
                    ) : isRequested ? (
                      "Requested"
                    ) : (
                      "Follow"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Travel Groups */}
      {nearbyTrips?.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-wide">
              Active Travel Groups
            </h3>
            <Link
              to="/social/buddy"
              className="text-[10px] font-bold text-slate-400 hover:text-[#6C4DF6] transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-2 overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
            {nearbyTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-start gap-3 group cursor-pointer"
                onClick={() =>
                  (window.location.href = `/social/buddy/${trip._id}`)
                }
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6C4DF6] flex items-center justify-center font-bold text-sm shrink-0">
                  {trip.destination
                    ? trip.destination.substring(0, 2).toUpperCase()
                    : "TR"}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12px] font-semibold text-slate-800 truncate"
                    title={trip.title}
                  >
                    {trip.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-300" />{" "}
                    {trip.destination}
                  </p>
                  <p className="text-[9px] font-semibold text-[#6C4DF6] mt-0.5">
                    {Math.max(0, trip.maxMembers - (trip.members?.length || 0))}{" "}
                    slots open
                  </p>
                </div>
                <Link
                  to={`/social/buddy/${trip._id}`}
                  className="text-[10px] font-bold text-[#6C4DF6] bg-[#6C4DF6]/10 hover:bg-[#6C4DF6] hover:text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  Join
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Card */}
      <div className="bg-gradient-to-br from-[#6C4DF6] to-[#5b3ee0] p-5 rounded-3xl shadow-[0_8px_30px_rgba(108,77,246,0.15)] hover:-translate-y-0.5 transition-all duration-300 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <h3 className="text-base font-bold leading-tight tracking-wide">
            Planning a trip?
          </h3>
          <p className="text-xs font-medium text-white/80 leading-relaxed max-w-[200px]">
            Create a group and invite travelers to join your adventure.
          </p>
          <Link
            to="/social/buddy/new"
            className="inline-block bg-white text-[#6C4DF6] text-[11px] font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Create Group
          </Link>
        </div>
        <Compass className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10" />
      </div>
    </div>
  );
};
export default RightSidebar;
