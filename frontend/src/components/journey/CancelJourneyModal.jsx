import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const CancelJourneyModal = ({ isOpen, onClose, onConfirm, journeyTitle }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transform transition-all animate-scale-in">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            Cancel Journey?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
            Are you sure you want to cancel <strong className="text-slate-700 dark:text-slate-300 font-bold">"{journeyTitle}"</strong>? All members will be notified and this action cannot be undone.
          </p>

          <div className="w-full text-left mb-6">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Optional Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you cancelling this journey?"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none h-24"
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
            >
              Keep Journey
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-black text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "Cancelling..." : "Yes, Cancel It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelJourneyModal;
