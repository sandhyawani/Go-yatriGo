import React, { useState, useEffect } from "react";
import { Compass, Map, Users, Camera, Award } from "lucide-react";
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

  const journeys = stats?.totalJourneys ?? activeJourneysCount ?? 0;
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
        description="Active trips" /> :


        <EmptyState
        title="0 Journeys"
        subtitle="Plan your next trip"
        actionLabel="Create"
        actionLink="/journey/new"
        className="h-full" />}



        {memories > 0 ?
        <DashboardStatCard
        icon={Camera}
        title="Memories"
        value={memories}
        accent="warning"
        description="Captured moments" /> :


        <EmptyState
        title="0 Memories"
        subtitle="Start capturing your trips"
        actionLabel="Travel Memory"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="h-full" />}



        {buddies > 0 ?
        <DashboardStatCard
        icon={Users}
        title="Trip Mates"
        value={buddies}
        accent="info"
        description="Travel network" /> :


        <EmptyState
        title="0 Trip Mates"
        subtitle="Find Trip Mates"
        actionLabel="Explore"
        actionLink="/social/buddy"
        className="h-full" />}



        {stamps > 0 ?
        <DashboardStatCard
        icon={Award}
        title="Badges"
        value={stamps}
        accent="success"
        description="Unlocked achievements" /> :


        <EmptyState
        title="0 Badges"
        subtitle="Unlock your first badge"
        className="h-full" />}


      </div>
    </div>);

};

export default ExplorerDashboardWidget;