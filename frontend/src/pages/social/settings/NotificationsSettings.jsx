import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ArrowLeft } from "lucide-react";
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

  if (!settings) {
    return (
      <div className="p-8 text-center text-text-muted flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>);

  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 pt-14 lg:pt-4">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover border border-border-default text-text-primary text-sm font-semibold shadow-soft transition-all duration-200">

          <ArrowLeft className="w-4 h-4 text-brand" />
          <span>Back to Settings</span>
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-brand-50 p-3 text-brand">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-muted mt-1">
              Manage how and when you are notified
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-[var(--radius-card)] p-6 shadow-soft border border-border-default/60 space-y-2">
          <SettingsToggle
          title="Push Notifications"
          description="Receive push notifications on this device."
          settingKey="pushNotifications"
          initialValue={settings.pushNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Email Notifications"
          description="Receive emails for important updates and marketing."
          settingKey="emailNotifications"
          initialValue={settings.emailNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Messages"
          description="Receive alerts for new messages."
          settingKey="messageNotifications"
          initialValue={settings.messageNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Follow Requests"
          description="Get notified about new Follow requests."
          settingKey="connectionRequestNotifications"
          initialValue={settings.connectionRequestNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Journey Invitations"
          description="Receive alerts when someone invites you to a Journey."
          settingKey="journeyInviteNotifications"
          initialValue={settings.journeyInviteNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Journey Updates"
          description="Get notifications when changes are made to journeys you are on."
          settingKey="journeyUpdateNotifications"
          initialValue={settings.journeyUpdateNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Likes & Comments"
          description="Receive notifications for interactions on your travel memories."
          settingKey="likesCommentsNotifications"
          initialValue={settings.likesCommentsNotifications}
          endpoint="/settings" />

          <SettingsToggle
          title="Safety Check-in Reminders"
          description="Get check-in prompts and safety reminders during trips."
          settingKey="safetyReminderNotifications"
          initialValue={settings.safetyReminderNotifications}
          endpoint="/settings" />

        </div>
      </div>
    </div>);

};

export default NotificationsSettings;