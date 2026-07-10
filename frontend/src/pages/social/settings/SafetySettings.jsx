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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-brand-600" />
          <span>Back to Settings</span>
        </Link>
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-500" />
            Safety & Emergency
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage SOS alerts and location sharing</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500 mx-auto"></div>
          </div>
        ) : settings ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-2">
            <SettingsToggle 
              title="Enable SOS Feature" 
              description="Allow quick access to emergency alerts in the app."
              settingKey="sosEnabled"
              initialValue={settings.sosEnabled}
              endpoint="/settings"
            />
            <SettingsToggle 
              title="Emergency Location Sharing" 
              description="Automatically share your location with emergency contacts when SOS is triggered."
              settingKey="emergencyLocationSharing"
              initialValue={settings.emergencyLocationSharing}
              endpoint="/settings"
            />
            <SettingsToggle 
              title="Trip Location Sharing" 
              description="Share your live location during active trips with trusted buddies."
              settingKey="tripLocationSharing"
              initialValue={settings.tripLocationSharing}
              endpoint="/settings"
            />
          </div>
        ) : null}

        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3 ml-2 uppercase tracking-wider">Resources</h3>
          <Link to="/settings/safety-guidelines" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-brand-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Travel Safety Guidelines</h4>
                <p className="text-xs text-slate-500 mt-0.5">Read our best practices for safe travel</p>
              </div>
            </div>
            <div className="text-brand-500 font-bold text-sm bg-brand-50 px-3 py-1 rounded-lg">View</div>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default SafetySettings;

