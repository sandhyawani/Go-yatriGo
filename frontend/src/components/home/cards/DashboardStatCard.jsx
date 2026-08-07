import React from "react";
import Card from "../../common/Card";

const DashboardStatCard = ({ icon: Icon, title, value, description, accent = "primary" }) => {
  const accentColors = {
    primary: "text-[#7C3AED] bg-purple-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-500 bg-amber-50",
    info: "text-sky-500 bg-sky-50"
  };

  const accentClass = accentColors[accent] || accentColors.primary;
  const rawAccentColor = accent === 'primary' ? 'text-[#7C3AED]' :
  accent === 'success' ? 'text-emerald-600' :
  accent === 'warning' ? 'text-amber-500' : 'text-sky-500';

  return (
    <Card interactive className="group relative overflow-hidden h-full flex flex-col">
      {}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] ${accentColors[accent]} group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 pr-2">
          <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 leading-tight">{title}</p>
        </div>
        
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/50 shadow-sm ${accentClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {description &&
      <p className="text-[10px] font-bold text-slate-400 mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5 relative z-10 leading-snug">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rawAccentColor.replace('text-', 'bg-')}`}></span>
          <span className="min-w-0 break-words">{description}</span>
        </p>}

    </Card>);

};

export default DashboardStatCard;