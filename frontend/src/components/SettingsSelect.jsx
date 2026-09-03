import React, { useState, useEffect, useCallback, useId } from "react";
import { Loader2 } from "lucide-react";
import { showToast } from "../utils/showToast";
import axios from "../api/axios";
import CustomSelect from "./ui/CustomSelect";

const SettingsSelect = ({
  title,
  description,
  settingKey,
  initialValue = "",
  options = [],
  endpoint = "/settings"
}) => {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setValue(initialValue);
    }
  }, [initialValue, isLoading]);

  const handleChange = useCallback(async (e) => {
    const newValue = e.target.value;
    if (isLoading) return;

    if (!settingKey) {
      console.error("[SettingsSelect] `settingKey` prop is required but was not provided.");
      showToast.error("This setting is not configured correctly.");
      return;
    }

    setValue(newValue);
    setIsLoading(true);

    try {
      await axios.patch(
      endpoint,
      { [settingKey]: newValue },
      { withCredentials: true }
      );
      showToast.success("Setting updated successfully");
    } catch (err) {
      setValue(value);
      showToast.error("Failed to update setting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, settingKey, value, endpoint]);

  const uid = useId();
  const labelId = `${uid}-label`;
  const descId = `${uid}-desc`;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 relative">
      <div className="mr-4">
        <span id={labelId} className="text-sm font-semibold text-text-primary block">
          {title ?? "Setting"}
        </span>
        {description && typeof description === "string" &&
        <p id={descId} className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {description}
          </p>}

      </div>

      <div className="relative shrink-0 flex items-center gap-2">
        <div className="w-[180px]">
          <CustomSelect
            value={value}
            onChange={handleChange}
            options={options}
            disabled={isLoading}
            className="!text-xs"
          />
        </div>

        {isLoading &&
        <span className="absolute -right-6 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          </span>}

      </div>
    </div>);

};

export default SettingsSelect;