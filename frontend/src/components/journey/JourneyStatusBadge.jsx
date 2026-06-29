import React from "react";
import { Clock, Navigation, CheckCircle2, XCircle } from "lucide-react";

const JourneyStatusBadge = ({ status, size = "md" }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "Upcoming":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
          icon: (
            <Clock
              className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"}
            />
          ),
          label: "Upcoming",
        };
      case "Ongoing":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 animate-pulse",
          icon: (
            <Navigation
              className={
                size === "sm"
                  ? "w-3 h-3 mr-1 animate-spin"
                  : "w-3.5 h-3.5 mr-1.5 animate-spin"
              }
            />
          ),
          label: "Ongoing",
        };
      case "Completed":
        return {
          bg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50",
          icon: (
            <CheckCircle2
              className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"}
            />
          ),
          label: "Completed",
        };
      case "Cancelled":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50",
          icon: (
            <XCircle
              className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"}
            />
          ),
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          icon: null,
          label: status || "Unknown",
        };
    }
  };

  const style = getBadgeStyle();
  const padding =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${padding} transition-all duration-200 shadow-sm ${style.bg}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

export default JourneyStatusBadge;
