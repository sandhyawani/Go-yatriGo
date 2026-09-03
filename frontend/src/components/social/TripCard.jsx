import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  Star, 
  Users, 
  Zap, 
  CheckCircle2, 
  Lock
} from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";
import { normalizeJourneyStatus } from "../../utils/journeyLifecycle";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80";

const CATEGORY_STYLE_MAP = {
  "Trekking": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200/60" },
  "Roadtrip": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200/60" },
  "Heritage & Culture": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200/60" },
  "Spiritual": { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200/60" },
  "Beach": { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200/60" },
  "Wildlife & Safari": { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200/60" },
  "Backpacking": { bg: "bg-stone-100", text: "text-stone-800", border: "border-stone-200/60" },
  "Wellness & Retreat": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200/60" },
  "City Exploration": { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200/60" },
  "Journey": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-200/60" }
};

const TripCard = ({ trip, user, handleFelt }) => {
  const navigate = useNavigate();

  const hostUser = trip.host || trip.creator || trip.userId || {};
  const membersList = trip.members || trip.companions || [];
  const maxCapacity = trip.maxMembers || trip.maxCompanions || 0;
  
  const slotsOpen = Math.max(0, maxCapacity - membersList.length);
  const isLiked = user && (
    trip.likes?.includes(user._id) ||
    trip.likes?.some((id) => (id?._id || id)?.toString() === (user._id || user.id)?.toString())
  );
  const likesCount = trip.likesCount || (Array.isArray(trip.likes) ? trip.likes.length : 0);

  const normalizedStatus = normalizeJourneyStatus(trip.lifecycleStatus, trip);
  const isInactive = normalizedStatus === "completed" || normalizedStatus === "cancelled";
  const isOngoing = normalizedStatus === "active";
  const isUpcoming = normalizedStatus === "upcoming";
  const isCancelled = normalizedStatus === "cancelled";
  const isCompleted = normalizedStatus === "completed";

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const isStartingSoon = (startDate - new Date()) / (1000 * 60 * 60 * 24) <= 7 && (startDate - new Date()) >= 0 && isUpcoming;

  const durationDays = Math.max(
    1,
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  );
  const durationText = durationDays === 1 ? "1 Day" : `${durationDays} Days`;

  const travelDates = startDate.toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  }) + " - " + endDate.toLocaleDateString(undefined, {
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
        <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-rose-500/85 text-white shadow-sm flex items-center gap-1.5 select-none">
          Cancelled
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-slate-900/70 text-slate-200 shadow-sm flex items-center gap-1.5 select-none">
          <CheckCircle2 className="w-3 h-3 text-slate-300" />
          Completed
        </span>
      );
    }
    if (isOngoing) {
      return (
        <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-emerald-600/90 text-white shadow-sm flex items-center gap-1.5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
          Live Trip
        </span>
      );
    }
    if (isStartingSoon) {
      return (
        <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-amber-500/90 text-white shadow-sm flex items-center gap-1.5 select-none">
          <Zap className="w-3 h-3 fill-white text-white" />
          Starting Soon
        </span>
      );
    }

    return (
      <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-white/90 text-slate-800 shadow-sm border border-white/50 flex items-center gap-1.5 select-none">
        <Calendar className="w-3 h-3 text-sky-600" />
        Upcoming
      </span>
    );
  };

  const categoryStyle = CATEGORY_STYLE_MAP[trip.category] || {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200/60"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => navigate(`/social/buddy/${trip._id}`)}
      className={`group w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-sky-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer active:scale-[0.99] ${
        isInactive ? 'opacity-75 grayscale-[0.2] hover:grayscale-0' : ''
      }`}
    >
      {/* Card Media Header - Bright, clean, subtle vignette */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        <img
          src={trip.coverImage || DEFAULT_COVER}
          alt={trip.title || "Trip"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_COVER;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Subtle top and bottom gradient only for text/badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none" />
        
        {/* Top Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
          {getStatusBadge()}
          
          <button
            onClick={(e) => handleFelt(trip._id, e)}
            title="Feel this vibe"
            className={`group/btn px-2.5 py-1 flex items-center gap-1.5 rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 ${
              isLiked
                ? "bg-white/95 text-amber-500 shadow-sm ring-1 ring-amber-400/40"
                : "bg-black/30 hover:bg-black/50 text-white/90"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLiked ? "fill-amber-400 text-amber-500" : "text-white/80"}`} />
            {likesCount > 0 && (
              <span className={`text-[11px] font-semibold ${isLiked ? "text-amber-600" : "text-white"}`}>
                {likesCount}
              </span>
            )}
          </button>
        </div>

        {/* Bottom Image Info: Duration & Travelers Avatars */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
          {!isInactive && (
            <div className="flex items-center -space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              {membersList.slice(0, 3).map((m, i) => {
                const comp = m.user || m;
                const compId =
                  comp?._id ||
                  comp?.id ||
                  (typeof comp === "string" ? comp : null);
                return (
                  <img
                    key={i}
                    src={getAvatarUrl(comp?.pic, comp?.img, comp?.name)}
                    alt={comp?.name || "Traveler"}
                    onClick={(e) => {
                      if (compId) {
                        e.stopPropagation();
                        navigate(`/profile/${compId}`);
                      }
                    }}
                    className={`w-5 h-5 rounded-full border border-white object-cover shadow-xs ${
                      compId ? "cursor-pointer hover:scale-110 hover:z-20 transition-transform" : ""
                    }`}
                  />
                );
              })}
              {membersList.length > 3 && (
                <div className="w-5 h-5 rounded-full border border-white bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold z-10">
                  +{membersList.length - 3}
                </div>
              )}
              <span className="text-[10px] font-medium text-white/95 ml-2 pr-0.5">
                {membersList.length} going
              </span>
            </div>
          )}

          {/* Duration Badge */}
          <span className="bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3 h-3 text-sky-300" />
            {durationText}
          </span>
        </div>
      </div>

      {/* Card Body - Perfectly Aligned Content */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        
        {/* Line 1: Category Tag & Host */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border truncate ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
            {trip.category || "Adventure"}
          </span>

          {(() => {
            const hostId =
              hostUser?._id ||
              hostUser?.id ||
              (typeof hostUser === "string" ? hostUser : null);
            return (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (hostId) navigate(`/profile/${hostId}`);
                }}
                title={`Hosted by ${hostUser?.name || 'Traveler'}`}
                className={`flex items-center gap-1.5 group/host shrink-0 ${hostId ? "cursor-pointer" : ""}`}
              >
                <img
                  src={getAvatarUrl(hostUser?.pic, hostUser?.img, hostUser?.name)}
                  alt={hostUser?.name || "Host"}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 group-hover/host:ring-sky-500 transition-all"
                />
                <span className="text-xs font-medium text-slate-600 group-hover/host:text-sky-600 transition-colors max-w-[100px] truncate">
                  {hostUser?.name?.split(" ")[0] || "Host"}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Line 2: Headline & Rating IN LINE */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 
            className="font-heading font-bold text-[15px] text-slate-900 tracking-tight leading-snug truncate flex-1 group-hover:text-sky-600 transition-colors" 
            title={trip.title}
          >
            {trip.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0 text-xs font-semibold text-slate-800">
            <Star className={`w-3.5 h-3.5 ${Number(hostUser?.rating) > 0 ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
            <span className={Number(hostUser?.rating) > 0 ? "" : "text-slate-500 font-medium"}>
              {Number(hostUser?.rating) > 0 ? hostUser.rating : "Unrated"}
            </span>
          </div>
        </div>

        {/* Line 3: Route & Dates (Clean, aligned in one horizontal flow) */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">
              {trip.from ? (
                <>
                  <span className="text-slate-500">{trip.from}</span>
                  <span className="text-sky-600 font-medium mx-1">→</span>
                  <span className="font-semibold text-slate-700">{trip.destination}</span>
                </>
              ) : (
                <span className="font-semibold text-slate-700">{trip.destination}</span>
              )}
            </span>
          </div>

          <span className="text-slate-300 shrink-0">·</span>

          <div className="flex items-center gap-1 shrink-0 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{travelDates}</span>
          </div>
        </div>

        {/* Line 4: Pricing/Capacity & Join CTA Button */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              {trip.budget && Number(trip.budget) > 0 ? (
                <>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{Number(trip.budget).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500">est.</span>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/50">
                  Split Cost
                </span>
              )}
            </div>

            <div className="mt-0.5">
              {isCompleted ? (
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Ended
                </span>
              ) : isCancelled ? (
                <span className="text-[11px] font-medium text-rose-500">Cancelled</span>
              ) : isOngoing ? (
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Progress
                </span>
              ) : slotsOpen > 0 ? (
                <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  {slotsOpen} {slotsOpen === 1 ? 'spot' : 'spots'} left
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Group Full
                </span>
              )}
            </div>
          </div>

          {/* Action Button - Unified Brand Button */}
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 shrink-0 select-none ${
                  hasJoined
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                    : hasRequested
                    ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-default"
                    : isOngoing || slotsOpen <= 0
                    ? "bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none"
                    : "bg-sky-600 hover:bg-sky-700 text-white shadow-xs active:scale-95 cursor-pointer"
                }`}
              >
                {hasJoined
                  ? "Joined"
                  : hasRequested
                  ? "Requested"
                  : isOngoing
                  ? "In Progress"
                  : slotsOpen <= 0
                  ? "Full"
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