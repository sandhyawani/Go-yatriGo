import { showToast } from "../utils/showToast";
import React, { useState, useEffect, useCallback, useId } from "react";
import { Loader2 } from "lucide-react";
import axios from "../api/axios";

const DEFAULT_ENDPOINT = "/settings";

const SettingsToggle = ({
  title,
  description,
  settingKey,
  initialValue = false,
  endpoint = DEFAULT_ENDPOINT
}) => {
  const [value, setValue] = useState(Boolean(initialValue));
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (!isLoading) {
      setValue(Boolean(initialValue));
    }
  }, [initialValue]);

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    if (!settingKey) {
      console.error(
      "[SettingsToggle] `settingKey` prop is required but was not provided."
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
      { withCredentials: true }
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80">
      <div className="pr-4">
        <span id={labelId} className="text-sm font-semibold text-[#1E293B]">
          {title ?? "Setting"}
        </span>
        {description && typeof description === "string" &&
        <p id={descId} className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            {description}
          </p>}

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
      "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7C3AED]",
      value ? "bg-[#7C3AED]" : "bg-[#E5E7EB]",
      isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"].
      join(" ")}>

        <span
        aria-hidden="true"
        className={[
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
        value ? "translate-x-5" : "translate-x-0"].
        join(" ")} />


        {isLoading &&
        <span className="absolute inset-0 flex items-center justify-center">
            <Loader2
          className="w-3.5 h-3.5 text-white animate-spin"
          aria-hidden="true" />

          </span>}

      </button>
    </div>);

};

export default SettingsToggle;