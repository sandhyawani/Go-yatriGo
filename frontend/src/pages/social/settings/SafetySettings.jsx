import React, { useEffect, useState } from 'react';
import { ShieldAlert, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SettingsToggle from '../../../components/SettingsToggle';
import axios from '../../../api/axios';

const SafetySettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/settings', { withCredentials: true });
        setSettings(res.data.data);
      } catch (err) {
        setError('Failed to load safety settings. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 pt-14 lg:pt-4">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#1E293B] text-sm font-semibold shadow-soft transition-all duration-200">

          <ArrowLeft className="w-4 h-4 text-[#7C3AED]" />
          <span>Back to Settings</span>
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-[#F3E8FF] p-3 text-[#7C3AED]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Safety & Emergency</h1>
            <p className="text-sm text-[#64748B] mt-1">Manage SOS alerts and location sharing</p>
          </div>
        </div>

        {error &&
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>}


        {loading ?
        <div className="p-8 text-center text-slate-500 flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
          </div> :
        settings ?
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#E5E7EB]/60 space-y-2">
            <SettingsToggle
          title="Safety Check-in Reminders"
          description="Get safety check-in prompts during active journeys."
          settingKey="safetyCheckinReminders"
          initialValue={settings.safetyCheckinReminders}
          endpoint="/settings" />

            <SettingsToggle
          title="Emergency Location Sharing"
          description="Automatically share your location with emergency contacts when SOS is triggered."
          settingKey="emergencyLocationSharing"
          initialValue={settings.emergencyLocationSharing}
          endpoint="/settings" />

            <SettingsToggle
          title="Trip Location Sharing"
          description="Share your live location during active trips with trusted buddies."
          settingKey="tripLocationSharing"
          initialValue={settings.tripLocationSharing}
          endpoint="/settings" />

          </div> :
        null}

        <div className="mt-8">
          <h3 className="text-xs font-bold text-[#64748B] mb-3 ml-2 uppercase tracking-wider">Resources</h3>
          <Link to="/settings/safety-guidelines" className="bg-white rounded-3xl p-6 shadow-soft border border-[#E5E7EB]/60 flex items-center justify-between group hover:border-[#7C3AED]/30 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#7C3AED] group-hover:bg-[#E9D5FF] transition-colors duration-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#1E293B] text-base">Travel Safety Guidelines</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Read our best practices for safe travel</p>
              </div>
            </div>
            <div className="text-[#7C3AED] font-semibold text-xs bg-[#F3E8FF] px-3 py-1.5 rounded-xl group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-200">
              View
            </div>
          </Link>
        </div>

      </div>
    </div>);

};

export default SafetySettings;