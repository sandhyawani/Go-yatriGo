import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Users, Award, Plane } from "lucide-react";
import axios from "../../api/axios";
import { useTripMates } from "../../hooks/useTripMates";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const ExplorerDashboardWidget = ({ user, activeJourneysCount, onUpcomingClick }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?._id || user?.id;
  const rawName = user?.name ? user.name.split(" ")[0] : "Explorer";
  const firstName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() : "Explorer";
  const { tripMatesCount } = useTripMates(userId);

  useEffect(() => {
    if (!userId) return;
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const statsRes = await axios.get(`/journeys/stats/user/${userId}`, { withCredentials: true }).catch(() => ({ data: {} }));
        if (statsRes.data?.success && statsRes.data.stats) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error("Failed to sync dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [userId]);

  const currentTrips = stats?.ongoing !== undefined ? stats.ongoing : (activeJourneysCount ?? 0);
  const upcomingTrips = stats?.upcoming ?? 0;
  const badgesCount = stats?.achievements?.length ?? 0;
  const isNewUser = currentTrips === 0 && upcomingTrips === 0 && (tripMatesCount ?? 0) === 0;

  return (
    <div className="mb-4 space-y-3">
      {/* Warm Personal Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-text-primary tracking-tight font-heading flex items-center gap-2">
            <span>{getGreeting()}, {firstName}</span>
            <span className="inline-block animate-wave text-base">👋</span>
          </h1>
          <p className="text-xs text-text-muted font-medium mt-0.5">
            {isNewUser ? "Explore trips & meet fellow travelers." : "Ready for your next journey?"}
          </p>
        </div>
      </div>

      {/* Sleek, Compact Stat Chips - Grid layout so no boxes get cut off */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-10 w-full rounded-xl skeleton-shimmer" />
          ))
        ) : (
          <>
            {/* Current Trip Chip - Distinct Emerald / Live styling */}
            <button
              onClick={() => navigate("/social/journeys")}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-emerald-50/70 border border-border-default hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <span className="font-black text-text-primary font-heading shrink-0">{currentTrips}</span>
                <span className="font-semibold text-text-secondary truncate">Current<span className="hidden xl:inline"> Trip</span></span>
              </div>
            </button>

            {/* Upcoming Trips Chip - Amber theme */}
            <button
              onClick={() => {
                if (onUpcomingClick) {
                  onUpcomingClick();
                } else {
                  navigate("/social/journeys");
                }
              }}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-amber-50/70 border border-border-default hover:border-amber-300 shadow-2xs hover:shadow-sm transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Plane className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <span className="font-black text-text-primary font-heading shrink-0">{upcomingTrips}</span>
                <span className="font-semibold text-text-secondary truncate">Upcoming</span>
              </div>
            </button>

            {/* Trip Mates Chip - Sky Blue theme */}
            <button
              onClick={() => navigate("/social/explore")}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-sky-50/70 border border-border-default hover:border-sky-300 shadow-2xs hover:shadow-sm transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <span className="font-black text-text-primary font-heading shrink-0">{tripMatesCount}</span>
                <span className="font-semibold text-text-secondary truncate">Trip Mates</span>
              </div>
            </button>

            {/* Badges Chip - Purple theme */}
            <button
              onClick={() => navigate("/profile")}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-purple-50/70 border border-border-default hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full min-w-0"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <span className="font-black text-text-primary font-heading shrink-0">{badgesCount}</span>
                <span className="font-semibold text-text-secondary truncate">Badges</span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorerDashboardWidget;