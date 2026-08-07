import React, { useState, useEffect } from "react";
import { Compass, Map, Users, Camera, Award } from "lucide-react";
import axios from "../../api/axios";
import DashboardStatCard from "./cards/DashboardStatCard";
import SectionHeader from "../common/SectionHeader";
import EmptyState from "../common/EmptyState";

const ExplorerDashboardWidget = ({ user, memoriesCount: fallbackMemories, activeJourneysCount }) => {
  const journeys = activeJourneysCount || 0;

  const [realMemories, setRealMemories] = useState(null);
  const [realBuddies, setRealBuddies] = useState(null);

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      try {
        const [profRes, memRes] = await Promise.all([
        axios.get(`/users/${userId}`, { withCredentials: true }),
        axios.get(`/social/memory?userId=${userId}&page=1&limit=50`, { withCredentials: true })]
        );

        if (profRes.data?.success || profRes.data?._id) {
          const u = profRes.data.user || profRes.data;
          setRealBuddies((u?.followers?.length || 0) + (u?.following?.length || 0));
        }
        if (memRes.data?.success) {
          setRealMemories(memRes.data.memories?.length || 0);
        }
      } catch (err) {
        console.error("Failed to sync dashboard stats", err);
      }
    };
    fetchStats();
  }, [userId]);

  const memories = realMemories !== null ? realMemories : fallbackMemories || 0;
  const buddies = realBuddies !== null ? realBuddies : (user?.followers?.length || 0) + (user?.following?.length || 0);
  const stamps = Math.floor(memories * 1.5);

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