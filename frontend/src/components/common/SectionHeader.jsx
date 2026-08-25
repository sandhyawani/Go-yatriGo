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
    <div className={`flex items-center justify-between mb-3.5 sm:mb-4 ${className}`}>
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100/60 shadow-xs">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight font-heading truncate leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="text-[10.5px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors uppercase tracking-[0.08em] group shrink-0 ml-2 py-1"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;