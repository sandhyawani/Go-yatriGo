import React, { useState, useEffect } from "react";
import { Compass, Map, Users, Camera, Award, Plane } from "lucide-react";
import axios from "../../api/axios";
import DashboardStatCard from "./cards/DashboardStatCard";
import SectionHeader from "../common/SectionHeader";
import EmptyState from "../common/EmptyState";

const ExplorerDashboardWidget = ({ user, memoriesCount: fallbackMemories, activeJourneysCount }) => {
  const [stats, setStats] = useState(null);

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      try {
        const statsRes = await axios.get(`/journeys/stats/user/${userId}`, { withCredentials: true });

        if (statsRes.data?.success && statsRes.data.stats) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error("Failed to sync dashboard stats", err);
      }
    };
    fetchStats();
  }, [userId]);

  const journeys = stats ? ((stats.ongoing || 0) + (stats.upcoming || 0)) : (activeJourneysCount ?? 0);
  const upcomingTrips = stats?.upcoming ?? 0;
  const memories = stats?.postsShared ?? fallbackMemories ?? 0;
  const buddies = stats?.companionsCount ?? 0;
  const stamps = stats?.achievements?.length ?? 0;

  return (
    <div className="mb-[var(--spacing-section)]">
      <SectionHeader
      title="Travel Dashboard"
      subtitle="Your Activity Summary"
      icon={Compass} />

      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {journeys > 0 ?
        <DashboardStatCard
        icon={Map}
        title="Journeys"
        value={journeys}
        accent="primary"
        description="Active" /> :


        <EmptyState
        title="0 Journeys"
        subtitle="Plan your first trip"
        actionLabel="Explore"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="h-full" />}



        {upcomingTrips > 0 ?
          <DashboardStatCard
          icon={Plane}
          title="Upcoming Trips"
          value={upcomingTrips}
          accent="warning"
          description="Next trip" /> :
  
          <EmptyState
          title="0 Upcoming"
          subtitle="Plan your next trip"
          actionLabel="Explore"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-full" />}



        {buddies > 0 ?
        <DashboardStatCard
        icon={Users}
        title="Trip Mates"
        value={buddies}
        accent="info"
        description="Network" /> :


        <EmptyState
        title="0 Mates"
        subtitle="Connect with travelers"
        actionLabel="Find Buddies"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="h-full" />}



        {stamps > 0 ?
        <DashboardStatCard
        icon={Award}
        title="Badges"
        value={stamps}
        accent="success"
        description="Earned" /> :


        <EmptyState
        title="0 Badges"
        subtitle="Unlock your first badge"
        className="h-full" />}


      </div>
    </div>);

};

export default ExplorerDashboardWidget;