import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Users, Sparkles, TrendingUp, Compass, Lightbulb, Plus, Shield, RefreshCw } from "lucide-react";
import JourneyMatesSuggestions from "../social/JourneyMatesSuggestions";
import axios from "../../api/axios";
import { getAvatarUrl } from "../../utils/avatar";

const TRENDING_DESTINATIONS = [
  { name: "Manali, Himachal", tag: "🏔️ Mountains", travelers: "480+", destination: "Manali" },
  { name: "Goa Coast", tag: "🏖️ Beach & Sun", travelers: "620+", destination: "Goa" },
  { name: "Rishikesh, Uttarakhand", tag: "🧘 Rafting & Yoga", travelers: "340+", destination: "Rishikesh" },
  { name: "Ladakh, J&K", tag: "🏍️ Road Trips", travelers: "290+", destination: "Ladakh" },
  { name: "Jaipur, Rajasthan", tag: "🏰 Heritage", travelers: "310+", destination: "Jaipur" },
];

const TRAVEL_TIPS = [
  {
    title: "Split Backpack Essentials",
    tip: "Coordinate group gears like stoves, power banks, and medical kits to save up to 3kg per traveler.",
    icon: "🎒",
  },
  {
    title: "Offline SOS Setup",
    tip: "Set up Emergency Contacts in your safety settings before exploring remote valleys with spotty cellular reception.",
    icon: "🛡️",
  },
  {
    title: "Pre-trip Group Pool",
    tip: "Set a shared deposit for shared fuel and food expenses so budgeting stays effortless throughout the road trip.",
    icon: "💰",
  },
  {
    title: "Responsible Mountain Trails",
    tip: "Practice leave-no-trace ethics on treks and stay in family-run local homestays to support local communities.",
    icon: "🌿",
  },
];

export const TrendingDestinationsWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-text-primary leading-tight">
              Trending Destinations
            </h3>
            <p className="text-[10px] text-text-muted font-medium mt-0.5">Top explorer spots this month</p>
          </div>
        </div>
        <Link
          to="/social/explore"
          className="text-[12px] font-bold text-brand hover:text-brand-dark transition-colors"
        >
          Explore
        </Link>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {TRENDING_DESTINATIONS.map((dest, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/social/buddy?search=${encodeURIComponent(dest.destination)}`)}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-background transition-all duration-200 cursor-pointer"
          >
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50/70 border border-brand-100 flex items-center justify-center text-brand text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                #{idx + 1}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                  {dest.name}
                </p>
                <p className="text-[10px] text-text-muted font-medium flex items-center gap-1.5 mt-0.5">
                  <span>{dest.tag}</span>
                  <span>•</span>
                  <span className="text-brand font-semibold">{dest.travelers} active</span>
                </p>
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TravelTipWidget = () => {
  const [tipIndex, setTipIndex] = useState(0);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % TRAVEL_TIPS.length);
  };

  const currentTip = TRAVEL_TIPS[tipIndex];

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-surface to-brand-50/40 rounded-2xl border border-amber-200/70 p-4 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{currentTip.icon}</span>
          <h4 className="text-xs font-bold text-amber-950 font-heading">
            Travel Tip • {currentTip.title}
          </h4>
        </div>
        <button
          onClick={handleNextTip}
          className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
          title="Next travel tip"
          aria-label="Next tip"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
        {currentTip.tip}
      </p>
    </div>
  );
};

export const QuickCreateCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-brand-50/80 via-surface to-sky-50/50 rounded-2xl border border-brand-200/80 p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-brand" />
        <h4 className="text-xs font-bold text-text-primary font-heading">Planning an Adventure?</h4>
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed mb-3">
        Host a group trip, set itinerary dates, and connect with matching buddies.
      </p>
      <button
        onClick={() => navigate("/social/buddy/new")}
        className="w-full py-2 px-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Create Travel Group</span>
      </button>
    </div>
  );
};

export const SidebarFooter = () => (
  <footer className="px-2 pt-1 pb-1 text-[11px] text-text-muted space-y-2 select-none">
    <nav className="flex flex-wrap gap-x-2.5 gap-y-1 font-medium text-slate-500" aria-label="Footer links">
      <Link to="/settings/legal/privacy" className="hover:text-brand transition-colors">Privacy</Link>
      <span>•</span>
      <Link to="/settings/legal/terms" className="hover:text-brand transition-colors">Terms</Link>
      <span>•</span>
      <Link to="/settings/safety-guidelines" className="hover:text-brand transition-colors">Safety</Link>
      <span>•</span>
      <Link to="/settings/community-guidelines" className="hover:text-brand transition-colors">Guidelines</Link>
      <span>•</span>
      <Link to="/help-support" className="hover:text-brand transition-colors">Help</Link>
    </nav>
    <p className="text-[10px] text-slate-400">
      © {new Date().getFullYear()} Go YatriGo • Explore • Connect • Travel Together
    </p>
  </footer>
);

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

    if (!user?.state && !user?.city) return notJoinedTrips.slice(0, 30);

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

    return sortedTrips.slice(0, 30);
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
      <div className={`bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-brand shrink-0" />
            </div>
            <h3 className="text-[13px] font-bold text-text-primary leading-tight">
              {activeGroupsTitle}
            </h3>
          </div>
          <Link
            to="/social/buddy"
            className="text-[12px] font-bold text-brand hover:text-brand-dark transition-colors"
          >
            Explore
          </Link>
        </div>
        <div className="h-[224px] flex flex-col items-center justify-center py-4 text-center space-y-2 px-4">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center mx-auto text-text-muted">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">No active groups right now</p>
            <p className="text-[11px] text-text-muted mt-0.5">Be the first to start a group trip</p>
          </div>
          <Link
            to="/social/buddy/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-dark hover:bg-brand-100 transition-colors border border-brand-200"
          >
            + Create Group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-brand shrink-0" />
          </div>
          <h3 className="text-[13px] font-bold text-text-primary leading-tight">
            {activeGroupsTitle}
          </h3>
        </div>
        <Link
          to="/social/buddy"
          className="text-[12px] font-bold text-brand hover:text-brand-dark transition-colors"
        >
          See all
        </Link>
      </div>

      {/* Trip rows with internal scrolling for ~3 visible items */}
      <div className="px-3 py-2 h-[250px] overflow-y-auto overscroll-contain scrollbar-thin space-y-1.5">
        {displayTrips.map((trip) => {
          const myUserId = user?._id?.toString();
          const isJoined = trip.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
            (trip.userId?._id || trip.userId || trip.host?._id || trip.host)?.toString() === myUserId;

          const hostUser = trip.host || trip.userId || trip.creator || {};
          const hostAvatarUrl = getAvatarUrl(hostUser, trip.coverImage, trip.image, hostUser.name || trip.title || "Traveler");

          return (
            <div
              key={trip._id}
              onClick={() => navigate(`/social/buddy/${trip._id}`)}
              className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-background transition-all duration-200 cursor-pointer"
            >
              <img
                src={hostAvatarUrl}
                alt={hostUser.name || trip.title || "Host"}
                className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs border border-border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getAvatarUrl(hostUser, hostUser.name || trip.destination || "TR");
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-text-primary truncate group-hover:text-brand-dark transition-colors" title={trip.title}>
                  {trip.title}
                </p>
                <p className="text-[10.5px] text-text-muted font-medium flex items-center gap-0.5 mt-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-text-muted shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                </p>
                <p className={`text-[10px] font-semibold mt-0.5 ${
                  ((trip.maxMembers || 5) - (trip.members?.length || 0)) > 0
                    ? "text-emerald-600"
                    : "text-text-muted"
                }`}>
                  {Math.max(0, (trip.maxMembers || 5) - (trip.members?.length || 0))} slots open
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/social/buddy/${trip._id}`);
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-0.5 cursor-pointer ${
                  isJoined
                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    : "bg-secondary-100 hover:bg-secondary-200 text-text-secondary border border-border-default"
                }`}
              >
                {isJoined ? "Joined ✓" : <>Join <ChevronRight className="w-3 h-3 text-text-muted" /></>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
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
  className = "min-w-0 w-full flex flex-col gap-4 shrink-0"
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
      {/* 1. Travelers For You */}
      <JourneyMatesSuggestions
        currentUser={user}
        currentUserId={user?._id || user?.id}
        initialSuggestions={suggestions}
        handleFollowToggle={handleFollowToggle}
        followLoadingMap={followLoadingMap}
        tripMateStates={tripMateStates}
      />

      {/* 2. Active Travel Groups */}
      <ActiveTravelGroups user={user} nearbyTrips={nearbyTrips} />

      {/* 3. Trending Travel Destinations */}
      <TrendingDestinationsWidget />

      {/* 4. Travel Tip of the Day */}
      <TravelTipWidget />

      {/* 5. Quick Create Group CTA */}
      <QuickCreateCard />

      {/* 6. Platform Links & Footer */}
      <SidebarFooter />
    </div>
  );
};

export default RightSidebar;