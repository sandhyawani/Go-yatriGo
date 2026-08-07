import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import SettingsToggle from '../../../components/SettingsToggle';
import axios from '../../../api/axios';

const PrivacySettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        const config = {
          withCredentials: true,
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
        };

        const res = await axios.get('/users/privacy-settings', config);
        if (res.data.success) {
          setSettings(res.data.privacySettings);
        }
      } catch (err) {
        console.error("Failed to load privacy settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
      </div>);

  }


  const currentSettings = settings || {
    privateAccount: false,
    allowStoryReplies: true,
    allowTravelGroupInvites: true,
    showOnlineStatus: true
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 pt-14 lg:pt-4">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#1E293B] text-sm font-semibold shadow-soft transition-all duration-200">

          <ArrowLeft className="w-4 h-4 text-brand-600" />
          <span>Back to Settings</span>
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-[#F3E8FF] p-3 text-[#7C3AED]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Privacy Settings</h1>
            <p className="text-sm text-[#64748B] mt-1">Manage who can see and interact with your account</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#E5E7EB]/60 space-y-3">
          <SettingsToggle
          title="Private Account"
          description="When your account is private, only approved Trip Mates can see your posts and stories."
          settingKey="privateAccount"
          initialValue={currentSettings.privateAccount}
          endpoint="/users/privacy-settings" />

          <SettingsToggle
          title="Allow Story Replies"
          description="Allow users to reply to your stories. If disabled, story interactions are hidden."
          settingKey="allowStoryReplies"
          initialValue={currentSettings.allowStoryReplies}
          endpoint="/users/privacy-settings" />

          <SettingsToggle
          title="Allow Travel Group Invites"
          description="Let other travelers invite you to join their travel groups."
          settingKey="allowTravelGroupInvites"
          initialValue={currentSettings.allowTravelGroupInvites}
          endpoint="/users/privacy-settings" />

          <SettingsToggle
          title="Show Online Status"
          description="Allow your Trip Mates to see when you are currently online."
          settingKey="showOnlineStatus"
          initialValue={currentSettings.showOnlineStatus}
          endpoint="/users/privacy-settings" />

        </div>
      </div>
    </div>);

};

export default PrivacySettings;