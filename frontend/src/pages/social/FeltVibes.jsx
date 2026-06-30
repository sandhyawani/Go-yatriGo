import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import { Loader2, ChevronDown, Check } from "lucide-react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import CompactMemoryCard from "../../components/social/CompactMemoryCard";
import { AnimatePresence, motion } from "framer-motion";
import { getAvatarUrl } from "../../utils/avatar";

const CreatorGroup = ({ authorId, groupData }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Sort items within group (newest first by default)
  const sortedItems = [...groupData.items].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const authorName =
    groupData.author?.name || groupData.author?.userName || "Traveler";
  const authorPic = getAvatarUrl(
    groupData.author?.pic || groupData.author?.userPic,
    groupData.author?.img,
    authorName,
  );

  const displayItems = expanded ? sortedItems : sortedItems.slice(0, 3);
  const hasMore = sortedItems.length > 3;
  const remainingCount = sortedItems.length - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-xl rounded-[1.75rem] sm:rounded-[2rem] border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-3.5 sm:p-5 hover:shadow-[0_12px_40px_rgba(124,58,237,0.08)] transition-all duration-300"
    >
      {/* Creator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img
            src={authorPic}
            alt={authorName}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-purple-100 shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold text-slate-900 truncate">{authorName}</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              <span className="text-purple-600 font-bold">
                {groupData.items.length}
              </span>{" "}
              memories inspired you
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/profile/${authorId}`)}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-100/80 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs sm:text-sm font-bold rounded-xl transition-colors border border-slate-200/80 hover:border-purple-200 w-full sm:w-fit text-center shrink-0"
        >
          View Profile
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2 sm:scrollbar-hide sm:snap-x">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) => (
            <div key={item._id} className="w-full sm:w-auto sm:snap-start shrink-0 min-w-0">
              <CompactMemoryCard item={item} />
            </div>
          ))}
          {!expanded && hasMore && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setExpanded(true)}
              className="w-full sm:w-[200px] h-[210px] sm:h-[260px] rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 group p-2 text-center sm:snap-start"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                <span className="text-purple-600 font-bold text-lg sm:text-xl">
                  +{remainingCount}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-600 group-hover:text-purple-700 transition-colors">
                View All Memories
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const FeltVibes = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [feltVibes, setFeltVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filters = ["All", "Travel Memories", "Stories", "Groups"]; // Future categories like "Documents" or "Profile Updates" can be added here
  const sortOptions = ["Newest", "Oldest", "Most Felt"];

  useEffect(() => {
    fetchFeltVibes();
  }, []);

  const fetchFeltVibes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/social/felt-vibes", {
        withCredentials: true,
      });
      if (res.data.success) {
        setFeltVibes(res.data.feltVibes || []);
      }
    } catch (err) {
      showToast.error("Failed to load felt vibes");
    } finally {
      setLoading(false);
    }
  };

  const filteredVibes = useMemo(() => {
    if (activeFilter === "All") return feltVibes;
    return feltVibes.filter((item) => {
      switch (activeFilter) {
        case "Travel Memories":
          return (
            item.postType === "travel_memory" ||
            item.postType === "travel_photo" ||
            item.postType === "travel_video" ||
            item.type === "memory"
          );
        case "Stories":
          return item.postType === "story";
        case "Groups":
          return item.postType === "group";
        // case "Documents": return item.postType === "document"; // Placeholder for future categories
        // case "Profile Updates": return item.postType === "profile_update"; // Placeholder for future categories
        default:
          return true;
      }
    });
  }, [feltVibes, activeFilter]);

  const groupedVibes = useMemo(() => {
    const groups = {};
    filteredVibes.forEach((item) => {
      const authorId = item.author?._id || "unknown";
      if (!groups[authorId]) {
        groups[authorId] = {
          author: item.author,
          items: [],
          latestDate: new Date(0),
          totalFelt: 0,
        };
      }
      groups[authorId].items.push(item);
      const itemDate = new Date(item.createdAt || 0);
      if (itemDate > groups[authorId].latestDate) {
        groups[authorId].latestDate = itemDate;
      }
      groups[authorId].totalFelt += item.likesCount || 0;
    });

    const groupsArray = Object.entries(groups).map(([id, data]) => ({
      id,
      ...data,
    }));

    return groupsArray.sort((a, b) => {
      if (sortBy === "Newest") return b.latestDate - a.latestDate;
      if (sortBy === "Oldest") return a.latestDate - b.latestDate;
      if (sortBy === "Most Felt") return b.totalFelt - a.totalFelt;
      return 0;
    });
  }, [filteredVibes, sortBy]);

  const stats = useMemo(() => {
    return {
      total: feltVibes.length,
      memories: feltVibes.filter((i) =>
        ["travel_memory", "travel_photo", "travel_video", "memory"].includes(
          i.postType || i.type,
        ),
      ).length,
      stories: feltVibes.filter((i) => i.postType === "story").length,
      groups: feltVibes.filter((i) => i.postType === "group").length,
      // documents: feltVibes.filter(i => i.postType === "document").length, // Placeholder
      // profileUpdates: feltVibes.filter(i => i.postType === "profile_update").length, // Placeholder
    };
  }, [feltVibes]);

  return (
    <div className="bg-[#FAFAFA] text-[#111827] min-h-[100dvh] pb-20 pt-2 md:pt-4 md:pb-24 font-sans antialiased relative z-0">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-br from-purple-100/40 via-violet-50/40 to-transparent -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-400/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="text-4xl drop-shadow-sm">✨</span>
              Felt Vibes
            </h1>
            <p className="text-slate-500 font-medium mt-2 text-base">
              A curated collection of travel memories and stories that inspired
              you.
            </p>

            {/* Top Statistics */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-y-2 mt-4 text-xs font-bold text-slate-600 bg-white/60 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/50 shadow-sm w-full sm:w-fit">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 sm:bg-transparent rounded-xl">
                <span className="text-purple-600 text-sm font-extrabold">{stats.total}</span>
                <span>Total Vibes</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 sm:bg-transparent rounded-xl">
                <span className="text-rose-500 text-sm font-extrabold">{stats.memories}</span>
                <span>Memories</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 sm:bg-transparent rounded-xl">
                <span className="text-purple-500 text-sm font-extrabold">{stats.stories}</span>
                <span>Stories</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 sm:bg-transparent rounded-xl">
                <span className="text-blue-500 text-sm font-extrabold">{stats.groups}</span>
                <span>Groups</span>
              </div>
            </div>
          </div>
          <Link
            to="/social/explore"
            className="text-sm font-bold text-white text-center bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-md shadow-purple-500/20 px-6 py-3.5 rounded-xl w-full sm:w-fit shrink-0 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            Explore More
          </Link>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-1">
            {filters.map((filter) => {
              let count = 0;
              switch (filter) {
                case "All":
                  count = stats.total;
                  break;
                case "Travel Memories":
                  count = stats.memories;
                  break;
                case "Stories":
                  count = stats.stories;
                  break;
                case "Groups":
                  count = stats.groups;
                  break;
                // case "Documents": count = stats.documents; break; // Placeholder
                // case "Profile Updates": count = stats.profileUpdates; break; // Placeholder
                default:
                  break;
              }
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeFilter === filter
                      ? "bg-slate-800 text-white shadow-md shadow-slate-800/20 border-transparent"
                      : "bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>

          {/* Sorting Dropdown */}
          <div className="relative shrink-0 z-20">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto justify-between"
            >
              <span className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Sort by:</span>{" "}
                {sortBy}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSortOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 overflow-hidden"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                          sortBy === option
                            ? "text-purple-600 bg-purple-50/50 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option}
                        {sortBy === option && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          </div>
        ) : groupedVibes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-10">
            <div className="text-7xl mx-auto mb-6 opacity-80 drop-shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              ✨
            </div>
            {feltVibes.length > 0 ? (
              <>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  No {activeFilter} Yet
                </h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium text-base">
                  You have felt vibes in other categories.
                </p>
                <button
                  onClick={() => setActiveFilter("All")}
                  className="mt-8 inline-flex items-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  View All
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  No Felt Vibes Yet
                </h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium text-base">
                  Start exploring travel memories and react with "Felt This" to
                  build your curated collection of inspiration.
                </p>
                <button
                  onClick={() => navigate("/social/explore")}
                  className="mt-8 inline-flex items-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Explore Travelers
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {groupedVibes.map((group) => (
                <CreatorGroup
                  key={group.id}
                  authorId={group.id}
                  groupData={group}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeltVibes;
