import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ChevronRight, MapPin, Calendar } from "lucide-react";
import moment from "moment";
import Avatar from "../../../common/Avatar";
import { useSidebar } from "../SidebarProvider";
import axios from "../../../../api/axios";

const SearchPanel = () => {
  const { isSearchOpen, setIsSearchOpen } = useSidebar();
  const navigate = useNavigate();
  const panelRef = React.useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTab, setSearchTab] = useState("all");

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest(".search-btn")
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setIsSearchOpen]);

  // Reset on close
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults(null);
      setSearchTab("all");
    }
  }, [isSearchOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(
          `/social/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { withCredentials: true }
        );
        if (res.data) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isSearchOpen) return null;

  const filteredResults = searchResults
    ? {
        travelers:
          searchTab === "all" || searchTab === "travelers"
            ? searchResults.travelers || []
            : [],
        trips:
          searchTab === "all" || searchTab === "groups"
            ? searchResults.trips || []
            : [],
        memories:
          searchTab === "all" || searchTab === "posts"
            ? searchResults.memories || []
            : [],
      }
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="search-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsSearchOpen(false)}
        className="fixed inset-0 z-[1000] bg-brand/20 backdrop-blur-[2px]"
      />

      <motion.div
        ref={panelRef}
        key="search-panel"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 z-[1002] w-full sm:w-[420px] lg:w-[460px] max-w-full flex flex-col bg-white shadow-2xl border-l border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2 font-heading">
            <Search className="w-4 h-4 text-brand-500" /> Search
          </h3>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-lg bg-background text-text-muted hover:text-text-primary hover transition-colors font-sans"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 py-3 border-b border-slate-50 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, trips, destinations..."
              className="input-field !pl-10 !pr-12"
              autoFocus
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted hover:text-text-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0 select-none">
          {["all", "travelers", "groups", "posts"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSearchTab(tab)}
              className={`tab-pill shrink-0 capitalize ${
                searchTab === tab ? "tab-pill-active" : "tab-pill-inactive"
              }`}
            >
              {tab === "posts" ? "Travel Memories" : tab}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 p-4">
          {searchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse border border-slate-100/50"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-2 bg-background rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !searchQuery ? (
            <div className="text-center py-10 text-text-muted">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Start exploring</p>
              <p className="text-xs text-text-muted mt-1">
                Search destinations, travelers, or groups
              </p>
            </div>
          ) : filteredResults ? (
            <div className="space-y-4">
              {/* Travelers */}
              {filteredResults.travelers?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">
                    Travelers
                  </span>
                  {filteredResults.travelers.map((traveler) => (
                    <div
                      key={traveler._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/profile/${traveler._id}`);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover transition-colors cursor-pointer group"
                    >
                      <Avatar
                        user={traveler}
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-text-primary truncate">
                          {traveler.name}
                        </h4>
                        {(traveler.city || traveler.state) && (
                          <div className="flex items-center gap-1 mt-0.5 text-text-muted">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="text-[10px] truncate">
                              {traveler.city && traveler.state
                                ? `${traveler.city}, ${traveler.state}`
                                : traveler.city || traveler.state}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Trips */}
              {filteredResults.trips?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">
                    Active Trips
                  </span>
                  {filteredResults.trips.map((trip) => (
                    <div
                      key={trip._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/social/buddy/${trip._id}`);
                      }}
                      className="flex flex-col gap-2.5 p-3 rounded-xl hover border border-slate-100/50 hover:border-brand-500/15 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px] shrink-0 border border-emerald-100">
                            {trip.destination
                              ? trip.destination.substring(0, 2).toUpperCase()
                              : "TR"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                              {trip.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {trip.destination}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            trip.status === "open"
                              ? "bg-emerald-50 text-emerald-600"
                              : trip.status === "full"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-background text-text-muted"
                          }`}
                        >
                          {trip.status || "open"}
                        </span>
                      </div>
                      {(trip.startDate || trip.endDate) && (
                        <div className="flex items-center gap-1 text-[10px] text-text-muted border-t border-slate-100/60 pt-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {moment(trip.startDate).format("MMM D")} -{" "}
                            {moment(trip.endDate).format("MMM D, YYYY")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Travel Memories */}
              {filteredResults.memories?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">
                    Travel Memories
                  </span>
                  {filteredResults.memories.map((memory) => (
                    <div
                      key={memory._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(
                          `/profile/${
                            memory.userId?._id || memory.userId
                          }?postId=${memory._id}`,
                          { state: { selectedMemory: memory } }
                        );
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover border border-transparent hover:border-brand-500/15 transition-all cursor-pointer group"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-background flex items-center justify-center">
                        {memory.image ||
                        memory.mediaUrl ||
                        memory.mediaUrls?.[0] ? (
                          <img
                            src={
                              memory.image ||
                              memory.mediaUrl ||
                              memory.mediaUrls?.[0]
                            }
                            alt={memory.title || "Memory thumbnail"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <MapPin className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-text-primary truncate group-hover:text-brand transition-colors">
                          {memory.title ||
                            (memory.caption
                              ? memory.caption.substring(0, 30) + "..."
                              : "Travel Memory")}
                        </h4>
                        <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <span>by</span>
                          <span className="font-semibold text-text-muted truncate">
                            {memory.userId?.name ||
                              memory.userName ||
                              "Traveler"}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {filteredResults.travelers?.length === 0 &&
                filteredResults.trips?.length === 0 &&
                filteredResults.memories?.length === 0 && (
                  <div className="text-center py-10 text-text-muted">
                    <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs text-text-muted mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchPanel;
