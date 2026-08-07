import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  actionLink,
  icon: Icon,
  className = ""
}) => {
  return (
    <div className={`flex items-end justify-between mb-[var(--spacing-card)] ${className}`}>
      <div className="flex items-center gap-3">
        {Icon &&
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100/50">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>}

        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{subtitle}</p>}
        </div>
      </div>
      
      {actionLabel && actionLink &&
      <Link
      to={actionLink}
      className="text-[11px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors uppercase tracking-widest group">

          {actionLabel} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>}

    </div>);

};

export default SectionHeader;