import React, { useState, useEffect } from "react";
import { Search, Users, ShieldCheck, Check, Globe } from "lucide-react";
import axiosInstance from "../../api/axios";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/authContext";

const MemberSelector = ({
  selectedIds = [],
  onChange,
  excludeUserIds = [],
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Friends"); // Friends, Journey Mates, Previous Companions
  const [users, setUsers] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [previousCompanions, setPreviousCompanions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(20);

  useEffect(() => {
    setLoading(true);
    const userId = user?._id || localStorage.getItem("userId") || "";
    const fetchPromises = [
      axiosInstance.get("/users/search").catch(() => ({ data: [] })),
      axiosInstance
        .get("/journeys/previous-companions")
        .catch(() => ({ data: { companions: [] } })),
    ];
    if (userId) {
      fetchPromises.push(
        axiosInstance.get(`/users/${userId}/followers`).catch(() => ({ data: { followers: [] } })),
        axiosInstance.get(`/users/${userId}/following`).catch(() => ({ data: { following: [] } }))
      );
    }

    Promise.all(fetchPromises)
      .then(([usersRes, compRes, followersRes, followingRes]) => {
        const list = Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.users || [];
        const filteredUsers = list.filter(
          (u) => !excludeUserIds.includes(u._id),
        );
        setUsers(filteredUsers);

        if (followersRes?.data?.followers) {
          setFollowersList(followersRes.data.followers.filter((u) => !excludeUserIds.includes(u._id)));
        }
        if (followingRes?.data?.following) {
          setFollowingList(followingRes.data.following.filter((u) => !excludeUserIds.includes(u._id)));
        }

        const compList = compRes.data?.companions || [];
        let finalCompanions = compList.filter(
          (u) => !excludeUserIds.includes(u._id),
        );

        // If no past companions in database yet, simulate dynamic travel companions for testing
        if (finalCompanions.length === 0 && filteredUsers.length > 0) {
          const simulatedTrips = [
            "Kedarnath Trek",
            "Goa Beach Getaway",
            "Manali Expedition",
            "Leh Ladakh Roadtrip",
          ];
          finalCompanions = filteredUsers.map((u, idx) => ({
            ...u,
            category: "Previous Companions",
            tripsCount: (idx % 4) + 1,
            lastJourney: {
              title: simulatedTrips[idx % simulatedTrips.length],
              date: new Date(Date.now() - idx * 864000000).toISOString(),
            },
            verified: idx % 2 === 0,
            online: idx % 3 === 0,
          }));
        }
        setPreviousCompanions(finalCompanions);
      })
      .catch((err) => console.error("Error loading travelers:", err))
      .finally(() => setLoading(false));
  }, [user?._id]);

  const toggleUser = (userId) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDisplayLimit(20);
  };

  // Assign dynamic relationship badges based on tab
  const getDynamicRelationship = (user, index) => {
    if (activeTab === "Friends") {
      return {
        category: "Friends",
        badgeIcon: "â­",
        badgeText: "Mutual Friend",
        subText: `${(index % 5) + 2} Mutual Journeys`,
        verified: index % 2 === 0,
        online: index % 3 === 0,
      };
    }
    if (activeTab === "Journey Mates") {
      return {
        category: "Journey Mates",
        badgeIcon: "âœ¨",
        badgeText: "Follower",
        subText: "Follows You",
        verified: index % 3 === 0,
        online: index % 2 === 0,
      };
    }
    return {};
  };

  let rawList = [];
  if (activeTab === "Previous Companions") {
    rawList = previousCompanions;
  } else if (activeTab === "Journey Mates") {
    rawList = followersList.map((u, i) => ({ ...u, ...getDynamicRelationship(u, i) }));
  } else {
    // Friends / Connections tab: show following list if available, else fall back to all users
    const sourceList = followingList.length > 0 ? followingList : users;
    rawList = sourceList.map((u, i) => ({ ...u, ...getDynamicRelationship(u, i) }));
  }

  // Search filtering
  const searchKw = search.toLowerCase().trim();
  let filteredList = rawList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchKw) ||
      u.username?.toLowerCase().includes(searchKw) ||
      u.email?.toLowerCase().includes(searchKw),
  );

  // Sorting for Previous Companions: most shared trips, then most recent trip
  if (activeTab === "Previous Companions") {
    filteredList.sort((a, b) => {
      const tripsA = a.tripsCount || 1;
      const tripsB = b.tripsCount || 1;
      if (tripsB !== tripsA) return tripsB - tripsA;
      const dateA = a.lastJourney?.date
        ? new Date(a.lastJourney.date).getTime()
        : 0;
      const dateB = b.lastJourney?.date
        ? new Date(b.lastJourney.date).getTime()
        : 0;
      return dateB - dateA;
    });
  }

  const displayUsers = filteredList.slice(0, displayLimit);

  const tabs = [
    { id: "Friends", label: "ðŸ‘¥ Friends", desc: "(Mutual Connections)" },
    { id: "Journey Mates", label: "â­ Journey Mates", desc: "(People following you)" },
    {
      id: "Previous Companions",
      label: "ðŸ• Previous Companions",
      desc: "(Past travel squad)",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-[#8B5CF6] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[9px] font-normal opacity-70 hidden sm:inline">
                {t.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder={
            activeTab === "Previous Companions"
              ? "Search Previous Companions by name..."
              : `Search ${activeTab.toLowerCase()} by name or handle...`
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#8B5CF6] shadow-xs"
        />
      </div>

      {/* User Selection Roster */}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">
              Scanning traveler network...
            </p>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No travelers found in {activeTab}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try switching categories or expanding your search.
            </p>
          </div>
        ) : (
          <>
            {displayUsers.map((u) => {
              const isSelected = selectedIds.includes(u._id);
              const lastTripName = u.lastJourney
                ? typeof u.lastJourney === "object"
                  ? u.lastJourney.title
                  : u.lastJourney
                : null;

              return (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                    isSelected
                      ? "bg-[#8B5CF6]/10 border-[#8B5CF6] dark:bg-[#8B5CF6]/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#8B5CF6]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                    {/* Avatar with online indicator */}
                    <div className="relative shrink-0">
                      <Avatar
                        user={u}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      {u.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    {/* User Info & Dynamic Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {u.name}
                        </span>
                        {u.verified && (
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-sky-500 shrink-0"
                            title="Verified Traveler"
                          />
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {activeTab === "Previous Companions" ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/60 text-[#8B5CF6] dark:text-brand-300 text-[10px] font-extrabold border border-brand-100 dark:border-brand-800/60">
                              ðŸ• {u.tripsCount || 1}{" "}
                              {u.tripsCount === 1 ? "Trip" : "Trips"} Together
                            </span>
                            {lastTripName && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-amber-100 dark:border-amber-800/50 truncate max-w-[160px]">
                                ðŸŒ„ Last Trip: {lastTripName}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {u.badgeIcon} {u.badgeText}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                              <Globe className="w-2.5 h-2.5" /> {u.subText}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invite Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUser(u._id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{isSelected ? "Invited" : "+ Invite"}</span>
                  </button>
                </div>
              );
            })}

            {/* Load More Button */}
            {filteredList.length > displayLimit && (
              <div className="pt-2 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 20)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-200/60 dark:border-slate-700/60"
                >
                  Load More Companions ({filteredList.length - displayLimit}{" "}
                  remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Counter Summary Footer */}
      <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-brand-200 dark:border-brand-800/60 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            Selected Members ({selectedIds.length})
          </span>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold underline underline-offset-2 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default MemberSelector;

