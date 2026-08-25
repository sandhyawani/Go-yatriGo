import React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ChevronRight, MapPin, Calendar } from "lucide-react";
import moment from "moment";
import Avatar from "../common/Avatar";

export const SidebarSearch = ({
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  searchTab,
  setSearchTab
}) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isSearchOpen &&
      <motion.div
      key="search-drawer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setIsSearchOpen(false)}
      className="fixed inset-0 z-[1000] bg-slate-900/20 backdrop-blur-[2px]" />}


      {isSearchOpen &&
      <motion.div
      key="search-drawer-content"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 z-[1001] w-full lg:w-[380px] lg:max-w-sm bg-white lg:border-l lg:border-slate-100 shadow-2xl flex flex-col">

          {}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-500" /> Search
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                TRAVELERS · TRIPS · MEMORIES
              </p>
            </div>
            <button
          onClick={() => setIsSearchOpen(false)}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">

              <X className="w-4 h-4" />
            </button>
          </div>

          {}
          <div className="px-5 py-3 border-b border-slate-50 shrink-0">
            <div className="relative">
              <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, trips, destinations..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-brand-500/50 focus:bg-white focus:shadow-[0_2px_8px_rgba(108,77,246,0.08)] transition-all"
            autoFocus />

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              {searchQuery &&
            <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600">

                  Clear
                </button>}

            </div>
          </div>

          {}
          <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-50 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
            {["all", "travelers", "groups", "posts"].map((tab) =>
          <button
          key={tab}
          onClick={() => setSearchTab(tab)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${
          searchTab === tab ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}>

                {tab === "posts" ? "Travel Memories" : tab}
              </button>
          )}
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {searchLoading ?
          <div className="space-y-4">
                {[1, 2, 3, 4].map((i) =>
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse border border-slate-100/50">
                    <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-2 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
            )}
              </div> :
          !searchQuery ?
          <div className="text-center py-14 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start exploring</p>
                <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-relaxed text-center">
                  Search destinations, travelers, or groups
                </p>
              </div> :
          searchResults ?
          <div className="space-y-5">
                {(searchTab === "all" || searchTab === "travelers") && searchResults.travelers?.length > 0 &&
            <div className="space-y-2">
                    {searchTab === "all" && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Travelers</span>}
                    {searchResults.travelers.map((traveler) =>
              <div
              key={traveler._id}
              onClick={() => {
                setIsSearchOpen(false);
                navigate(`/profile/${traveler._id}`);
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-brand-500/10 hover:shadow-xs transition-all cursor-pointer group">

                        <Avatar user={traveler} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-bold text-slate-800 truncate flex items-center gap-1">{traveler.name}</h4>
                          {(traveler.city || traveler.state) &&
                  <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-[10px] truncate">
                                {traveler.city && traveler.state ? `${traveler.city}, ${traveler.state}` : traveler.city || traveler.state}
                              </span>
                            </div>}

                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                      </div>
              )}
                  </div>}


                {(searchTab === "all" || searchTab === "groups") && searchResults.trips?.length > 0 &&
            <div className="space-y-2">
                    {searchTab === "all" && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Trips</span>}
                    {searchResults.trips.map((trip) =>
              <div
              key={trip._id}
              onClick={() => {
                setIsSearchOpen(false);
                navigate(`/social/buddy/${trip._id}`);
              }}
              className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-100/50 hover:border-brand-500/15 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group">

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px] shrink-0 border border-emerald-100">
                              {trip.destination ? trip.destination.substring(0, 2).toUpperCase() : "TR"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">{trip.title}</h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{trip.destination}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  trip.status === "open" ? "bg-emerald-50 text-emerald-650" :
                  trip.status === "full" ? "bg-amber-50 text-amber-650" :
                  trip.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                  "bg-rose-50 text-rose-650"
                  }`}>
                            {trip.status || "open"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100/60 pt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {moment(trip.startDate).format("MMM D")} - {moment(trip.endDate).format("MMM D, YYYY")}
                            </span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                            {trip.category}
                          </span>
                        </div>
                      </div>
              )}
                  </div>}


                {(searchTab === "all" || searchTab === "posts") && searchResults.memories?.length > 0 &&
            <div className="space-y-2">
                    {searchTab === "all" && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Memories</span>}
                    {searchResults.memories.map((memory) =>
              <div
              key={memory._id}
              onClick={() => {
                setIsSearchOpen(false);
                navigate(`/profile/${memory.userId?._id || memory.userId}?postId=${memory._id}`, {
                  state: { selectedMemory: memory }
                });
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-brand-500/15 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group">

                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-100 flex items-center justify-center">
                          {memory.image || memory.mediaUrl || memory.mediaUrls?.[0] ?
                  <img
                  src={memory.image || memory.mediaUrl || memory.mediaUrls?.[0]}
                  alt={memory.title || "Memory thumbnail"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> :


                  <MapPin className="w-5 h-5 text-slate-300" />}

                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                            {memory.title || (memory.caption ? memory.caption.substring(0, 30) + "..." : "Travel Memory")}
                          </h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>by</span>
                            <span className="font-semibold text-slate-500 truncate">
                              {memory.userId?.name || memory.userName || "Traveler"}
                            </span>
                          </p>
                          {memory.location &&
                  <div className="flex items-center gap-0.5 mt-0.5 text-slate-400 text-[9px]">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{memory.location}</span>
                            </div>}

                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                      </div>
              )}
                  </div>}

              </div> :
          null}
          </div>
        </motion.div>}

    </AnimatePresence>);

};
export default SidebarSearch;