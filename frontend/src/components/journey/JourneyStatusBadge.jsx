import React from "react";
import { Clock, Navigation, CheckCircle2, XCircle } from "lucide-react";

const JourneyStatusBadge = ({ status, size = "md" }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "Upcoming":
      case "upcoming":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50",
          icon:
          <Clock
          className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"} />,


          label: "Upcoming"
        };
      case "Ongoing":
      case "ongoing":
      case "Active":
      case "active":
      case "open":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
          icon:
          <Navigation
          className={
          size === "sm" ?
          "w-3 h-3 mr-1" :
          "w-3.5 h-3.5 mr-1.5"} />,



          label: status === "open" ? "Open" : "Ongoing"
        };
      case "Planning":
      case "planning":
      case "Pending":
      case "pending":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50",
          icon:
          <Clock
          className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"} />,


          label: status === "Pending" || status === "pending" ? "Pending" : "Planning"
        };
      case "Completed":
      case "completed":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
          icon:
          <CheckCircle2
          className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"} />,


          label: "Completed"
        };
      case "Cancelled":
      case "cancelled":
      case "Expired":
      case "expired":
      case "Rejected":
      case "rejected":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50",
          icon:
          <XCircle
          className={size === "sm" ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1.5"} />,


          label: status || "Cancelled"
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
          icon: null,
          label: status || "Unknown"
        };
    }
  };

  const style = getBadgeStyle();
  const padding =
  size === "sm" ? "px-2 py-0.5 text-xs font-semibold" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
    className={`inline-flex items-center rounded-full border ${padding} transition-all duration-200 shadow-xs ${style.bg}`}>

      {style.icon}
      {style.label}
    </span>);

};

export default JourneyStatusBadge;