import React from "react";
import Card from "../../common/Card";

const DashboardStatCard = ({ icon: Icon, title, value, description, accent = "primary", onClick }) => {
  const accentConfigs = {
    primary: {
      iconColor: "text-brand-600",
      iconBg: "bg-brand-50 border-brand-100/70",
      glowBg: "bg-brand-600",
      dotColor: "bg-brand-600"
    },
    success: {
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100/70",
      glowBg: "bg-emerald-500",
      dotColor: "bg-emerald-500"
    },
    warning: {
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50 border-amber-100/70",
      glowBg: "bg-amber-500",
      dotColor: "bg-amber-500"
    },
    info: {
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-100/70",
      glowBg: "bg-indigo-600",
      dotColor: "bg-indigo-600"
    }
  };

  const config = accentConfigs[accent] || accentConfigs.primary;

  return (
    <Card
      interactive
      padding="sm"
      onClick={onClick}
      className={`group relative overflow-hidden h-full flex flex-col justify-between !p-3.5 sm:!p-4 border-slate-200/80 hover:border-brand-300 transition-all duration-300 shadow-xs hover:shadow-md ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.05] ${config.glowBg} group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />
      
      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none font-heading">
            {value ?? 0}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mt-1.5 leading-tight truncate">
            {title}
          </p>
        </div>
        
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-transform group-hover:scale-105 ${config.iconBg}`}>
          <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${config.iconColor}`} />
        </div>
      </div>
      
      {description && (
        <p className="text-[10px] font-semibold text-slate-400 pt-2 mt-2 border-t border-slate-100 flex items-center gap-1.5 relative z-10 leading-snug">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`} />
          <span className="min-w-0 truncate">{description}</span>
        </p>
      )}
    </Card>
  );
};

export default DashboardStatCard;