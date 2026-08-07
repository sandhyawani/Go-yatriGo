import React from "react";
import { Link } from "react-router-dom";

const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionLink,
  onClick,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-[var(--radius-card)] border border-dashed border-slate-200 ${className}`}>
      {Icon &&
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>}

      {title && <h4 className="text-sm font-bold text-slate-700 mb-1">{title}</h4>}
      {subtitle && <p className="text-xs font-semibold text-slate-500 mb-4">{subtitle}</p>}
      
      {actionLabel && actionLink ?
      <Link
      to={actionLink}
      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">

          {actionLabel} <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link> :
      actionLabel && onClick ?
      <button
      onClick={onClick}
      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">

          {actionLabel} <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button> :
      null}
    </div>);

};

export default EmptyState;