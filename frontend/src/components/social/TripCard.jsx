import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Compass } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";
import { normalizeJourneyStatus } from "../../utils/journeyLifecycle";

const TripCard = ({ trip, user, handleFelt }) => {
  const navigate = useNavigate();

  const hostUser = trip.host || trip.creator || trip.userId || {};
  const membersList = trip.members || trip.companions || [];
  const maxCapacity = trip.maxMembers || trip.maxCompanions || 0;
  
  const slotsOpen = Math.max(0, maxCapacity - membersList.length);
  const isLiked = user && trip.likes?.includes(user._id);

  const normalizedStatus = normalizeJourneyStatus(trip.lifecycleStatus, trip);
  const isInactive = normalizedStatus === "completed" || normalizedStatus === "cancelled";
  const isOngoing = normalizedStatus === "active";
  const isUpcoming = normalizedStatus === "upcoming";
  const isCancelled = normalizedStatus === "cancelled";
  const isCompleted = normalizedStatus === "completed";

  const startDate = new Date(trip.startDate);
  const isStartingSoon = (startDate - new Date()) / (1000 * 60 * 60 * 24) <= 7 && isUpcoming;

  const travelDates = startDate.toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  }) + " - " + new Date(trip.endDate).toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  });

  const currentUserId = (user?._id || user?.id)?.toString();
  const hasRequested =
    (trip.joinRequestStatus && String(trip.joinRequestStatus).toLowerCase() === "pending") ||
    trip.joinRequests?.some(
      (req) =>
        String(req.status).toLowerCase() === "pending" &&
        (req.userId?._id || req.userId)?.toString() === currentUserId
    );
  const hasJoined = membersList.some((m) => {
    const u = m.user || m.userId || m;
    return (u?._id || u?.id || u)?.toString() === currentUserId;
  });

  const getStatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1.5 select-none">
          Cancelled
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-slate-50 text-slate-600 border border-slate-200 shadow-xs flex items-center gap-1.5 select-none">
          Completed
        </span>
      );
    }
    if (isOngoing) {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-1.5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Progress
        </span>
      );
    }
    if (isStartingSoon) {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-amber-50 text-amber-700 border border-amber-200 shadow-xs flex items-center gap-1.5 select-none">
          Starting Soon
        </span>
      );
    }

    return (
      <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-brand-50 text-brand-700 border border-brand-200 shadow-xs flex items-center gap-1.5 select-none">
        Upcoming
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => navigate(`/social/buddy/${trip._id}`)}
      className={`w-full bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[var(--radius-card)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer group active:scale-[0.98] ${
        isInactive ? 'opacity-75 grayscale-[0.3] hover:grayscale-0' : ''
      }`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <Compass className="w-14 h-14 text-slate-300" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          {getStatusBadge()}
          <button
            onClick={(e) => handleFelt(trip._id, e)}
            className={`p-2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90 ${
              isLiked ? "bg-white/95 shadow-sm" : "bg-black/30 hover:bg-black/50"
            }`}
          >
            <span className={`text-[16px] leading-none transition-all duration-300 ${isLiked ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}`}>✨</span>
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
          {!isInactive && (
            <div className="flex -space-x-2">
              {membersList.slice(0, 4).map((m, i) => {
                const comp = m.user || m;
                return (
                  <img
                    key={i}
                    src={getAvatarUrl(comp?.pic, comp?.img, comp?.name)}
                    alt={comp?.name || "Traveler"}
                    className="w-7 h-7 rounded-full border-[1.5px] border-white object-cover shadow-sm"
                  />
                );
              })}
              {membersList.length > 4 && (
                <div className="w-7 h-7 rounded-full border-[1.5px] border-white bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold z-10 shadow-sm">
                  +{membersList.length - 4}
                </div>
              )}
            </div>
          )}
          
          {isStartingSoon && !isOngoing && (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-xs">
              Starts Soon
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md truncate max-w-[120px] font-sans">
              {trip.category || "Adventure"}
            </span>
            <div className="flex items-center gap-1 font-sans">
              <span className="text-[12px] font-semibold text-amber-500 flex items-center">
                ★ {hostUser?.rating || "4.8"}
              </span>
            </div>
          </div>
          
          <img
            onClick={(e) => {e.stopPropagation(); if (hostUser?._id) navigate(`/profile/${hostUser._id}`);}}
            src={getAvatarUrl(hostUser?.pic, hostUser?.img, hostUser?.name)}
            alt={hostUser?.name || "Traveler"}
            className="w-8 h-8 rounded-full object-cover shadow-xs shrink-0 cursor-pointer border border-slate-100 hover:ring-2 hover:ring-brand-600 transition-all duration-300"
          />
        </div>

        <h3 className="font-bold text-[15px] text-slate-800 tracking-tight leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors mb-3 font-heading">
          {trip.title}
        </h3>

        <div className="flex flex-col gap-2 mb-4 font-sans">
          <div className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 leading-snug font-medium">
              {trip.from ? `${trip.from} ` : ''}
              {trip.from && <span className="text-slate-400 font-normal mx-1">→</span>}
              <span className="font-semibold text-slate-800">{trip.destination}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] font-medium text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            {travelDates}
          </div>
        </div>

        <div className="mt-auto pt-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-t border-slate-100/60 font-sans">
          <div className="flex flex-col min-w-0">
            {isCompleted ? (
              <>
                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 leading-none select-none">
                  ✓ Trip completed
                </span>
                <span className="text-[13px] font-semibold text-slate-700 leading-none mt-1.5 select-none truncate">
                  {membersList.length} {membersList.length === 1 ? 'traveler' : 'travelers'} joined
                </span>
              </>
            ) : isCancelled ? (
              <>
                <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 leading-none select-none">
                  ✕ Trip cancelled
                </span>
              </>
            ) : isOngoing ? (
              <>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 leading-none select-none truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Journey in Progress
                </span>
                <span className="text-[13px] font-semibold text-slate-700 leading-none mt-1.5 select-none truncate">
                  {membersList.length} / {trip.maxMembers || 4} travelers
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em] leading-none select-none">Availability</span>
                <span className="text-[13px] font-semibold text-slate-700 leading-none mt-1.5 select-none truncate">
                  {slotsOpen > 0 ? (
                    <><span className="text-slate-800 font-bold">{slotsOpen}</span> spots left</>
                  ) : (
                    <span className="text-rose-600 font-bold">Full</span>
                  )}
                </span>
              </>
            )}
          </div>

          {!isInactive && hostUser?._id !== user?._id && (() => {
            const canJoin = !hasJoined && !hasRequested && slotsOpen > 0 && !isOngoing;

            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canJoin) {
                    navigate(`/social/buddy/${trip._id}`);
                  }
                }}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold tracking-wide rounded-full transition-all active:scale-[0.97] duration-200 shrink-0 font-sans ${
                  hasJoined
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none"
                    : hasRequested
                    ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-none"
                    : isOngoing
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none pointer-events-none"
                    : slotsOpen <= 0
                    ? "bg-rose-50 text-rose-500 border border-rose-100 shadow-none pointer-events-none"
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-xs hover:shadow-md"
                }`}
              >
                {hasJoined
                  ? "Joined"
                  : hasRequested
                  ? "Pending"
                  : isOngoing
                  ? "Journey in Progress"
                  : slotsOpen <= 0
                  ? "Group Full"
                  : "Join Trip"}
              </button>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
};

export default TripCard;