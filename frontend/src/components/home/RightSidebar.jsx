import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, MapPin, ChevronRight, Sparkles, Users } from "lucide-react";
import JourneyMatesSuggestions from "../social/JourneyMatesSuggestions";
import axios from "../../api/axios";
import Card from "../common/Card";


const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return "";
  }
};

const TravelHighlights = ({ travelMemories, onHighlightClick }) => {
  const highlights = useMemo(() => {
    if (!travelMemories || travelMemories.length === 0) return [];

    return [...travelMemories].
    filter((post) => post.image).
    map((post) => {
      let score = 0;
      if (post.destination) score += 5;
      if (post.journeyTag) score += 5;
      if (post.likes) score += post.likes.length * 2;
      if (post.commentsCount) score += post.commentsCount;
      return { post, score };
    }).
    sort((a, b) => b.score - a.score).
    map((item) => item.post).
    slice(0, 5);
  }, [travelMemories]);

  if (highlights.length === 0) return null;

  return (
    <Card variant="default" padding="md" className="space-y-4">
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
          Travel Highlights
        </h3>
      </div>
      
      <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-3 md:gap-0 md:space-y-3 pb-3 md:pb-0 scrollbar-none w-full">
        {highlights.map((post) => {
          const likesCount = post.likes?.length || 0;
          const commentsCount = post.commentsCount || 0;

          return (
            <Card
            variant="outlined"
            padding="sm"
            interactive
            key={post._id}
            onClick={() => onHighlightClick && onHighlightClick(post._id)}
            className="flex items-start gap-3 min-w-[220px] md:min-w-0 flex-1 shrink-0 md:shrink">

              <img
              src={post.image}
              alt="Highlight thumbnail"
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100" />

              
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                    {post.userId?.name || "Explorer"}
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium shrink-0">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.destination &&
                  <span className="bg-slate-100 text-slate-600 text-[8px] px-1.5 py-0.5 rounded-md truncate font-semibold max-w-[100px]" title={post.destination}>
                      📍 {post.destination.split(",")[0]}
                    </span>}

                  {post.journeyTag &&
                  <span className="bg-brand-50 text-brand-700 text-[8px] px-1.5 py-0.5 rounded-md font-bold truncate max-w-[100px]" title={post.journeyTag}>
                      🎒 {post.journeyTag}
                    </span>}

                </div>
                
                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-0.5">❤️ {likesCount}</span>
                  <span className="flex items-center gap-0.5">💬 {commentsCount}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

export const ActiveTravelGroups = ({
  user,
  nearbyTrips = [],
  className = ""
}) => {
  const navigate = useNavigate();

  const displayTrips = useMemo(() => {
    const myUserId = user?._id?.toString() || user?.id?.toString();
    const notJoinedTrips = (nearbyTrips || []).filter((t) => {
      const isJoined = t.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
        (t.userId?._id || t.userId || t.host?._id || t.host)?.toString() === myUserId;
      return !isJoined;
    });

    if (!user?.state && !user?.city) return notJoinedTrips.slice(0, 4);

    const userCity = (user?.city || "").toLowerCase();
    const userState = (user?.state || "").toLowerCase();

    const sortedTrips = [...notJoinedTrips].sort((a, b) => {
      const aFrom = (a.from || "").toLowerCase();
      const aDest = (a.destination || "").toLowerCase();
      const bFrom = (b.from || "").toLowerCase();
      const bDest = (b.destination || "").toLowerCase();

      const getScore = (fromStr, destStr) => {
        if (userCity && (fromStr.includes(userCity) || destStr.includes(userCity))) return 2;
        if (userState && (fromStr.includes(userState) || destStr.includes(userState))) return 1;
        return 0;
      };

      return getScore(bFrom, bDest) - getScore(aFrom, aDest);
    });

    return sortedTrips.slice(0, 4);
  }, [nearbyTrips, user?.state, user?.city, user?._id, user?.id]);

  const activeGroupsTitle = useMemo(() => {
    if (!user?.state) return "Active Travel Groups";
    const hasLocal = (nearbyTrips || []).some((t) =>
      t.destination?.toLowerCase().includes(user.state.toLowerCase()) ||
      t.from?.toLowerCase().includes(user.state.toLowerCase())
    );
    return hasLocal ? `Active Groups in ${user.state}` : "Active Travel Groups";
  }, [nearbyTrips, user?.state]);

  if (!displayTrips || displayTrips.length === 0) {
    return (
      <Card variant="default" padding="sm" className={`space-y-3 !p-4 border-slate-200/80 shadow-xs ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5 font-sans">
            <Users className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            {activeGroupsTitle}
          </h3>
          <Link
            to="/social/buddy"
            className="text-[10.5px] font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-[0.08em]"
          >
            Explore
          </Link>
        </div>
        <div className="py-4 text-center space-y-2">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">No active groups right now</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Be the first to start a group trip</p>
          </div>
          <Link
            to="/social/buddy/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors border border-brand-200"
          >
            + Create Group
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="sm" className={`space-y-3 !p-4 border-slate-200/80 shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5 font-sans">
          <Users className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          {activeGroupsTitle}
        </h3>
        <Link
          to="/social/buddy"
          className="text-[10.5px] font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-[0.08em]"
        >
          See All
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {displayTrips.map((trip) => {
          const myUserId = user?._id?.toString();
          const isJoined = trip.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
            (trip.userId?._id || trip.userId || trip.host?._id || trip.host)?.toString() === myUserId;

          return (
            <Card
              variant="default"
              padding="sm"
              interactive
              key={trip._id}
              onClick={() => navigate(`/social/buddy/${trip._id}`)}
              className="flex items-center gap-2.5 !p-2.5 border-slate-200/80 hover:border-brand-200 shadow-xs hover:shadow-sm transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs border border-brand-100">
                {trip.destination ? trip.destination.substring(0, 2).toUpperCase() : "TR"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors font-heading" title={trip.title}>
                  {trip.title}
                </p>
                <p className="text-[9.5px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                </p>
                <p className="text-[9px] font-bold text-brand-600 mt-0.5">
                  {Math.max(0, (trip.maxMembers || 5) - (trip.members?.length || 0))} slots open
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/social/buddy/${trip._id}`);
                }}
                className={`text-[10.5px] font-bold px-2.5 py-1 rounded-[var(--radius-button)] transition-all shrink-0 self-center flex items-center gap-0.5 ${
                  isJoined
                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    : "btn-primary !py-1 !px-2.5"
                }`}
              >
                {isJoined ? "Joined ✓" : <>Join <ChevronRight className="w-3 h-3" /></>}
              </button>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

const RightSidebar = ({
  user,
  suggestions,
  nearbyTrips: initialNearbyTrips,
  handleFollowToggle,
  followLoadingMap,
  travelMemories,
  onHighlightClick,
  tripMateStates,
  className = "min-w-0 w-full flex flex-col gap-4 shrink-0 self-start"
}) => {
  const [nearbyTrips, setNearbyTrips] = useState(initialNearbyTrips || []);

  useEffect(() => {
    if (initialNearbyTrips) {
      setNearbyTrips(initialNearbyTrips);
    } else {
      const fetchNearbyTrips = async () => {
        try {
          const res = await axios.get("/social/buddy", { withCredentials: true });
          if (res.data.success) {
            setNearbyTrips(res.data.trips || []);
          }
        } catch (e) {
          console.warn("Failed to fetch nearby trips in RightSidebar:", e);
        }
      };
      fetchNearbyTrips();
    }
  }, [initialNearbyTrips]);

  return (
    <div className={className}>
      <JourneyMatesSuggestions
        currentUser={user}
        currentUserId={user?._id || user?.id}
        initialSuggestions={suggestions}
        handleFollowToggle={handleFollowToggle}
        followLoadingMap={followLoadingMap}
        tripMateStates={tripMateStates}
      />

      {travelMemories && <TravelHighlights travelMemories={travelMemories} onHighlightClick={onHighlightClick} />}

      <ActiveTravelGroups user={user} nearbyTrips={nearbyTrips} />

      <Card variant="transparent" padding="md" interactive className="!bg-[#7C3AED] text-white border-none shadow-[0_12px_32px_rgb(124,58,237,0.18)] relative overflow-hidden group !p-4 rounded-2xl">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10 space-y-2.5">
          <h3 className="text-xs sm:text-sm font-extrabold leading-tight tracking-wider uppercase text-white font-heading">
            Planning a trip?
          </h3>
          <p className="text-[11px] font-medium text-white/90 leading-relaxed max-w-[200px]">
            Create a group and invite travelers to join your adventure.
          </p>
          <Link
            to="/social/buddy/new"
            className="inline-flex bg-white hover:bg-slate-50 text-[#7C3AED] text-[10.5px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all active:scale-95 shadow-xs"
          >
            Create Group
          </Link>
        </div>
        <Compass className="absolute -bottom-3 -right-3 w-16 h-16 text-white opacity-10" />
      </Card>
    </div>
  );
};

export default RightSidebar;