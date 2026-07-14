import React from "react";
import { Grid, Activity, Star, Compass, Globe, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

export const ProfileTabs = ({ activeTab, setActiveTab, isOwnProfile }) => {
  const tabs = [
    { id: "posts", icon: Grid, label: "Travel Memories", show: true },
    {
      id: "stories",
      icon: Activity,
      label: "Stories",
      show: isOwnProfile,
    },
    { id: "felt", icon: Star, label: "Felt Vibes", show: true },
    { id: "trips", icon: Compass, label: "Groups", show: true },
    {
      id: "journeys",
      icon: Globe,
      label: "Journeys",
      show: true,
    },
    {
      id: "saved",
      icon: Bookmark,
      label: "Saved",
      show: isOwnProfile,
    },
  ].filter((t) => t.show);

  return (
    <div className="w-full flex justify-start sm:justify-center overflow-x-auto scrollbar-none py-1">
      <div className="inline-flex gap-1 p-1 sm:p-1.5 bg-slate-100/80 rounded-2xl relative select-none border border-slate-200/50 shadow-inner mx-auto shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-2 px-2.5 sm:py-2.5 sm:px-5 flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs font-bold tracking-wide transition-colors rounded-xl z-10 ${
                isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeProfileTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                className={`w-4 h-4 transition-colors ${isActive ? "text-primary-600" : ""}`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabs;

