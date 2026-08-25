import React, { memo } from "react";
import {
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  upcoming: {
    className:
      "bg-brand-50 text-brand-700 border-brand-200 " +
      "dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-800/50",
    icon: Clock,
    label: "Upcoming",
  },

  ongoing: {
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 " +
      "dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    icon: Navigation,
    label: "Ongoing",
  },

  active: {
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 " +
      "dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    icon: Navigation,
    label: "Ongoing",
  },

  open: {
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 " +
      "dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    icon: Navigation,
    label: "Open",
  },

  planning: {
    className:
      "bg-amber-50 text-amber-700 border-amber-200 " +
      "dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
    icon: Clock,
    label: "Planning",
  },

  pending: {
    className:
      "bg-amber-50 text-amber-700 border-amber-200 " +
      "dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
    icon: Clock,
    label: "Pending",
  },

  completed: {
    className:
      "bg-slate-100 text-slate-700 border-slate-200 " +
      "dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    icon: CheckCircle2,
    label: "Completed",
  },

  cancelled: {
    className:
      "bg-rose-50 text-rose-700 border-rose-200 " +
      "dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50",
    icon: XCircle,
    label: "Cancelled",
  },
  canceled: {
    className:
      "bg-rose-50 text-rose-700 border-rose-200 " +
      "dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50",
    icon: XCircle,
    label: "Cancelled",
  },
};

const DEFAULT_STATUS = {
  className:
    "bg-slate-100 text-slate-700 border-slate-200 " +
    "dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  icon: null,
  label: "Unknown",
};

const SIZE_CONFIG = {
  sm: {
    padding: "px-2 py-0.5 text-xs",
    icon: "w-3 h-3 mr-1",
  },
  md: {
    padding: "px-2.5 py-1 text-xs",
    icon: "w-3.5 h-3.5 mr-1.5",
  },
};

const JourneyStatusBadge = memo(({ status, size = "md" }) => {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase();

  const statusConfig =
    STATUS_CONFIG[normalizedStatus] ?? DEFAULT_STATUS;

  const sizeConfig = SIZE_CONFIG[size] ?? SIZE_CONFIG.md;

  const Icon = statusConfig.icon;

  return (
    <span
      className={[
        "inline-flex items-center",
        "rounded-full border",
        "font-semibold",
        "transition-all duration-200",
        "shadow-xs",
        sizeConfig.padding,
        statusConfig.className,
      ].join(" ")}
      aria-label={`Journey status: ${statusConfig.label}`}
    >
      {Icon && (
        <Icon
          className={sizeConfig.icon}
          aria-hidden="true"
        />
      )}

      <span>{statusConfig.label}</span>
    </span>
  );
});

JourneyStatusBadge.displayName = "JourneyStatusBadge";

export default JourneyStatusBadge;