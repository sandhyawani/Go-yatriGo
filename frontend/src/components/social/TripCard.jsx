import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Compass } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const TripCard = ({ trip, user, handleFelt }) => {
  const navigate = useNavigate();

  const slotsOpen = Math.max(0, trip.maxCompanions - (trip.companions?.length || 0));
  const isLiked = user && trip.likes?.includes(user._id);

  const startDate = new Date(trip.startDate);
  const isStartingSoon = (startDate - new Date()) / (1000 * 60 * 60 * 24) <= 7 && trip.lifecycleStatus === 'upcoming';

  const travelDates = startDate.toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  }) + " - " + new Date(trip.endDate).toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  });

  const currentUserId = (user?._id || user?.id)?.toString();
  const hasRequested = trip.joinRequests?.some((req) => req.status === "Pending" && (req.userId?._id || req.userId)?.toString() === currentUserId);
  const hasJoined = trip.companions?.some((c) => (c.userId?._id || c.userId || c._id || c)?.toString() === currentUserId);

  const isInactive = trip.lifecycleStatus === 'completed' || trip.lifecycleStatus === 'cancelled';

  const getStatusBadge = () => {
    const s = trip.lifecycleStatus?.toLowerCase();
    if (s === "cancelled") {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1.5 select-none">
          Cancelled
        </span>);

    }
    if (s === "completed") {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-slate-50 text-slate-600 border border-slate-200 shadow-xs flex items-center gap-1.5 select-none">
          Completed
        </span>);

    }
    if (s === "active now" || s === "active") {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-1.5 select-none">
          Active Now
        </span>);

    }
    if (isStartingSoon) {
      return (
        <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-amber-50 text-amber-700 border border-amber-200 shadow-xs flex items-center gap-1.5 select-none">
          Starting Soon
        </span>);

    }

    return (
      <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md bg-sky-50 text-sky-700 border border-sky-200 shadow-xs flex items-center gap-1.5 select-none">
        Upcoming
      </span>);

  };

  return (
    <motion.div
    layout
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    onClick={() => navigate(`/social/buddy/${trip._id}`)}
    className={`bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[24px] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer group active:scale-[0.98] ${
    isInactive ? 'opacity-75 grayscale-[0.3] hover:grayscale-0' : ''
    }`}>

      {}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {trip.coverImage ?
        <img
        src={trip.coverImage}
        alt={trip.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" /> :


        <Compass className="w-16 h-16 text-slate-300" />}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          {getStatusBadge()}
          <button
          onClick={(e) => handleFelt(trip._id, e)}
          className={`p-2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90 ${
          isLiked ? "bg-white/95 shadow-sm" : "bg-black/30 hover:bg-black/50"
          }`}>

            <span className={`text-[16px] leading-none transition-all duration-300 ${isLiked ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}`}>✨</span>
          </button>
        </div>

        {}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
           <div className="flex -space-x-2">
             {trip.companions?.slice(0, 4).map((comp, i) =>
            <img
            key={i}
            src={getAvatarUrl(comp.pic, comp.img, comp.name)}
            alt="Traveler"
            className="w-7 h-7 rounded-full border-[1.5px] border-white object-cover shadow-sm" />

            )}
             {trip.companions?.length > 4 &&
            <div className="w-7 h-7 rounded-full border-[1.5px] border-white bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold z-10 shadow-sm">
                 +{trip.companions.length - 4}
               </div>}

           </div>
           
           {isStartingSoon &&
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-xs">
               Starts Soon
             </span>}

        </div>
      </div>

      {}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        
        {}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-black text-[#1E293B] leading-tight mb-1 truncate group-hover:text-brand-600 transition-colors">
              {trip.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
              <span>By <span className="font-bold text-slate-700">{trip.userId?.name || "Traveler"}</span></span>
              <span>•</span>
              <span className="flex items-center text-amber-500 font-bold">
                ★ {trip.userId?.rating || "4.8"}
              </span>
            </div>
          </div>
          
          <img
          onClick={(e) => {e.stopPropagation();navigate(`/profile/${trip.userId?._id}`);}}
          src={getAvatarUrl(trip.userId?.pic, trip.userId?.img, trip.userId?.name)}
          alt={trip.userId?.name}
          className="w-8 h-8 rounded-full object-cover shadow-xs shrink-0 cursor-pointer border border-slate-100 hover:ring-2 hover:ring-brand-600 transition-all duration-300" />

        </div>

        {}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-start gap-2.5 text-[13px] font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 leading-snug">
              {trip.from ? `${trip.from} ` : ''}
              {trip.from && <span className="text-slate-400 font-medium mx-1">→</span>}
              {trip.destination}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            {travelDates}
          </div>
        </div>

        {}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100/60">
          <div className="flex flex-col">
             {trip.lifecycleStatus === 'completed' ?
            <>
                 <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 leading-none select-none">
                   ✓ Trip completed
                 </span>
                 <span className="text-[13px] font-black text-slate-700 dark:text-slate-350 leading-none mt-1.5 select-none">
                   {trip.companions?.length || 0} {(trip.companions?.length || 0) === 1 ? 'traveler' : 'travelers'} joined
                 </span>
               </> :

            <>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none select-none">Availability</span>
                 <span className="text-[13px] font-bold text-slate-700 leading-none mt-1.5 select-none">
                   {slotsOpen > 0 ?
                <><span className="text-slate-800 font-extrabold">{slotsOpen}</span> spots left</> :

                <span className="text-rose-600 font-bold">Full</span>}

                 </span>
               </>}

          </div>

          {!isInactive && trip.userId?._id !== user?._id && (() => {
            const isJoiningClosed = trip.lifecycleStatus === 'active' && trip.allowJoinAfterStart === false;
            const canJoin = !hasJoined && !hasRequested && slotsOpen > 0 && !isJoiningClosed;

            return (
              <button
              onClick={(e) => {
                e.stopPropagation();
                if (canJoin) {
                  navigate(`/social/buddy/${trip._id}`);
                }
              }}
              className={`px-4 py-2 text-[11px] font-bold tracking-wide rounded-full transition-all active:scale-[0.97] duration-200 ${
              hasJoined ?
              "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none" :
              hasRequested ?
              "bg-amber-50 text-amber-700 border border-amber-200 shadow-none" :
              isJoiningClosed ?
              "bg-slate-100 text-slate-400 border border-slate-200 shadow-none pointer-events-none" :
              slotsOpen <= 0 ?
              "bg-rose-50 text-rose-500 border border-rose-100 shadow-none pointer-events-none" :
              "bg-brand-600 hover:bg-brand-700 text-white shadow-xs hover:shadow-md"
              }`}>

                {hasJoined ?
                "Joined" :
                hasRequested ?
                "Pending" :
                isJoiningClosed ?
                "Joining Closed" :
                slotsOpen <= 0 ?
                "Group Full" :
                trip.lifecycleStatus === "active" ?
                "Join Active Trip" :
                "Join Trip"}
              </button>);

          })()}
        </div>
        
      </div>
    </motion.div>);

};

export default TripCard;