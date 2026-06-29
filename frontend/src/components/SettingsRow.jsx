import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const rowClass = (danger, extra = "") =>
  [
    "w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left",
    danger
      ? "bg-white border border-rose-100 hover:bg-rose-50"
      : "bg-slate-50 hover:bg-slate-100",
    extra,
  ]
    .filter(Boolean)
    .join(" ");

const SettingsRow = ({
  icon: Icon,
  title,
  subtitle,
  to,
  onClick,
  showChevron,
  colorClass = "text-slate-500 bg-slate-50",
  danger = false,
}) => {
  if (process.env.NODE_ENV !== "production" && !Icon) {
    console.error(
      "[SettingsRow] The `icon` prop is required but was not provided.",
    );
  }

  if (process.env.NODE_ENV !== "production" && !to && !onClick) {
    console.warn(
      `[SettingsRow] "${title}" has neither a \`to\` nor an \`onClick\` prop. ` +
        "The row will render but will be non-interactive.",
    );
  }

  const chevronVisible = showChevron !== undefined ? showChevron : Boolean(to);

  const ariaLabel = subtitle ? `${title}: ${subtitle}` : title;

  const content = (
    <>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-xl ${colorClass}`} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <span
            className={`text-sm font-bold ${danger ? "text-rose-600" : "text-slate-700"}`}
          >
            {title}
          </span>
          {subtitle && (
            <p
              className={`text-xs ${danger ? "text-rose-400" : "text-slate-400"}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {chevronVisible && (
        <ChevronRight
          className="w-5 h-5 text-slate-400 shrink-0"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={rowClass(danger)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={ariaLabel}
      className={rowClass(
        danger,
        !onClick ? "opacity-50 cursor-not-allowed" : "",
      )}
    >
      {content}
    </button>
  );
};

export default SettingsRow;
