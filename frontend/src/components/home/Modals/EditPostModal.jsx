import React from "react";
import { X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const EditPostModal = ({
  showEditPostModal,
  setShowEditPostModal,
  editPostData,
  setEditPostData,
  handleEditPostSubmit,
  isSaving,
}) => {
  if (!showEditPostModal || !editPostData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div
        className="fixed inset-0"
        onClick={() => {
          setShowEditPostModal(false);
          setEditPostData(null);
        }}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-xl relative z-10 overflow-hidden"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Edit Travel Memory
          </h3>
          <button
            onClick={() => {
              setShowEditPostModal(false);
              setEditPostData(null);
            }}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleEditPostSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Caption
            </label>
            <textarea
              placeholder="Write a caption..."
              value={editPostData.caption || ""}
              onChange={(e) =>
                setEditPostData({
                  ...editPostData,
                  caption: e.target.value,
                })
              }
              rows="3"
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Location
            </label>
            <input
              type="text"
              placeholder="Add location"
              value={editPostData.location || ""}
              onChange={(e) =>
                setEditPostData({
                  ...editPostData,
                  location: e.target.value,
                })
              }
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
            />
          </div>
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditPostModal(false);
                setEditPostData(null);
              }}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#111827] dark:bg-[#7C3AED] text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-[#5b3ce0] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditPostModal;
