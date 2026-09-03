import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, MoreHorizontal, Eye, UserMinus, AlertTriangle, RefreshCw, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "../modals/ConfirmModal";
import { showToast } from "../../utils/showToast";
import { getAvatarUrl } from "../../utils/avatar";
import { resolveRelationship } from "../../utils/relationshipResolver";
import { chatService } from "../../services/chatService";

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
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name || "Explorer"
        )}&background=0284c7&color=fff&bold=true`;
      }}
    />
  );
};

const OverflowMenu = ({
  user,
  isOwnProfile,
  onClose,
  onViewProfile,
  onUnfollow,
  onFollowToggle,
  socialRel,
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

  if (isOwnProfile) {
    items.push({
      icon: UserMinus,
      label: "Unfollow",
      action: () => onUnfollow(user),
      danger: true,
    });
  } else if (onFollowToggle && socialRel) {
    if (socialRel.socialState === "following" || socialRel.socialState === "mutual") {
      items.push({
        icon: UserMinus,
        label: "Unfollow",
        action: () => onFollowToggle(user),
        danger: true,
      });
    } else if (socialRel.socialState === "requested") {
      items.push({
        icon: UserMinus,
        label: "Cancel Request",
        action: () => onFollowToggle(user),
      });
    } else if (socialRel.socialState !== "self" && socialRel.socialState !== "incoming_request") {
      items.push({
        icon: UserCheck,
        label: "Follow",
        action: () => onFollowToggle(user),
      });
    }
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute right-0 top-full mt-1.5 z-50 bg-surface rounded-[var(--radius-card)] border border-slate-200 shadow-xl overflow-hidden min-w-[170px]"
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
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors text-left ${
            item.danger
              ? "text-red-600 hover:bg-red-50"
              : "text-text-primary hover"
          } ${i !== items.length - 1 ? "border-b border-slate-100" : ""}`}
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
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
        style={{ transform: "translateX(-100%)" }}
      />
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-3.5 bg-slate-200 rounded-md w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
          style={{ transform: "translateX(-100%)", animationDelay: `${index * 80}ms` }}
        />
      </div>
      <div className="h-2.5 bg-background rounded-md w-[35%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
          style={{ transform: "translateX(-100%)", animationDelay: `${index * 80 + 40}ms` }}
        />
      </div>
    </div>
    <div className="h-6 bg-background rounded-lg w-20 shrink-0 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
        style={{ transform: "translateX(-100%)", animationDelay: `${index * 80 + 60}ms` }}
      />
    </div>
    <div className="w-8 h-8 bg-background rounded-lg shrink-0" />
  </div>
);

