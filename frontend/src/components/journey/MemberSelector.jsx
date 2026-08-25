import React, { useState, useEffect } from "react";
import { Search, Users, ShieldCheck, Check } from "lucide-react";
import axiosInstance from "../../api/axios";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/authContext";
import { resolveRelationship } from "../../utils/relationshipResolver";

const MemberSelector = ({
  selectedIds = [],
  onChange,
  excludeUserIds = []
}) => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [activeTab, setActiveTab] = useState("Mutuals");

  const getEffectiveUserId = () => {
    if (user?._id) return String(user._id);
    if (user?.id) return String(user.id);
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        return String(parsed._id || parsed.id || "");
      }
    } catch {}
    return "";
  };

  const effectiveUserId = getEffectiveUserId();
  const excludeStr = excludeUserIds.join(',');

  const fetchTravelers = () => {
    setLoading(true);
    setError(false);
    const userId = getEffectiveUserId();
    
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPromises = [
      axiosInstance.get(`/trip-mates/${userId}`).catch(err => {
        console.warn("[MemberSelector] Failed to load trip mates:", err);
        return { data: { trip_mates: [] } };
      }),
      axiosInstance.get(`/users/${userId}/followers`).catch(err => {
        console.warn("[MemberSelector] Failed to load followers:", err);
        return { data: { followers: [] } };
      }),
      axiosInstance.get(`/users/${userId}/following`).catch(err => {
        console.warn("[MemberSelector] Failed to load following:", err);
        return { data: { following: [] } };
      }),
      axiosInstance.get(`/journeys/previous-companions?userId=${userId}`).catch(err => {
        console.warn("[MemberSelector] Failed to load previous companions:", err);
        return { data: { companions: [] } };
      })
    ];

    Promise.all(fetchPromises)
      .then(([tripMatesRes, followersRes, followingRes, companionsRes]) => {
        const tripMates = tripMatesRes?.data?.trip_mates || [];
        const followers = followersRes?.data?.followers || [];
        const following = followingRes?.data?.following || [];
        const previousCompanions = companionsRes?.data?.companions || [];

        const companionMap = new Map();
        previousCompanions.forEach((c) => {
          if (c && (c._id || c.id)) {
            companionMap.set(String(c._id || c.id), c);
          }
        });

        const tripMatesMap = new Map();
        tripMates.forEach(c => {
          if (c && (c._id || c.id)) {
            tripMatesMap.set(String(c._id || c.id), c);
          }
        });

        const myIdStr = String(userId);
        const excludedSet = new Set([
          myIdStr,
          ...(excludeUserIds || []).map(id => String(id?._id || id?.id || id))
        ]);

        const followingMap = new Map();
        following.forEach(u => {
          if (u && (u._id || u.id)) {
            followingMap.set(String(u._id || u.id), u);
          }
        });

        const mutualUsers = [];
        followers.forEach(u => {
          if (u && (u._id || u.id)) {
            const uIdStr = String(u._id || u.id);
            if (followingMap.has(uIdStr) && !excludedSet.has(uIdStr)) {
              mutualUsers.push(u);
            }
          }
        });

        const uniqueMap = new Map();
        [...mutualUsers, ...tripMates].forEach((u) => {
          if (u && (u._id || u.id)) {
            const uIdStr = String(u._id || u.id);
            if (!excludedSet.has(uIdStr) && !uniqueMap.has(uIdStr)) {
              uniqueMap.set(uIdStr, {
                ...u,
                _id: uIdStr
              });
            }
          }
        });

        const currentUserObj = {
          ...user,
          _id: userId,
          following: following.map(u => String(u._id || u.id || u)),
          followers: followers.map(u => String(u._id || u.id || u)),
          followRequests: (user?.followRequests || []).map(u => String(u._id || u.id || u))
        };

        const processedUsers = Array.from(uniqueMap.values()).map(u => {
          const uId = String(u._id || u.id);
          const isTripMateBool = tripMatesMap.has(uId);
          const rel = resolveRelationship(currentUserObj, u, isTripMateBool ? "connected" : "not_connected");
          const compData = companionMap.get(uId);
          const tripsCount = typeof compData?.tripsCount === "number" ? compData.tripsCount : 0;
          const lastJourney = compData?.lastJourney || null;

          // Determine priority (1 is highest: Mutual + Trip Mate)
          let priority = 4;
          if (rel.socialState === "mutual" && rel.tripMateState === "trip_mate") priority = 1;
          else if (rel.socialState === "mutual") priority = 2;
          else if (rel.tripMateState === "trip_mate") priority = 3;

          // Dynamic badges strictly from resolved states
          const badges = [];
          if (rel.socialState === "mutual") badges.push("Mutual");
          if (rel.tripMateState === "trip_mate") badges.push("Trip Mate");

          return {
            ...u,
            _id: uId,
            socialState: rel.socialState,
            tripMateState: rel.tripMateState,
            isTripMate: rel.tripMateState === "trip_mate",
            priority,
            badges,
            tripsCount,
            lastJourney
          };
        });

        setUsersList(processedUsers);
      })
      .catch((err) => {
        console.error("Error loading travelers:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTravelers();
  }, [effectiveUserId, excludeStr]);

  const toggleUser = (userId) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const searchKw = search.toLowerCase().trim();
  
  // Filter by active tab first
  let tabList = usersList;
  if (activeTab === "Mutuals") {
    tabList = usersList.filter(u => u.socialState === "mutual");
  } else if (activeTab === "Trip Mates") {
    tabList = usersList.filter(u => u.tripMateState === "trip_mate");
  }

  // Search within the active tab's list
  let filteredList = tabList.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(searchKw)) ||
      (u.username && u.username.toLowerCase().includes(searchKw)) ||
      (u.email && u.email.toLowerCase().includes(searchKw))
  );

  // Sort by priority, then alphabetically
  filteredList.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const displayUsers = filteredList.slice(0, displayLimit);

  const tabs = [
    { id: "Mutuals", label: "Mutuals", desc: "Your mutual connections" },
    { id: "Trip Mates", label: "Trip Mates", desc: "Your travel connections" }
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                setDisplayLimit(20);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-[#7C3AED] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
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

      {}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search by name or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#7C3AED] shadow-xs"
        />
      </div>

      {}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Scanning traveler network...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-dashed border-red-200 dark:border-red-900/40">
            <ShieldCheck className="w-8 h-8 text-red-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Couldn't load travelers.
            </p>
            <button onClick={fetchTravelers} className="mt-3 text-[#7C3AED] text-xs font-bold hover:underline">
              Retry
            </button>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {activeTab === "Trip Mates" ? "No Trip Mates yet" : "No Mutuals yet"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeTab === "Trip Mates"
                ? "Add travelers to your Trip Mates to invite them here."
                : "You can invite mutual connections here."}
            </p>
          </div>
        ) : (
          <>
            {displayUsers.map((u) => {
              const isSelected = selectedIds.includes(u._id);
              const lastTripName = u.lastJourney
                ? typeof u.lastJourney === "object"
                  ? u.lastJourney.title || u.lastJourney.destination || null
                  : u.lastJourney
                : null;

              return (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                    isSelected
                      ? "bg-[#7C3AED]/10 border-[#7C3AED] dark:bg-[#7C3AED]/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#7C3AED]/40 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                    <div className="relative shrink-0">
                      <Avatar
                        user={u}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      {u.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {u.name}
                        </span>
                        {u.verified && (
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                            title="Verified Traveler"
                          />
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {u.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                              badge === "Trip Mate"
                                ? "bg-brand-50 dark:bg-brand-900/60 text-[#7C3AED] border-brand-200 dark:border-brand-800/60"
                                : badge === "Mutual"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : badge === "Requested"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : badge === "Follow Request"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      {Boolean(u.tripsCount && u.tripsCount > 0) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            {u.tripsCount} {u.tripsCount === 1 ? "Journey Together" : "Journeys Together"}
                          </span>
                          {lastTripName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-amber-100 dark:border-amber-800/50 truncate max-w-[160px]">
                              Last Trip: {lastTripName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUser(u._id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{isSelected ? "Selected" : "+ Select"}</span>
                  </button>
                </div>
              );
            })}

            {filteredList.length > displayLimit && (
              <div className="pt-2 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 20)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-200/60 dark:border-slate-700/60"
                >
                  Load More Companions ({filteredList.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemberSelector;