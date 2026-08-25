import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

/**
 * TripOverlapConflictBanner
 * 
 * An inline, always-visible, non-hover-dependent alert banner rendered on
 * trip/journey detail pages when an active or upcoming overlap conflict exists.
 */
const TripOverlapConflictBanner = ({
  conflictType = "ACTIVE_JOURNEY_CONFLICT",
  onOpenDetails,
  customMessage = ""
}) => {
  const isActiveConflict = conflictType === "ACTIVE_JOURNEY_CONFLICT";

  const message = customMessage || (
    isActiveConflict
      ? "You're currently on an active trip that overlaps with this trip."
      : "You already have another trip during these dates."
  );

  const title = isActiveConflict ? "Active Trip Conflict" : "Trip Schedule Conflict";

  return (
    <div
      className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in"
      role="alert"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 m-0 leading-snug">
            {title}
          </h4>
          <p className="text-[11px] sm:text-xs text-amber-900/90 dark:text-amber-300/90 font-medium m-0 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {onOpenDetails && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-[11px] sm:text-xs shadow-xs transition-all flex items-center gap-1 shrink-0"
        >
          <span>Conflict Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TripOverlapConflictBanner;
