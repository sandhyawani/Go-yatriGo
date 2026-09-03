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


  const sortedItems = [...groupData.items].sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const authorName =
  groupData.author?.name || groupData.author?.userName || "Traveler";
  const authorPic = getAvatarUrl(
  groupData.author?.pic || groupData.author?.userPic,
  groupData.author?.img,
  authorName
  );

  const displayItems = expanded ? sortedItems : sortedItems.slice(0, 3);
  const hasMore = sortedItems.length > 3;
  const remainingCount = sortedItems.length - 3;

  return (
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-3 sm:p-4 hover:shadow-[0_8px_30px_rgba(2,132,199,0.08)] transition-all duration-300">

      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
          src={authorPic}
          alt={authorName}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-brand-100 shadow-sm shrink-0" />

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-text-primary truncate">{authorName}</h3>
            <p className="text-[11px] text-text-muted font-medium">
              <span className="text-brand font-bold">
                {groupData.items.length}
              </span>{" "}
              memories felt by you
            </p>
          </div>
        </div>
        <button
        onClick={() => navigate(`/profile/${authorId}`)}
        className="px-3 py-1.5 bg-background/80 hover:bg-brand-50 text-text-primary hover:text-brand-dark text-[11px] font-bold rounded-lg transition-colors border border-slate-200/80 hover:border-brand-200 shrink-0">

          View Profile
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-2 sm:scrollbar-hide sm:snap-x">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item) =>
          <div key={item._id} className="w-full sm:w-auto sm:snap-start shrink-0 min-w-0">
              <CompactMemoryCard item={item} />
            </div>
          )}
          {!expanded && hasMore &&
          <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setExpanded(true)}
          className="w-full sm:w-[180px] h-[180px] sm:h-[220px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 group p-2 text-center sm:snap-start">

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-md transition-all">
                <span className="text-brand font-bold text-base sm:text-lg">
                  +{remainingCount}
                </span>
              </div>
              <span className="text-[11px] font-bold text-text-secondary group-hover:text-brand-dark transition-colors">
                View All
              </span>
            </motion.div>}

        </AnimatePresence>
      </div>
    </motion.div>);

};

const FeltVibes = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [feltVibes, setFeltVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filters = ["All", "Travel Memories", "Dispatches", "Groups"];
  const sortOptions = ["Newest", "Oldest", "Most Felt"];

  useEffect(() => {
    fetchFeltVibes();
  }, []);

  const fetchFeltVibes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/social/felt-vibes", {
        withCredentials: true
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
            item.type === "memory");

        case "Dispatches":
          return item.postType === "story";
        case "Groups":
          return item.postType === "group";


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
          totalFelt: 0
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
      ...data
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
      i.postType || i.type
      )
      ).length,
      stories: feltVibes.filter((i) => i.postType === "story").length,
      groups: feltVibes.filter((i) => i.postType === "group").length


    };
  }, [feltVibes]);

  return (
    <div className="bg-background text-text-primary min-h-[100dvh] pb-20 pt-2 md:pt-4 md:pb-24 font-sans antialiased relative z-0">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-br from-brand-100/40 via-brand-50/40 to-transparent -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-400/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2">
              <span className="text-2xl drop-shadow-sm">✨</span>
              Felt Vibes
            </h1>
            <p className="text-text-muted font-medium mt-1 text-sm">
              A curated collection of travel memories and stories that inspired
              you.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs font-bold text-text-secondary bg-white/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/50 shadow-sm w-fit">
              <div className="flex items-center gap-1">
                <span className="text-brand font-extrabold">{stats.total}</span>
                <span className="text-text-muted font-medium">Total</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-rose-500 font-extrabold">{stats.memories}</span>
                <span className="text-text-muted font-medium">Memories</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-brand-500 font-extrabold">{stats.stories}</span>
                <span className="text-text-muted font-medium">Dispatches</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1">
                <span className="text-brand font-extrabold">{stats.groups}</span>
                <span className="text-text-muted font-medium">Groups</span>
              </div>
            </div>
          </div>
          <Link
          to="/social/explore"
          className="text-xs font-bold text-white text-center bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-md shadow-brand-500/20 px-5 py-2.5 rounded-xl w-full sm:w-fit shrink-0 transition-all hover:shadow-lg hover:-translate-y-0.5">

            Explore More
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
                case "Dispatches":
                  count = stats.stories;
                  break;
                case "Groups":
                  count = stats.groups;
                  break;


                default:
                  break;
              }
              return (
                <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeFilter === filter ?
                "bg-slate-800 text-white shadow-md shadow-slate-800/20 border-transparent" :
                "bg-white/80 backdrop-blur-xl border border-slate-200 text-text-secondary hover:bg-white hover hover:shadow-sm"
                }`}>

                  {filter} ({count})
                </button>);

            })}
          </div>

          <div className="relative shrink-0 z-20">
            <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-text-primary hover transition-colors shadow-sm w-full sm:w-auto justify-between">

              <span className="flex items-center gap-1">
                <span className="text-text-muted font-medium">Sort by:</span>{" "}
                {sortBy}
              </span>
              <ChevronDown
              className={`w-4 h-4 text-text-muted transition-transform ${isSortOpen ? "rotate-180" : ""}`} />

            </button>

            <AnimatePresence>
              {isSortOpen &&
              <>
                  <div
                className="fixed inset-0 z-30"
                onClick={() => setIsSortOpen(false)} />

                  <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-surface rounded-[var(--radius-card)] shadow-xl border border-slate-100 py-2 z-40 overflow-hidden">

                    {sortOptions.map((option) =>
                  <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                  sortBy === option ?
                  "text-brand bg-brand-50/50 font-bold" :
                  "text-text-secondary hover"
                  }`}>

                        {option}
                        {sortBy === option && <Check className="w-4 h-4" />}
                      </button>
                  )}
                  </motion.div>
                </>}

            </AnimatePresence>
          </div>
        </div>

        {loading ?
        <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          </div> :
        groupedVibes.length === 0 ?
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-10">
            <div className="text-7xl mx-auto mb-6 opacity-80 drop-shadow-[0_0_30px_rgba(2,132,199,0.3)]">
              ✨
            </div>
            {feltVibes.length > 0 ?
          <>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  No {activeFilter} Yet
                </h3>
                <p className="text-text-muted max-w-md mx-auto font-medium text-base">
                  You have felt vibes in other categories.
                </p>
                <button
            onClick={() => setActiveFilter("All")}
            className="btn-primary">

                  View All
                </button>
              </> :

          <>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  No Felt Vibes Yet
                </h3>
                <p className="text-text-muted max-w-md mx-auto font-medium text-base">
                  Start exploring travel memories and react with "Felt This" to
                  build your curated collection of inspiration.
                </p>
                <button
            onClick={() => navigate("/social/explore")}
            className="btn-primary">

                  Explore Travelers
                </button>
              </>}

          </div> :

        <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {groupedVibes.map((group) =>
            <CreatorGroup
            key={group.id}
            authorId={group.id}
            groupData={group} />

            )}
            </AnimatePresence>
          </div>}

      </div>
    </div>);

};

export default FeltVibes;