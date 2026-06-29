/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, jsx-a11y/alt-text, jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import SettingsToggle from "../../../components/SettingsToggle";
import axios from "../../../api/axios";

const NotificationsSettings = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/settings", { withCredentials: true });
        setSettings(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  if (!settings)
    return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage how and when you are notified
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-2">
          <SettingsToggle
            title="Push Notifications"
            description="Receive push notifications on this device."
            settingKey="pushNotifications"
            initialValue={settings.pushNotifications}
            endpoint="/settings"
          />
          <SettingsToggle
            title="Email Notifications"
            description="Receive emails for important updates and marketing."
            settingKey="emailNotifications"
            initialValue={settings.emailNotifications}
            endpoint="/settings"
          />
          <SettingsToggle
            title="Trip Alerts"
            description="Get notified about trip updates and travel buddy activities."
            settingKey="tripAlerts"
            initialValue={settings.tripAlerts}
            endpoint="/settings"
          />
          <SettingsToggle
            title="Message Notifications"
            description="Receive alerts for new direct messages."
            settingKey="messageNotifications"
            initialValue={settings.messageNotifications}
            endpoint="/settings"
          />
          <SettingsToggle
            title="Follow & Activity"
            description="Get notified when someone follows you or likes your posts."
            settingKey="followActivityNotifications"
            initialValue={settings.followActivityNotifications}
            endpoint="/settings"
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
