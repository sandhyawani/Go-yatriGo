import React from "react";
import { ShieldAlert, X, ShieldCheck } from "lucide-react";

/**
 * Redesigned Emergency SOS Confirmation Modal
 * Strictly adheres to the Go YatriGo Journey Safety design system.
 */
const SosConfirmModal = ({
  isOpen,
  isActivating = true,
  onConfirm,
  onClose,
  loading = false,
  journeyTitle = null
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-scale-up"
      >
        {/* Top bar with close icon */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isActivating
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isActivating ? (
                <ShieldAlert className="w-6 h-6 shrink-0" />
              ) : (
                <ShieldCheck className="w-6 h-6 shrink-0" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 m-0 tracking-tight">
                {isActivating ? "Send Emergency SOS?" : "Cancel Emergency SOS?"}
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isActivating ? "Emergency Safety Protocol" : "Safety Status Update"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed m-0">
              {isActivating
                ? "This will send an emergency alert to your registered emergency contacts."
                : "Confirm that you are safe and want to deactivate the emergency alert."}
            </p>
            {isActivating && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                Your current journey information will be included when available.
                {journeyTitle ? ` (${journeyTitle})` : ""}
              </p>
            )}
          </div>

          {/* Quick Notice Card */}
          {isActivating && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 m-0">
                🚨 Immediate notification will be dispatched to your emergency network.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Action Layout: [ Cancel ] [ Primary Action ] */}
        <div className="flex items-center gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 min-w-0 ${
              isActivating
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
            }`}
          >
            {isActivating ? (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {loading ? "Sending SOS..." : "🆘 Send SOS Alert"}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {loading ? "Updating..." : "✓ I Am Safe"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SosConfirmModal;
