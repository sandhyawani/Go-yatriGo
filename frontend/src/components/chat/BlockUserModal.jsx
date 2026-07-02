import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatar } from "../../utils/chat/chatHelpers";

export const BlockUserModal = ({
  isOpen,
  onClose,
  activeRoom,
  currentUserId,
  confirmBlockUser
}) => {
  if (!isOpen || !activeRoom) return null;

  const otherUser = activeRoom.members?.find(
    (member) => (member._id || member)?.toString() !== currentUserId?.toString()
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-white w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col items-center text-center p-6 mb-4 sm:mb-0"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={getAvatar(otherUser, otherUser?.name)}
            alt=""
            className="w-[72px] h-[72px] rounded-full object-cover shadow-sm mb-3 border border-slate-100"
          />
          <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
            Block {otherUser?.name}?
          </h3>
          {otherUser?.username && (
            <p className="text-[14px] font-medium text-slate-500 mb-5">
              @{otherUser.username}
            </p>
          )}
          {!otherUser?.username && <div className="h-5"></div>}

          <div className="text-[13.5px] text-slate-600 mb-6 space-y-3 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
            <p className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>You won't be able to send messages to each other.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Existing chat history will remain available.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>You can unblock them anytime.</span>
            </p>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={confirmBlockUser}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-[15px] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Block User
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 text-slate-700 bg-transparent rounded-2xl font-bold text-[15px] hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default BlockUserModal;
