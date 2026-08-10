import React from "react";
import { Link } from "react-router-dom";
import { X, Search, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../../utils/avatar";

export const RelationsModal = ({
  showRelationsModal,
  setShowRelationsModal,
  relationsModalType,
  relationsSearch,
  setRelationsSearch,
  relationsLoading,
  relationsList,
  currentUser,
  currentUserData,
  handleFollowToggleForUser,
  loadingRelationId,
}) => {
  if (!showRelationsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        className="fixed inset-0"
        onClick={() => {
          setShowRelationsModal(false);
          setRelationsSearch("");
        }}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm h-[450px] shadow-xl relative z-10 flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
          <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            {relationsModalType === "followers" ? "Followers" : "Following"}
          </h3>
          <button
            onClick={() => {
              setShowRelationsModal(false);
              setRelationsSearch("");
            }}
            className="p-1 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-[#111827]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-50">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search traveler..."
              value={relationsSearch}
              onChange={(e) => setRelationsSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-9 pr-4 py-2 text-slate-855 text-xs outline-none focus:border-[#6C4DF6] focus:bg-white transition-all shadow-inner font-bold"
            />
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {relationsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6C4DF6]" />
            </div>
          ) : (() => {
            const filteredList = relationsList.filter(
              (u) =>
                (u.name || "").toLowerCase().includes(relationsSearch.toLowerCase()) ||
                (u.username || "").toLowerCase().includes(relationsSearch.toLowerCase())
            );

            if (filteredList.length === 0) {
              return (
                <div className="text-center py-12">
                  <UserIcon className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    No Travelers Found
                  </p>
                  <p className="text-[10px] text-slate-550 mt-1 font-bold">
                    Try adjusting your search query.
                  </p>
                </div>
              );
            }

            return filteredList.map((u) => {
              const isSelf = u._id === currentUser?._id;
              const isFollowedByMe = currentUserData?.following?.some(
                (f) => (f._id || f) === u._id
              );

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between gap-4"
                >
                  <Link
                    to={`/profile/${u._id}`}
                    onClick={() => {
                      setShowRelationsModal(false);
                      setRelationsSearch("");
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <img
                      src={getAvatarUrl(u, u.img, u.name)}
                      alt={u.name || "Traveler"}
                      className="w-9 h-9 rounded-full object-cover border border-slate-100 group-hover:scale-102 transition-transform shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-[#111827] block leading-none truncate group-hover:text-[#6C4DF6] transition-colors flex items-center gap-1">
                        {u.name || "Explorer"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 tracking-wider">
                        @{u.username || "explorer"}
                      </span>
                    </div>
                  </Link>

                  {!isSelf && (
                    <button
                      onClick={() => handleFollowToggleForUser(u)}
                      disabled={loadingRelationId === u._id}
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm ${
                        loadingRelationId === u._id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${
                        isFollowedByMe
                          ? "border border-[#6C4DF6] text-[#6C4DF6] bg-transparent hover:bg-[#6C4DF6]/5"
                          : "bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white"
                      }`}
                    >
                      {loadingRelationId === u._id
                        ? "..."
                        : isFollowedByMe
                          ? "Unfollow"
                          : "Follow"}
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </motion.div>
    </div>
  );
};

export default RelationsModal;
