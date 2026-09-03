import React, { useRef, useEffect } from "react";
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
  const containerRef = useRef(null);

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
      label: isOwnProfile ? "My Trips" : "Trips",
      shortLabel: isOwnProfile ? "My Trips" : "Trips",
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
      label: "Moments",
      shortLabel: "Moments",
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
      label: "Felt This",
      shortLabel: "Felt This",
      show: true,
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.show);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(
      `[data-tab-id="${activeTab}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeTab]);

  return (
    <nav className="w-full select-none" aria-label="Profile sections">
      <div className="w-full rounded-2xl border border-border/80 bg-surface p-1 shadow-xs">
        <div
          ref={containerRef}
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none scroll-smooth p-0.5"
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-selected={isActive}
                className={`group flex min-h-[40px] sm:min-h-[42px] shrink-0 sm:flex-1 min-w-max items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-3.5 text-xs font-semibold font-sans whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-xs shadow-primary-600/20"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-dark"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-secondary-400 group-hover:text-primary-500"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />

                <span className="leading-tight text-center text-xs font-semibold whitespace-nowrap">
                  {tab.label}
                </span>

                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${
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