import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false, isLoading = false }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-black text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-5 sm:py-6 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 rounded-b-3xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 order-2 sm:order-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm transition-colors flex items-center justify-center gap-2 order-1 sm:order-2 ${
                isDanger ? "bg-rose-500 hover:bg-rose-600" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
