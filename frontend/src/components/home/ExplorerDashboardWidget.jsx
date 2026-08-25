import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, BookOpen, Users, Award, Plane } from "lucide-react";
import axios from "../../api/axios";
import DashboardStatCard from "./cards/DashboardStatCard";
import SectionHeader from "../common/SectionHeader";
import { useTripMates } from "../../hooks/useTripMates";

const ExplorerDashboardWidget = ({ user, activeJourneysCount, onUpcomingClick }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?._id || user?.id;
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

  const journeys = stats ? ((stats.ongoing || 0) + (stats.upcoming || 0)) : (activeJourneysCount ?? 0);
  const upcomingTrips = stats?.upcoming ?? 0;
  const badgesCount = stats?.achievements?.length ?? 0;

  return (
    <div className="mb-5">
      <SectionHeader
        title="Travel Dashboard"
        subtitle="Your Real-time Activity Summary"
        icon={Compass}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card h-[88px] animate-pulse bg-slate-100/70" />
          ))
        ) : (
          <>
            <DashboardStatCard
              icon={BookOpen}
              title="Journeys"
              value={journeys}
              accent="primary"
              description={journeys > 0 ? "Active & Planning" : "No active trips"}
              onClick={() => navigate("/social/journeys")}
            />

            <DashboardStatCard
              icon={Plane}
              title="Upcoming Trips"
              value={upcomingTrips}
              accent="warning"
              description={upcomingTrips > 0 ? "Next departure soon" : "Plan next adventure"}
              onClick={() => {
                if (onUpcomingClick) {
                  onUpcomingClick();
                } else {
                  navigate("/social/journeys");
                }
              }}
            />

            <DashboardStatCard
              icon={Users}
              title="Trip Mates"
              value={tripMatesCount}
              accent="info"
              description={tripMatesCount > 0 ? "Active connections" : "From active journeys"}
              onClick={() => navigate("/social/explore")}
            />

            <DashboardStatCard
              icon={Award}
              title="Badges"
              value={badgesCount}
              accent="success"
              description={badgesCount > 0 ? "Earned milestones" : "Explore to unlock"}
              onClick={() => navigate("/profile")}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorerDashboardWidget;