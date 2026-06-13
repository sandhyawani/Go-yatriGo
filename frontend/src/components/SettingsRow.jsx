// import React from 'react';
// import { ChevronRight } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const SettingsRow = ({ icon: Icon, title, subtitle, to, onClick, colorClass = "text-slate-500 bg-slate-50", danger = false }) => {
//   const content = (
//     <>
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-xl ${colorClass}`}>
//           <Icon className="w-5 h-5" />
//         </div>
//         <div>
//           <span className={`text-sm font-bold ${danger ? 'text-rose-600' : 'text-slate-700'}`}>{title}</span>
//           {subtitle && <p className={`text-xs ${danger ? 'text-rose-400' : 'text-slate-400'}`}>{subtitle}</p>}
//         </div>
//       </div>
//       {to && <ChevronRight className="w-5 h-5 text-slate-400" />}
//     </>
//   );

//   if (to) {
//     return (
//       <Link to={to} className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors ${danger ? 'hover:bg-rose-50 border border-rose-100 bg-white' : ''}`}>
//         {content}
//       </Link>
//     );
//   }

//   return (
//     <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors ${danger ? 'hover:bg-rose-50 border border-rose-100 bg-white' : ''}`}>
//       {content}
//     </button>
//   );
// };

// export default SettingsRow;


import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the className for the row container.
 * Extracted once so <Link> and <button> never drift apart.
 */
const rowClass = (danger, extra = '') =>
  [
    'w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left',
    danger
      ? 'bg-white border border-rose-100 hover:bg-rose-50'
      : 'bg-slate-50 hover:bg-slate-100',
    extra,
  ]
    .filter(Boolean)
    .join(' ');

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SettingsRow
 *
 * Renders either a <Link> (when `to` is provided) or a <button> (when `onClick`
 * is provided). Pass exactly one of the two.
 *
 * Props:
 *  icon        – Lucide icon component (required)
 *  title       – Row label (required)
 *  subtitle    – Optional secondary line
 *  to          – React Router path; renders a <Link>
 *  onClick     – Click handler; renders a <button>
 *  showChevron – Show the right-arrow indicator (defaults to true when `to` is set)
 *  colorClass  – Icon wrapper color/bg classes
 *  danger      – Applies rose danger styling
 */
const SettingsRow = ({
  icon: Icon,
  title,
  subtitle,
  to,
  onClick,
  showChevron,
  colorClass = 'text-slate-500 bg-slate-50',
  danger = false,
}) => {
  // Dev-time guard: catch missing icon early with a readable message
  if (process.env.NODE_ENV !== 'production' && !Icon) {
    console.error('[SettingsRow] The `icon` prop is required but was not provided.');
  }

  // Dev-time guard: catch ambiguous / missing interaction props
  if (process.env.NODE_ENV !== 'production' && !to && !onClick) {
    console.warn(
      `[SettingsRow] "${title}" has neither a \`to\` nor an \`onClick\` prop. ` +
      'The row will render but will be non-interactive.'
    );
  }

  // Chevron defaults to true for links, false for plain buttons,
  // but is always overridable via the explicit `showChevron` prop.
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
          <span className={`text-sm font-bold ${danger ? 'text-rose-600' : 'text-slate-700'}`}>
            {title}
          </span>
          {subtitle && (
            <p className={`text-xs ${danger ? 'text-rose-400' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {chevronVisible && (
        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={ariaLabel}
        className={rowClass(danger)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"           // prevent accidental form submission
      onClick={onClick}
      disabled={!onClick}     // inert if no handler provided
      aria-label={ariaLabel}
      className={rowClass(danger, !onClick ? 'opacity-50 cursor-not-allowed' : '')}
    >
      {content}
    </button>
  );
};

export default SettingsRow;
