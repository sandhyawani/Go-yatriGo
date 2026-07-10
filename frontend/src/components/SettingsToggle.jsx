import { showToast } from "../utils/showToast";
import React, { useState, useEffect, useCallback, useId } from "react";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import axios from "../api/axios";

const DEFAULT_ENDPOINT = "/settings";

const SettingsToggle = ({
  title,
  description,
  settingKey,
  initialValue = false,
  endpoint = DEFAULT_ENDPOINT,
}) => {
  const [value, setValue] = useState(Boolean(initialValue));
  const [isLoading, setIsLoading] = useState(false);

  // Avoid replacing an optimistic update while the request is pending.
  useEffect(() => {
    if (!isLoading) {
      setValue(Boolean(initialValue));
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    if (!settingKey) {
      console.error(
        "[SettingsToggle] `settingKey` prop is required but was not provided.",
      );
      showToast.error("This setting is not configured correctly.");
      return;
    }

    const newValue = !value;
    setValue(newValue);
    setIsLoading(true);

    try {
      await axios.patch(
        endpoint,
        { [settingKey]: newValue },
        { withCredentials: true },
      );
    } catch {
      setValue(!newValue);
      showToast.error("Failed to update setting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, settingKey, value, endpoint]);

  const uid = useId();
  const labelId = `${uid}-label`;
  const descId = `${uid}-desc`;

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
      <div>
        <span id={labelId} className="text-sm font-bold text-slate-700">
          {title ?? "Setting"}
        </span>
        {description && typeof description === "string" && (
          <p id={descId} className="text-xs text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>

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
          "relative w-8 h-8 flex items-center justify-center rounded transition-opacity",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
          isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        {value ? (
          <ToggleRight className="w-8 h-8 text-blue-500" aria-hidden="true" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-slate-400" aria-hidden="true" />
        )}

        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-slate-50/70 rounded">
            <Loader2
              className="w-5 h-5 text-slate-400 animate-spin"
              aria-hidden="true"
            />
          </span>
        )}
      </button>
    </div>
  );
};

export default SettingsToggle;

