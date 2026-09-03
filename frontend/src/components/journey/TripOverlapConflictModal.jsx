import React from "react";
import { AlertTriangle, Calendar, MapPin, X, Info } from "lucide-react";

// Modal shown when an active or scheduled trip conflict is detected
const TripOverlapConflictModal = ({
  isOpen,
  onClose,
  conflictType = "ACTIVE_JOURNEY_CONFLICT",
  conflictingTrip = null,
  currentTrip = null,
  customMessage = ""
}) => {
  if (!isOpen) return null;

  const isActiveConflict = conflictType === "ACTIVE_JOURNEY_CONFLICT";

  const primaryMessage = customMessage || (
    isActiveConflict
      ? "You're currently on an active trip that overlaps with this trip."
      : "You already have another trip during these dates."
  );

  const title = isActiveConflict ? "Active Trip Conflict" : "Trip Schedule Conflict";

  const formatDateRange = (start, end) => {
    if (!start || !end) return "";
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlap-conflict-title"
      onClick={onClose}
    >
      <div
        className="relative w-full w-[calc(100%-1.5rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-amber-200 p-5 sm:p-6 flex flex-col items-center text-center my-auto transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-background hover text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Close conflict popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 border border-amber-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-3.5 sm:mb-4 shadow-sm shrink-0">
          <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
        </div>

        <h2
          id="overlap-conflict-title"
          className="text-lg sm:text-xl font-black text-text-primary mb-2 leading-snug px-2"
        >
          {title}
        </h2>

        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 mb-4 w-full text-left">
          <p className="text-xs sm:text-sm font-bold text-amber-950 m-0 leading-relaxed">
            {primaryMessage}
          </p>
        </div>

        {/* Details / Explanation */}
        <p className="text-xs text-text-muted mb-4 leading-relaxed px-1">
          {isActiveConflict
            ? "Go YatriGo ensures travel safety by allowing participation in only one active trip at a time. Please complete your current journey before joining overlapping trips."
            : "You already have another travel commitment scheduled during these overlapping dates. You cannot join two overlapping journeys at the same time."}
        </p>

        {/* Conflicting Trip Snippet (if available) */}
        {conflictingTrip && (
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 text-left space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-text-muted">
              <Info className="w-3 h-3 text-amber-500" />
              <span>Existing Conflicting Trip</span>
            </div>
            <div className="font-extrabold text-text-primary text-xs truncate">
              {conflictingTrip.title || "Your Scheduled Trip"}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-secondary flex-wrap">
              {conflictingTrip.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[140px]">{conflictingTrip.destination}</span>
                </span>
              )}
              {conflictingTrip.startDate && conflictingTrip.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{formatDateRange(conflictingTrip.startDate, conflictingTrip.endDate)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Understood</span>
        </button>
      </div>
    </div>
  );
};

export default TripOverlapConflictModal;
