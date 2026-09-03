import React from "react";
import { Star, Ban, Trash2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportModal from "../modals/ReportModal";
import CustomSelect from "../ui/CustomSelect";

export const ActionModals = ({
  showBlockModal,
  setShowBlockModal,
  isBlockedByMe,
  handleBlockUser,
  showRateModal,
  setShowRateModal,
  ratingVal,
  setRatingVal,
  handleRateUser,
  showReportModal,
  setShowReportModal,
  profileUser,
  // Edit/Delete Post Props
  showEditPostModal,
  setShowEditPostModal,
  editPostData,
  setEditPostData,
  handleEditPost,
  showDeletePostModal,
  setShowDeletePostModal,
  postToDelete,
  handleDeletePost,
  // Edit/Delete Story Props
  showEditStoryModal,
  setShowEditStoryModal,
  editStoryData,
  setEditStoryData,
  handleEditStory,
  showDeleteStoryModal,
  setShowDeleteStoryModal,
  storyToDelete,
  handleDeleteStory,
  isSaving,
}) => {
  return (
    <>
      {/* ─── 1. BLOCK CONFIRMATION MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowBlockModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface p-6 sm:p-7 rounded-3xl w-full max-w-sm shadow-2xl border border-border relative z-10 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center mx-auto mb-3">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider mb-2 text-danger">
                {isBlockedByMe ? "Unblock Traveler?" : "Block Traveler?"}
              </h3>
              <p className="text-xs text-muted font-medium leading-relaxed mb-6">
                {isBlockedByMe
                  ? "They will be able to see your profile, trips, and interact with you again on Go YatriGo."
                  : "They won't be able to find your profile, travel memories, or chat with you. They won't be notified that you blocked them."}
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-5 py-2.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-full text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleBlockUser();
                    setShowBlockModal(false);
                  }}
                  className="px-6 py-2.5 bg-danger hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-danger/20 active:scale-95"
                >
                  {isBlockedByMe ? "Unblock" : "Block"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 2. RATE USER MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowRateModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border p-6 sm:p-7 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 text-center"
            >
              <h3 className="text-xs font-black text-dark flex items-center justify-center gap-2 mb-2 uppercase tracking-widest">
                <Star className="w-4 h-4 text-warning fill-warning" /> Rate Companion
              </h3>
              <p className="text-[11px] text-muted mb-6 leading-relaxed font-medium">
                Provide travel feedback based on shared route planning, expenses sharing, and reliability.
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="transition-transform active:scale-90"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingVal
                          ? "fill-warning text-warning drop-shadow-sm"
                          : "text-secondary-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 justify-center pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-5 py-2.5 text-muted hover:text-dark rounded-full font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRateUser();
                    setShowRateModal(false);
                  }}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-md shadow-primary-600/25 active:scale-95"
                >
                  Submit Rating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 3. REPORT SAFETY MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetId={profileUser?._id}
            targetType="user"
            reportedUserId={profileUser?._id}
          />
        )}
      </AnimatePresence>

      {/* ─── 4. EDIT TRAVEL MEMORY MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showEditPostModal && editPostData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowEditPostModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-border relative z-10"
            >
              <h3 className="text-sm font-bold text-dark mb-4 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary-600" /> Edit Travel Memory
              </h3>
              <form onSubmit={handleEditPost} className="space-y-3">
                <input
                  type="text"
                  placeholder="Location"
                  value={editPostData.location || ""}
                  onChange={(e) =>
                    setEditPostData({
                      ...editPostData,
                      location: e.target.value,
                    })
                  }
                  className="w-full bg-secondary-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                />
                <textarea
                  placeholder="Caption"
                  value={editPostData.caption || ""}
                  onChange={(e) =>
                    setEditPostData({
                      ...editPostData,
                      caption: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full bg-secondary-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary-600 resize-none"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPostModal(false)}
                    className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-full text-xs font-bold text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-xs font-bold shadow-md shadow-primary-600/20 transition-all"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 5. DELETE TRAVEL MEMORY MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {showDeletePostModal && postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowDeletePostModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface p-6 sm:p-7 rounded-3xl w-full max-w-sm shadow-2xl border border-border relative z-10 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black mb-2 text-danger uppercase tracking-wider">
                Delete Travel Memory?
              </h3>
              <p className="text-xs text-muted font-medium leading-relaxed mb-6">
                Are you sure you want to delete this Travel Memory? This cannot be undone.
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeletePostModal(false)}
                  className="px-5 py-2.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-full text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-danger hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-danger/20 active:scale-95"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 6. EDIT STORY MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditStoryModal && editStoryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowEditStoryModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-border relative z-10"
            >
              <h3 className="text-sm font-bold text-dark mb-4">Edit Dispatch</h3>
              <form onSubmit={handleEditStory} className="space-y-3">
                <textarea
                  placeholder="Caption"
                  value={editStoryData.caption || ""}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      caption: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full bg-secondary-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary-600 resize-none"
                />
                <CustomSelect
                  value={editStoryData.captionPosition || "center"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionPosition: e.target.value,
                    })
                  }
                  className="w-full bg-secondary-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                  options={[
                    { label: "Top", value: "top" },
                    { label: "Center", value: "center" },
                    { label: "Bottom", value: "bottom" },
                  ]}
                />
                <CustomSelect
                  value={editStoryData.captionColor || "white"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionColor: e.target.value,
                    })
                  }
                  className="w-full bg-secondary-50 border border-border rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                  options={[
                    { label: "Pure White", value: "white" },
                    { label: "Deep Charcoal", value: "black" },
                    { label: "Sky Blue (Brand Pop)", value: "sky" },
                    { label: "Ruby Coral Pop", value: "ruby" },
                    { label: "Amber Gold Pop", value: "amber" },
                    { label: "Emerald Mint Pop", value: "emerald" },
                    { label: "Electric Violet Pop", value: "violet" },
                  ]}
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditStoryModal(false)}
                    className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-muted rounded-full text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-xs font-bold shadow-md shadow-primary-600/20 transition-all"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 7. DELETE STORY MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteStoryModal && storyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowDeleteStoryModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface p-6 sm:p-7 rounded-3xl w-full max-w-sm shadow-2xl border border-border relative z-10 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black mb-2 text-danger uppercase tracking-wider">
                Delete Dispatch?
              </h3>
              <p className="text-xs text-muted font-medium leading-relaxed mb-6">
                Are you sure you want to delete this Dispatch? This cannot be undone.
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteStoryModal(false)}
                  className="px-5 py-2.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-full text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-danger hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-danger/20 active:scale-95"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActionModals;