const FollowingRow = ({
  user,
  isLast,
  isSelf,
  isOwnProfile,
  socialRel,
  onViewProfile,
  onUnfollow,
  onFollowToggle,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`group flex items-center gap-3 py-3.5 px-3 rounded-lg transition-colors duration-150 hover:bg-brand/[0.04] relative cursor-pointer ${
        !isLast ? "border-b border-slate-100/70" : ""
      }`}
      onClick={() => onViewProfile(user)}
    >
      <Avatar user={user} size={44} />

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-text-primary truncate leading-tight flex items-center gap-1.5">
          <span className="truncate">{user.name || "Explorer"}</span>
          {isSelf && (
            <span className="text-text-muted font-semibold text-[9px] sm:text-[10px] uppercase bg-background px-1.5 py-0.5 rounded-md shrink-0">
              You
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11.5px] text-text-muted font-medium truncate">
            @{user.username || "explorer"}
          </p>
        </div>
      </div>

      {!isSelf && (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors"
            aria-label={`More options for ${user.name}`}
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <OverflowMenu
                user={user}
                isOwnProfile={isOwnProfile}
                socialRel={socialRel}
                isLast={isLast}
                onClose={() => setMenuOpen(false)}
                onViewProfile={onViewProfile}
                onUnfollow={onUnfollow}
                onFollowToggle={onFollowToggle}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const FollowingModal = ({
  showRelationsModal,
  setShowRelationsModal,
  relationsModalType,
  relationsSearch,
  setRelationsSearch,
  relationsLoading,
  relationsList,
  tripMateStates,
  currentUser,
  currentUserData,
  profileUser,
  isOwnProfile: isOwnProfileProp,
  handleFollowToggleForUser,
  loadingRelationId,
  openRelationsModal,
  relationsError,
}) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [removedIds, setRemovedIds] = useState(new Set());
  const [confirmState, setConfirmState] = useState({ isOpen: false, user: null });
  const listRef = useRef(null);

  const isOwnProfile = isOwnProfileProp !== undefined
    ? isOwnProfileProp
    : Boolean(
        currentUser &&
        profileUser &&
        String(currentUser._id || currentUser.id) === String(profileUser._id || profileUser.id)
      );


  const debouncedSearch = useDebounce(searchInput, 300);

  const rawList = useMemo(() => {
    let list = relationsList || [];

    // Prioritize the logged-in user at the top, then sort alphabetically
    return [...list].sort((a, b) => {
      const isSelfA = currentUser && a._id === currentUser._id;
      const isSelfB = currentUser && b._id === currentUser._id;

      if (isSelfA && !isSelfB) return -1;
      if (!isSelfA && isSelfB) return 1;

      const nameA = (a.name || "Explorer").toLowerCase();
      const nameB = (b.name || "Explorer").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [relationsList, currentUser]);

  const activeList = useMemo(() => {
    return rawList.filter((u) => !removedIds.has(u._id));
  }, [rawList, removedIds]);

  const sortedList = useMemo(() => {
    if (!debouncedSearch.trim()) return activeList;
    const q = debouncedSearch.toLowerCase();
    return activeList.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
    );
  }, [activeList, debouncedSearch]);

  useEffect(() => {
    if (showRelationsModal) {
      setSearchInput(relationsSearch || "");
      setRemovedIds(new Set());
    }
  }, [showRelationsModal, relationsSearch]);

  useEffect(() => {
    if (setRelationsSearch && debouncedSearch !== relationsSearch) {
      setRelationsSearch(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const closeModal = useCallback(() => {
    setShowRelationsModal(false);
    setRelationsSearch("");
    setSearchInput("");
    setRemovedIds(new Set());
  }, [setShowRelationsModal, setRelationsSearch]);

  if (!showRelationsModal || relationsModalType !== "following") return null;

  const handleViewProfile = (user) => {
    closeModal();
    if (user._id) {
      navigate(`/profile/${user._id}`);
    } else {
      showToast.info(`Navigating to ${user.name}'s profile`);
    }
  };

  const handleMessage = async (user) => {
    closeModal();
    if (user._id) {
      try {
        const roomId = await chatService.getDirectRoomId(user._id);
        if (roomId) navigate(`/social/chat/${roomId}`);
      } catch {
        showToast.error("Failed to open conversation");
      }
    } else {
      showToast.info(`Opening chat with ${user.name}`);
    }
  };

  const handleUnfollow = (user) => {
    setConfirmState({ isOpen: true, user });
  };

  const handleConfirmUnfollow = async () => {
    const user = confirmState.user;
    if (!user) return;

    setRemovedIds((prev) => new Set([...prev, user._id]));

    if (handleFollowToggleForUser) {
      handleFollowToggleForUser(user);
    } else {
      showToast.success(`Unfollowed ${user.name}`);
    }

    setConfirmState({ isOpen: false, user: null });
  };

  const handleRetry = () => {
    if (openRelationsModal) {
      openRelationsModal("following");
    }
  };

  const isLoading = relationsLoading;
  const isError = !!relationsError && !isLoading;
  const isEmpty = !isLoading && !isError && activeList.length === 0;
  const isSearchNoResults =
    !isLoading && !isError && !isEmpty && debouncedSearch.trim() && sortedList.length === 0;
  const isDefault = !isLoading && !isError && !isEmpty && sortedList.length > 0;

  return (
    <>
      <AnimatePresence>
        {showRelationsModal && relationsModalType === "following" && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-brand/50 backdrop-blur-[2px]"
              onClick={closeModal}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="bg-white rounded-t-[20px] sm:rounded-2xl w-full sm:max-w-[520px] shadow-2xl relative z-10 flex flex-col h-[460px] max-h-[88vh] overflow-hidden"
            >
              {/* ── Header ── */}
              <div className="flex justify-between items-start px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white shrink-0">
                <div>
                  <h3
                    className="text-lg font-bold text-text-primary tracking-tight"
                    style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)" }}
                  >
                    Following
                  </h3>
                  <p className="text-xs text-text-muted font-medium mt-0.5">
                    {isOwnProfile
                      ? "People you follow"
                      : `People ${profileUser?.name || profileUser?.username || "this traveler"} follows`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="p-2 -mr-2 -mt-1 hover:bg-background rounded-full transition-colors text-muted hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── Search Bar ── */}
              <div className="px-5 sm:px-6 py-3 border-b border-border bg-secondary-50 shrink-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search traveler..."
                    aria-label="Search traveler"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-dark text-sm font-medium outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 transition-all placeholder:text-muted"
                  />
                </div>
              </div>

              {/* ── List Content ── */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 bg-white custom-scrollbar pb-16"
              >
                {/* Loading Skeleton */}
                {isLoading && (
                  <div className="py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} index={i} />
                    ))}
                  </div>
                )}

                {/* Error State */}
                {isError && (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <AlertTriangle className="w-7 h-7 text-danger" />
                    </div>
                    <p className="text-sm font-semibold text-dark text-center">
                      Couldn't load following list.
                    </p>
                    <p className="text-xs text-muted mt-1 text-center">
                      Something went wrong. Please try again.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center mb-4">
                      <UserCheck className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-text-secondary text-center">
                      {isOwnProfile
                        ? "You are not following anyone yet."
                        : `${profileUser?.name || "This traveler"} is not following anyone yet.`}
                    </p>
                    <p className="text-xs text-text-muted mt-1 text-center">
                      Explore and connect!
                    </p>
                  </div>
                )}

                {/* Search No Results */}
                {isSearchNoResults && (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center mb-4">
                      <Search className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-text-secondary text-center">
                      No travelers found for '{debouncedSearch}'
                    </p>
                    <p className="text-xs text-text-muted mt-1 text-center">
                      Try adjusting your search query.
                    </p>
                  </div>
                )}

                {/* Default — Data Rows */}
                {isDefault && (
                  <div className="py-1">
                    {sortedList.map((user, idx) => {
                      const isSelf = String(currentUser?._id || currentUser?.id) === String(user._id || user.id);
                      const socialRel = resolveRelationship(currentUser, user, tripMateStates?.[String(user._id)]);
                      return (
                        <FollowingRow
                          key={user._id}
                          user={user}
                          isLast={idx === sortedList.length - 1}
                          isSelf={isSelf}
                          isOwnProfile={isOwnProfile}
                          socialRel={socialRel}
                          onViewProfile={handleViewProfile}
                          onUnfollow={handleUnfollow}
                          onFollowToggle={handleFollowToggleForUser}
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


      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, user: null })}
        onConfirm={handleConfirmUnfollow}
        title="Unfollow Traveler?"
        message={`Are you sure you want to unfollow ${
          confirmState.user?.name || "this traveler"
        }?\n\nTheir travel updates and memories will no longer appear in your feed.`}
        confirmText="Unfollow"
        isDanger={true}
      />
    </>
  );
};

export default FollowingModal;
