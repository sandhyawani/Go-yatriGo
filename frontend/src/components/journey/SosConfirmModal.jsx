import React from "react";
import { ShieldAlert, X, ShieldCheck } from "lucide-react";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-scale-up"
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isActivating
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}
            >
              {isActivating ? (
                <ShieldAlert className="w-6 h-6 shrink-0" />
              ) : (
                <ShieldCheck className="w-6 h-6 shrink-0" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
                {isActivating ? "Send Emergency SOS?" : "Cancel Emergency SOS?"}
              </h3>
              <span className="text-xs font-semibold text-text-muted">
                {isActivating ? "Emergency Safety Protocol" : "Safety Status Update"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary leading-relaxed m-0">
              {isActivating
                ? "This will activate your in-app SOS status flag."
                : "Confirm that you are safe and want to deactivate the emergency alert."}
            </p>
            {isActivating && (
              <p className="text-xs font-medium text-text-muted leading-relaxed m-0">
                Your current journey information will be included when available.
                {journeyTitle ? ` (${journeyTitle})` : ""}
              </p>
            )}
          </div>

          {/* Quick Notice Card */}
          {isActivating && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
              <p className="text-xs font-bold text-rose-700 m-0">
                🚨 Note: This does not dispatch external SMS/calls. Please dial emergency services manually if needed.
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
            className="px-5 py-3 rounded-xl text-sm font-bold text-text-secondary bg-background hover transition-colors disabled:opacity-50"
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
