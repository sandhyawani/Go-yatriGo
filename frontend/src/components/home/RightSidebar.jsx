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
    <div className="sticky top-6 w-full max-w-[320px] hidden lg:flex flex-col space-y-8 shrink-0">
      {/* Profile Mini Card */}
      <div className="card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={getAvatarUrl(user?.pic, user?.img, user?.name)}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Explorer")}&background=7C3AED&color=fff&bold=true`;
            }}
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate">
              {user?.name}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium block leading-none mt-1 truncate">
              {user?.type || "Traveler"}
            </span>
          </div>
        </div>
        <Link
          to="/profile"
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors shrink-0"
        >
          Profile
        </Link>
      </div>

      {/* Suggested Explorers */}
      {suggestions?.length > 0 && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Suggested Explorers
            </h3>
            <Link
              to="/social/buddy"
              className="text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
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
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "Explorer")}&background=7C3AED&color=fff&bold=true`;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
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
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 ml-2 flex items-center justify-center gap-1 ${
                      isFollowing
                        ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                        : isRequested
                        ? "bg-slate-100 text-slate-600"
                        : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3" />
                        My Journey Mate
                      </>
                    ) : isRequested ? (
                      "Requested"
                    ) : (
                      "Add Journey Mate"
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
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Active Travel Groups
            </h3>
            <Link
              to="/social/buddy"
              className="text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
            {nearbyTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-start gap-3 group cursor-pointer"
                onClick={() =>
                  (window.location.href = `/social/buddy/${trip._id}`)
                }
              >
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {trip.destination
                    ? trip.destination.substring(0, 2).toUpperCase()
                    : "TR"}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold text-slate-800 truncate"
                    title={trip.title}
                  >
                    {trip.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-300" />{" "}
                    {trip.destination}
                  </p>
                  <p className="text-[10px] font-bold text-brand-600 mt-1">
                    {Math.max(0, trip.maxMembers - (trip.members?.length || 0))}{" "}
                    slots open
                  </p>
                </div>
                <Link
                  to={`/social/buddy/${trip._id}`}
                  className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-xl transition-all shrink-0"
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
      <div className="bg-brand-600 p-6 rounded-[24px] shadow-sm text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h3 className="text-base font-bold leading-tight tracking-wide font-heading">
            Planning a trip?
          </h3>
          <p className="text-xs font-medium text-white/80 leading-relaxed max-w-[200px]">
            Create a group and invite travelers to join your adventure.
          </p>
          <Link
            to="/social/buddy/new"
            className="inline-block bg-white text-brand-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
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

