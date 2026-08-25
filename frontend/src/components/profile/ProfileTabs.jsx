import React from "react";
import {
  Grid3X3,
  Users,
  Compass,
  Bookmark,
  Sparkles,
  Clapperboard,
} from "lucide-react";

export const ProfileTabs = ({
  activeTab,
  setActiveTab,
  isOwnProfile = false,
  memoriesCount = 0,
  tripsCount,
  savedCount,
}) => {
  const allTabs = [
    {
      id: "posts",
      icon: Grid3X3,
      label: "Memories",
      shortLabel: "Memories",
      count: memoriesCount,
      show: true,
    },
    {
      id: "trips",
      icon: Users,
      label: "Trips",
      shortLabel: "Trips",
      count: tripsCount,
      show: true,
    },
    {
      id: "journeys",
      icon: Compass,
      label: "Journeys",
      shortLabel: "Journeys",
      show: true,
    },
    {
      id: "stories",
      icon: Clapperboard,
      label: "Stories",
      shortLabel: "Stories",
      show: Boolean(isOwnProfile),
    },
    {
      id: "saved",
      icon: Bookmark,
      label: "Saved",
      shortLabel: "Saved",
      count: savedCount,
      show: Boolean(isOwnProfile),
    },
    {
      id: "felt",
      icon: Sparkles,
      label: "Felt",
      shortLabel: "Felt",
      show: true,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  return (
    <nav className="w-full select-none" aria-label="Profile sections">
      <div className="w-full rounded-2xl border border-border/80 bg-surface p-1 shadow-xs">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-selected={isActive}
                className={`group flex min-h-[40px] sm:min-h-[42px] items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 text-[11px] sm:text-xs font-semibold font-sans transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-xs shadow-primary-600/20"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-dark"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-secondary-400 group-hover:text-primary-500"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />

                <span className="truncate">{tab.label}</span>

                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`hidden sm:inline-flex shrink-0 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold leading-none ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-secondary-100 text-secondary-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default ProfileTabs;