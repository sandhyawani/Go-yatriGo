import React from "react";
import { Grid, Activity, Star, Compass, Globe, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

export const ProfileTabs = ({ activeTab, setActiveTab, isOwnProfile }) => {
  const tabs = [
  { id: "posts", icon: Grid, label: "Travel Memories", show: true },
  { id: "felt", icon: Star, label: "Felt Vibes", show: isOwnProfile },
  { id: "trips", icon: Compass, label: "Groups", show: true },
  {
    id: "journeys",
    icon: Globe,
    label: "Journeys",
    show: true
  },
  {
    id: "saved",
    icon: Bookmark,
    label: "Saved",
    show: isOwnProfile
  }].
  filter((t) => t.show);

  return (
    <div className="w-full overflow-x-auto scrollbar-none py-2">
      <div className="flex min-w-full w-max justify-start sm:justify-center px-2 sm:px-0">
        <div className="inline-flex gap-2 p-1.5 bg-slate-50/80 rounded-xl relative select-none border border-[#E5E7EB] shadow-soft shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-2 px-4 flex items-center gap-2 shrink-0 text-xs font-semibold tracking-wide transition-all duration-200 rounded-xl ${
            isActive ?
            "bg-[#7C3AED] text-white shadow-sm" :
            "bg-white text-[#64748B] hover:text-[#1E293B] border border-[#E5E7EB] hover:bg-slate-50"
            }`}>

              <Icon
              className={`w-3.5 h-3.5`} />

              {tab.label}
            </button>);

        })}
      </div>
    </div>
  </div>);

};

export default ProfileTabs;