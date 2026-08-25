import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Eye, AlertTriangle, Users, RefreshCw, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../../utils/avatar";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const Avatar = ({ user, size = 44 }) => {
  return (
    <img
      src={getAvatarUrl(user, user.img, user.name)}
      alt={user.name || "Traveler"}
      className="rounded-full shrink-0 object-cover shadow-sm border border-slate-100"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "Explorer")}&background=7C3AED&color=fff&bold=true`;
      }}
    />
  );
};

const OverflowMenu = ({
  user,
  onClose,
  onViewProfile,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const items = [
    { icon: Eye, label: "View Profile", action: () => onViewProfile(user) },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-w-[170px]"
      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors text-left text-slate-700 hover:bg-slate-50 ${
            i !== items.length - 1 ? "border-b border-slate-100" : ""
          }`}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
};

const SkeletonRow = ({ index }) => (
  <div
    className={`flex items-center gap-3 py-3.5 px-3 ${
      index !== 4 ? "border-b border-slate-100/70" : ""
    }`}
  >
    <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ transform: "translateX(-100%)" }} />
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-3.5 bg-slate-200 rounded-md w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ transform: "translateX(-100%)", animationDelay: `${index * 80}ms` }} />
      </div>
      <div className="h-2.5 bg-slate-200/70 rounded-md w-[35%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ transform: "translateX(-100%)", animationDelay: `${index * 80 + 40}ms` }} />
      </div>
    </div>
    <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ transform: "translateX(-100%)" }} />
    </div>
  </div>
);

const TripMateRow = ({
  user,
  isLast,
  isSelf,
  onViewProfile,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`group flex items-center gap-3 py-3.5 px-3 rounded-lg transition-colors duration-150 hover:bg-[#7C3AED]/[0.04] relative cursor-pointer ${
        !isLast ? "border-b border-slate-100/70" : ""
      }`}
      onClick={() => onViewProfile(user)}
    >
      <Avatar user={user} size={48} />

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-slate-900 truncate leading-tight flex items-center gap-1.5">
          <span className="truncate">{user.name || "Explorer"}</span>
          {isSelf && (
            <span className="text-slate-400 font-semibold text-[9px] sm:text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
              You
            </span>
          )}
        </p>
        
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11.5px] text-slate-500 font-medium truncate">
            @{user.username || "explorer"}
          </p>
        </div>

        {!isSelf && (
          <div className="mt-2">
            {user.sharedJourney && (
              <div className="flex flex-col">
                <p className="text-[11.5px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="shrink-0 text-[13px]">🏔️</span>
                  <span className="truncate max-w-[170px]" title={user.sharedJourney.name}>
                    {user.sharedJourney.name}
                  </span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center ml-[22px] mt-0.5">
                  {user.sharedJourney.startDate && user.sharedJourney.endDate ? (
                    <span>
                      {new Date(user.sharedJourney.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      –
                      {new Date(user.sharedJourney.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : null}
                  {user.sharedJourney.startDate && user.sharedJourney.endDate && <span className="mx-1.5">•</span>}
                  <span className="capitalize">{user.sharedJourney.status?.toLowerCase()}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isSelf && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={`More options for ${user.name}`}
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <OverflowMenu
                user={user}
                onClose={() => setMenuOpen(false)}
                onViewProfile={onViewProfile}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const TripMatesModal = ({
  showRelationsModal,
  setShowRelationsModal,
  relationsModalType,
  relationsSearch,
  setRelationsSearch,
  relationsLoading,
  relationsList,
  currentUser,
  profileUser,
  isOwnProfile: isOwnProfileProp,
  openRelationsModal,
  relationsError,
}) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const listRef = useRef(null);

  const currentUserId = currentUser?._id || currentUser?.id;
  const profileUserId = profileUser?._id || profileUser?.id;
  const isOwnProfile =
    isOwnProfileProp !== undefined
      ? isOwnProfileProp
      : Boolean(
          currentUserId &&
          profileUserId &&
          String(currentUserId) === String(profileUserId)
        );

  const debouncedSearch = useDebounce(searchInput, 300);

  const rawList = useMemo(() => {
    let list = relationsList || [];
    return [...list].sort((a, b) => {
      const aId = a._id || a.id;
      const bId = b._id || b.id;
      const isSelfA = currentUserId && String(aId) === String(currentUserId);
      const isSelfB = currentUserId && String(bId) === String(currentUserId);
      
      if (isSelfA && !isSelfB) return -1;
      if (!isSelfA && isSelfB) return 1;

      const nameA = (a.name || "Explorer").toLowerCase();
      const nameB = (b.name || "Explorer").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [relationsList, currentUserId]);

  const sortedList = useMemo(() => {
    if (!debouncedSearch.trim()) return rawList;
    const q = debouncedSearch.toLowerCase();
    return rawList.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
    );
  }, [rawList, debouncedSearch]);

  const closeModal = useCallback(() => {
    setShowRelationsModal(false);
    setTimeout(() => {
      setSearchInput("");
      setRelationsSearch("");
    }, 200);
  }, [setShowRelationsModal, setRelationsSearch]);

  const handleViewProfile = (user) => {
    closeModal();
    navigate(`/profile/${user._id || user.id}`);
  };

  const handleRetry = () => {
    if (openRelationsModal) {
      openRelationsModal("trip_mates");
    }
  };

  const isLoading = relationsLoading;
  const isError = !!relationsError && !isLoading;
  const isEmpty = !isLoading && !isError && rawList.length === 0;
  const isSearchNoResults =
    !isLoading && !isError && !isEmpty && debouncedSearch.trim() && sortedList.length === 0;
  const isDefault = !isLoading && !isError && !isEmpty && sortedList.length > 0;

  return (
    <AnimatePresence>
      {showRelationsModal && relationsModalType === "trip_mates" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={closeModal}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="bg-white rounded-t-[20px] sm:rounded-2xl w-full sm:max-w-[520px] shadow-2xl relative z-10 flex flex-col h-[460px] max-h-[88vh] overflow-hidden"
          >
            <div className="flex justify-between items-start px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}>
                  Trip Mates
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isOwnProfile
                    ? "Your travel companions"
                    : `Travel companions of ${profileUser?.name || profileUser?.username || "this traveler"}`}
                </p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="p-2 -mr-2 -mt-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/40 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search trip mates..."
                  aria-label="Search trip mates"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 text-sm font-medium outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 bg-white custom-scrollbar pb-16">
              {isLoading && (
                <div className="py-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} index={i} />
                  ))}
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 text-center">
                    Couldn't load trip mates.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Something went wrong. Please try again.
                  </p>
                  <button
                    onClick={handleRetry}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {isEmpty && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 text-center">
                    {isOwnProfile
                      ? "You have no trip mates yet."
                      : `${profileUser?.name || "This traveler"} has no trip mates yet.`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Connect with others to add them to your Trip Mates!
                  </p>
                </div>
              )}

              {isSearchNoResults && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 text-center">
                    No trip mates found for '{debouncedSearch}'
                  </p>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Try adjusting your search query.
                  </p>
                </div>
              )}

              {isDefault && (
                <div className="py-1">
                  {sortedList.map((user, idx) => {
                    const isSelf = Boolean(
                      currentUserId &&
                      (user._id || user.id) &&
                      String(currentUserId) === String(user._id || user.id)
                    );
                    return (
                      <TripMateRow
                        key={user._id || user.id || idx}
                        user={user}
                        isLast={idx === sortedList.length - 1}
                        isSelf={isSelf}
                        onViewProfile={handleViewProfile}
                      />
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TripMatesModal;

