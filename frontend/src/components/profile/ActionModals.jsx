import React from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportModal from "../modals/ReportModal";

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
      {/* BLOCK CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowBlockModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                {isBlockedByMe ? "Unblock User?" : "Block User?"}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isBlockedByMe
                  ? "They will be able to see your profile and interact with you again."
                  : "They won't be able to find your profile, posts, or story on Go YatriGo. They won't be notified that you blocked them."}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleBlockUser();
                    setShowBlockModal(false);
                  }}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  {isBlockedByMe ? "Unblock" : "Block"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RATE USER MODAL */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowRateModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-xs font-black text-[#111827] flex items-center gap-2 mb-2 uppercase tracking-wider">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Rate Companion
              </h3>
              <p className="text-[10px] text-slate-400 mb-6 leading-relaxed font-bold">
                Provide travel feedback based on shared route planning, expenses sharing, and reliability.
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingVal
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-slate-500 font-extrabold text-[9px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRateUser();
                    setShowRateModal(false);
                  }}
                  className="px-5 py-2.5 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl font-extrabold text-[9px] uppercase tracking-widest transition-colors shadow-sm active:scale-95"
                >
                  Submit Rating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT SAFETY DIALOG MODAL */}
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

      {/* EDIT POST MODAL */}
      <AnimatePresence>
        {showEditPostModal && editPostData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowEditPostModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-sm font-black mb-4">Edit Post</h3>
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
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-[#6C4DF6]"
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
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-[#6C4DF6] resize-none"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPostModal(false)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#6C4DF6] text-white rounded-xl text-xs font-bold"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE POST MODAL */}
      <AnimatePresence>
        {showDeletePostModal && postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowDeletePostModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                Delete Post?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to delete this post? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeletePostModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isSaving}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT STORY MODAL */}
      <AnimatePresence>
        {showEditStoryModal && editStoryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowEditStoryModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-sm font-black mb-4">Edit Story</h3>
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
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-[#6C4DF6] resize-none"
                />
                <select
                  value={editStoryData.captionPosition || "center"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionPosition: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-[#6C4DF6]"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <select
                  value={editStoryData.captionColor || "white"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionColor: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-[#6C4DF6]"
                >
                  <option value="white">White</option>
                  <option value="black">Black</option>
                  <option value="purple">Purple</option>
                </select>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditStoryModal(false)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#6C4DF6] text-white rounded-xl text-xs font-bold"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE STORY MODAL */}
      <AnimatePresence>
        {showDeleteStoryModal && storyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <div className="fixed inset-0" onClick={() => setShowDeleteStoryModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                Delete Story?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to delete this story? This cannot be undone.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteStoryModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  disabled={isSaving}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
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
