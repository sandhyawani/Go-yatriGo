import { showToast } from "../utils/showToast";
// import React, { useState } from 'react';
// import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
// import axios from '../api/axios';
// import { showToast } from "../utils/showToast";

// const SettingsToggle = ({ title, description, settingKey, initialValue, endpoint = '/settings' }) => {
//   const [value, setValue] = useState(initialValue);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleToggle = async () => {
//     if (isLoading) return;
    
//     const newValue = !value;
//     setValue(newValue); // Optimistic UI
//     setIsLoading(true);

//     try {
//       const payload = {};
//       payload[settingKey] = newValue;
//       await axios.patch(endpoint, payload, { withCredentials: true });
//       // Toast optional: showToast.success('Setting updated');
//     } catch (err) {
//       // Rollback on failure
//       setValue(!newValue);
//       showToast.error('Failed to update setting');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
//       <div>
//         <span className="text-sm font-bold text-slate-700">{title}</span>
//         {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
//       </div>
//       <button 
//         onClick={handleToggle} 
//         disabled={isLoading}
//         className={`transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand-500'}`}
//       >
//         {isLoading ? (
//           <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
//         ) : value ? (
//           <ToggleRight className="w-8 h-8 text-brand-500" />
//         ) : (
//           <ToggleLeft className="w-8 h-8 text-slate-400" />
//         )}
//       </button>
//     </div>
//   );
// };

// export default SettingsToggle;


import React, { useState, useEffect, useCallback, useId } from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import axios from '../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = '/settings';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SettingsToggle
 *
 * A labelled switch that PATCHes a single boolean setting to the API.
 * Implements optimistic UI with automatic rollback on failure.
 *
 * Props:
 *   title        {string}  — visible label (required)
 *   description  {string}  — optional sub-label
 *   settingKey   {string}  — the key sent in the PATCH payload (required)
 *   initialValue {boolean} — starting state; re-syncs if parent re-renders with a new value
 *   endpoint     {string}  — API path, defaults to '/settings'
 */
const SettingsToggle = ({
  title,
  description,
  settingKey,
  initialValue = false,
  endpoint = DEFAULT_ENDPOINT,
}) => {
  const [value, setValue]       = useState(Boolean(initialValue));
  const [isLoading, setIsLoading] = useState(false);

  // Fix #1 — sync when the parent re-renders with a genuinely new initialValue
  // (e.g. after an async fetch resolves). Guard with !isLoading so an in-flight
  // request isn't overwritten by a stale prop arriving late.
  useEffect(() => {
    if (!isLoading) {
      setValue(Boolean(initialValue));
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fix #2 — validate settingKey before doing anything
  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    if (!settingKey) {
      console.error('[SettingsToggle] `settingKey` prop is required but was not provided.');
      showToast.error('Configuration error — please contact support.');
      return;
    }

    const newValue = !value;
    setValue(newValue);      // optimistic update
    setIsLoading(true);

    try {
      await axios.patch(
        endpoint,
        { [settingKey]: newValue },
        { withCredentials: true }
      );
      // Uncomment for explicit confirmation:
      // showToast.success('Setting updated');
    } catch (err) {
      // Rollback
      setValue(!newValue);
      showToast.error('Failed to update setting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, settingKey, value, endpoint]);

  // Stable id for aria-labelledby / aria-describedby
  const uid         = useId();
  const labelId     = `${uid}-label`;
  const descId      = `${uid}-desc`;

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">

      {/* Label */}
      <div>
        {/* Fix #11 — guard against missing title */}
        <span id={labelId} className="text-sm font-bold text-slate-700">
          {title ?? 'Setting'}
        </span>
        {/* Fix #10 — only render if description is a non-empty string */}
        {description && typeof description === 'string' && (
          <p id={descId} className="text-xs text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>

      {/* Toggle button
          Fix #3  — explicit type="button" prevents accidental form submission
          Fix #6  — role="switch" + aria-checked for screen readers
          Fix #7  — aria-labelledby links to the visible label
          Fix #4  — aria-disabled mirrors the disabled state for AT
          Fix #12 — spinner overlays the icon so layout width stays stable
      */}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        aria-disabled={isLoading}
        disabled={isLoading}
        onClick={handleToggle}
        className={[
          'relative w-8 h-8 flex items-center justify-center rounded transition-opacity',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {/* Fix #12 — icon always rendered for stable layout; spinner overlays */}
        {value
          ? <ToggleRight className="w-8 h-8 text-blue-500" aria-hidden="true" />
          : <ToggleLeft  className="w-8 h-8 text-slate-400" aria-hidden="true" />
        }

        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-50/70 rounded">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" aria-hidden="true" />
          </span>
        )}
      </button>

    </div>
  );
};

export default SettingsToggle;