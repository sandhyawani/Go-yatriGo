import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { Shield, Lock, Activity, LogOut, AlertTriangle, User, Headphones, Bell, X, Sparkles, Bookmark, EyeOff, MessageSquare, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SettingsRow from "../../components/SettingsRow";
import { showToast } from "../../utils/showToast";
import axios from "../../api/axios";
import SettingsToggle from "../../components/SettingsToggle";
import SettingsSelect from "../../components/SettingsSelect";
const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typed !== "DELETE") {
      return showToast.error("Please type DELETE to confirm");
    }
    if (!password) {
      return showToast.error("Please enter your current password");
    }

    setIsLoading(true);
    await onConfirm(password);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Delete Account?</h2>
          <p className="text-sm text-slate-500 mt-2">
            This action cannot be undone. All your trips, messages, and data will be permanently removed.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type DELETE to confirm</label>
            <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {isLoading ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </form>
      </div>
    </div>);

};

const DeactivateAccountModal = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      return showToast.error("Please enter your current password");
    }

    setIsLoading(true);
    await onConfirm(password);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Deactivate Account?</h2>
          <p className="text-sm text-slate-500 mt-2">
            Your profile will be temporarily hidden. You can easily reactivate your account anytime simply by logging back in.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {isLoading ? "Deactivating..." : "Deactivate Account"}
          </button>
        </form>
      </div>
    </div>);

};

const PhoneEditModal = ({ isOpen, onClose, onSave, currentPhone }) => {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone || "");
      setError("");
    }
  }, [isOpen, currentPhone]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits !== "" && !/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setIsLoading(true);
    setError("");
    await onSave(digits);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black text-slate-800 mb-4">{currentPhone ? "Change Phone Number" : "Add Phone Number"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
            <input
            type="tel"
            value={phone}
            onChange={(e) => {setPhone(e.target.value);setError("");}}
            placeholder="10-digit mobile number"
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none"
            maxLength={15}
            autoFocus />

            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>);

};

const Settings = () => {
  const { logout, updateUser: updateAuthUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);


  const [user, setUser] = useState(null);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllSettings = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const currentUser = userStr ? JSON.parse(userStr) : null;

      const config = {
        withCredentials: true,
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      };

      const [userRes, privacyRes, settingsRes] = await Promise.all([
      axios.get(`/users/${currentUser?.id || currentUser?._id || "me"}`, config),
      axios.get("/users/privacy-settings", config),
      axios.get("/settings", { withCredentials: true })]
      );

      if (userRes.data.success) {
        setUser(userRes.data.user);
      } else {
        setFetchError(true);
      }
      if (privacyRes.data.success) {
        setPrivacySettings(privacyRes.data.privacySettings);
      }
      if (settingsRes.data.success) {
        setUserSettings(settingsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load settings data:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleDeactivateAccount = async (password) => {
    try {
      const res = await axios.post("/settings/deactivate-account", { password }, { withCredentials: true });
      if (res.data.success) {
        showToast.success("Account deactivated successfully. Log in anytime to reactivate.");
        await logout();
        navigate("/login");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to deactivate account");
    }
  };

  const handleDeleteAccount = async (password) => {
    try {
      const res = await axios.post("/settings/delete-account", { password }, { withCredentials: true });
      if (res.data.success) {
        showToast.success("Account deleted successfully");
        await logout();
        navigate("/login");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      showToast.error('Failed to logout');
    }
  };

  const handlePhoneSave = async (mobile) => {
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      showToast.error("Session expired. Please log in again.");
      return;
    }
    try {
      const res = await axios.put(`/users/${userId}`, { mobile }, {
        withCredentials: true,
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      if (res.data.success) {
        setUser((prev) => prev ? { ...prev, mobile } : prev);
        updateAuthUser({ mobile });
        showToast.success(mobile ? "Phone number updated" : "Phone number removed");
        setIsPhoneModalOpen(false);
      } else {
        showToast.error(res.data.message || "Failed to update phone number");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to update phone number");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
      </div>);

  }

  const currentPrivacy = privacySettings || {
    privateAccount: false,
    connectionRequests: "everyone",
    journeyInvites: "everyone",
    whoCanMessage: "everyone",
    showOnlineStatus: true,
    profileLocationVisibility: "mates_only"
  };

  const currentSettings = userSettings || {
    pushNotifications: true,
    emailNotifications: true,
    messageNotifications: true,
    connectionRequestNotifications: true,
    journeyInviteNotifications: true,
    journeyUpdateNotifications: true,
    likesCommentsNotifications: true,
    safetyCheckinReminders: true,
    emergencyLocationSharing: false,
    tripLocationSharing: false
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <div className="max-w-[900px] mx-auto p-4 md:p-8 space-y-6">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E293B]">Settings</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage your account preferences</p>
        </div>

        {}
        <div className="space-y-8">
          
          {}
          <div>
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 px-2">1. Account</h2>
            <div className="bg-white rounded-3xl p-3 shadow-soft border border-[#E5E7EB]/60 flex flex-col gap-2">
              <SettingsRow icon={User} title="Edit Profile" subtitle="Public travel identity" to="/updateProfile" colorClass="text-[#3B82F6] bg-[#DBEAFE]" />
              
              {}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1E293B]">Email</span>
                  {fetchError && !user ?
                  <p className="text-xs text-rose-400 mt-0.5">Unable to load</p> :

                  <p className="text-xs text-[#64748B] mt-0.5">{user?.email || "No email address added"}</p>}

                </div>
                {user?.verifiedEmail &&
                <span className="bg-[#DCFCE7] text-[#22C55E] px-3 py-1 rounded-full text-xs font-semibold border border-[#22C55E]/20">✓ Verified</span>}

              </div>

              {}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1E293B]">Phone</span>
                  {fetchError && !user ?
                  <p className="text-xs text-rose-400 mt-0.5">Unable to load</p> :

                  <p className="text-xs text-[#64748B] mt-0.5">{user?.mobile || "No phone number added"}</p>}

                </div>
                {!fetchError && user &&
                <button onClick={() => setIsPhoneModalOpen(true)} className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] px-3 py-1 rounded-full text-xs font-semibold border border-[#7C3AED]/20 transition-all duration-200">
                    {user?.mobile ? "Change" : "Add Phone"}
                  </button>}

              </div>

              <SettingsRow icon={Lock} title="Change Password" subtitle="Update your password" to="/settings/security?tab=password" colorClass="text-[#7C3AED] bg-[#F3E8FF]" />
              <SettingsRow icon={Activity} title="Login Activity" subtitle="Where you're logged in" to="/settings/security?tab=sessions" colorClass="text-[#06B6D4] bg-[#ECFEFF]" />
            </div>
          </div>

          {}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">2. Privacy & Safety</h2>
            <div className="bg-white rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-2">
              <SettingsToggle
              title="Private Account"
              description="When your account is private, only approved Trip Mates can see your posts and stories."
              settingKey="privateAccount"
              initialValue={currentPrivacy.privateAccount}
              endpoint="/users/privacy-settings" />

              <SettingsSelect
              title="Connection Requests"
              description="Choose who can send you Trip Mate requests."
              settingKey="connectionRequests"
              initialValue={currentPrivacy.connectionRequests}
              endpoint="/users/privacy-settings"
              options={[
              { value: "everyone", label: "Everyone" },
              { value: "mates_only", label: "Mates of Mates Only" }]} />


              <SettingsSelect
              title="Journey Invitations"
              description="Control who is allowed to invite you to new Journeys."
              settingKey="journeyInvites"
              initialValue={currentPrivacy.journeyInvites}
              endpoint="/users/privacy-settings"
              options={[
              { value: "everyone", label: "Everyone" },
              { value: "mates_only", label: "Trip Mates Only" },
              { value: "none", label: "No One" }]} />


              <SettingsSelect
              title="Direct Messaging"
              description="Limit who can open direct chat rooms with you."
              settingKey="whoCanMessage"
              initialValue={currentPrivacy.whoCanMessage}
              endpoint="/users/privacy-settings"
              options={[
              { value: "everyone", label: "Everyone" },
              { value: "mates_only", label: "Trip Mates Only" },
              { value: "none", label: "No One" }]} />


              <SettingsToggle
              title="Show Online Status"
              description="Allow your Trip Mates to see when you are currently online."
              settingKey="showOnlineStatus"
              initialValue={currentPrivacy.showOnlineStatus}
              endpoint="/users/privacy-settings" />

              <SettingsSelect
              title="Profile Location Visibility"
              description="Control who can see your city and state on your public profile page."
              settingKey="profileLocationVisibility"
              initialValue={currentPrivacy.profileLocationVisibility}
              endpoint="/users/privacy-settings"
              options={[
              { value: "everyone", label: "Everyone" },
              { value: "mates_only", label: "Trip Mates Only" },
              { value: "none", label: "No One" }]} />


              <SettingsRow icon={EyeOff} title="Blocked Users" subtitle="Manage blocked travelers" to="/blocked-users" colorClass="text-slate-500 bg-slate-100" />
            </div>
          </div>

          {}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">3. Notifications</h2>
            <div className="bg-white rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-2">
              <SettingsToggle
              title="Push Notifications"
              description="Receive push notifications on this device."
              settingKey="pushNotifications"
              initialValue={currentSettings.pushNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Email Notifications"
              description="Receive emails for important updates and marketing."
              settingKey="emailNotifications"
              initialValue={currentSettings.emailNotifications}
              endpoint="/settings" />

              <div className="h-px bg-slate-100 my-2 mx-4" />
              <SettingsToggle
              title="Messages"
              description="Receive alerts for new messages."
              settingKey="messageNotifications"
              initialValue={currentSettings.messageNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Connection Requests"
              description="Get notified about new Trip Mate requests."
              settingKey="connectionRequestNotifications"
              initialValue={currentSettings.connectionRequestNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Journey Invitations"
              description="Receive alerts when someone invites you to a Journey."
              settingKey="journeyInviteNotifications"
              initialValue={currentSettings.journeyInviteNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Journey Updates"
              description="Get notifications when changes are made to journeys you are on."
              settingKey="journeyUpdateNotifications"
              initialValue={currentSettings.journeyUpdateNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Likes & Comments"
              description="Receive notifications for interactions on your memories and posts."
              settingKey="likesCommentsNotifications"
              initialValue={currentSettings.likesCommentsNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Safety Check-in Reminders"
              description="Get check-in prompts and safety reminders during trips."
              settingKey="safetyReminderNotifications"
              initialValue={currentSettings.safetyReminderNotifications}
              endpoint="/settings" />

            </div>
          </div>

          {}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">4. Journey & Safety</h2>
            <div className="bg-white rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-2">
              <SettingsRow icon={Shield} title="Emergency Contacts" subtitle="Manage your primary and secondary contacts" to="/emergency-contacts" colorClass="text-red-500 bg-red-50" />
              <SettingsToggle
              title="Safety Check-in Reminders"
              description="Enable prompts to check in on active journeys to assure your safety."
              settingKey="safetyCheckinReminders"
              initialValue={currentSettings.safetyCheckinReminders}
              endpoint="/settings" />

              <SettingsToggle
              title="Emergency Location Sharing"
              description="Automatically share your location with emergency contacts when SOS is triggered."
              settingKey="emergencyLocationSharing"
              initialValue={currentSettings.emergencyLocationSharing}
              endpoint="/settings" />

              <SettingsToggle
              title="Trip Location Sharing"
              description="Share your live location during active trips with trusted buddies."
              settingKey="tripLocationSharing"
              initialValue={currentSettings.tripLocationSharing}
              endpoint="/settings" />

              <SettingsRow icon={Compass} title="Travel Safety Guidelines" subtitle="Best practices for a safe and enjoyable trip" to="/settings/safety-guidelines" colorClass="text-brand-500 bg-brand-50" />
            </div>
          </div>

          {}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">5. Support & Legal</h2>
            <div className="bg-white rounded-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-2">
              <SettingsRow icon={Headphones} title="Help & Support" subtitle="Get help with your account" to="/help-support" colorClass="text-sky-500 bg-sky-50" />
              <SettingsRow icon={AlertTriangle} title="Report a Problem" subtitle="Report bugs or issues" to="/report" colorClass="text-orange-500 bg-orange-50" />
              <SettingsRow icon={Shield} title="Community Guidelines" subtitle="Our rules for a safe community" to="/settings/community-guidelines" colorClass="text-emerald-500 bg-emerald-50" />
              <SettingsRow icon={Shield} title="Privacy Policy" subtitle="How we handle your data" to="/settings/legal/privacy" colorClass="text-blue-500 bg-blue-50" />
              <SettingsRow icon={Shield} title="Terms of Service" subtitle="Agreement and policies" to="/settings/legal/terms" colorClass="text-slate-500 bg-slate-50" />
            </div>
          </div>

          {}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 px-2">6. Account Actions</h2>
            <div className="flex flex-col gap-2">
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#1E293B] text-sm font-semibold transition-all duration-200 shadow-soft">
                <span>Log Out</span>
                <LogOut className="w-5 h-5 text-[#64748B]" />
              </button>
              <button onClick={() => setIsDeactivateModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-[#F59E0B]/20 hover:bg-[#FEF3C7]/30 text-[#D97706] text-sm font-semibold transition-all duration-200 shadow-soft">
                <span>Deactivate Account</span>
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              </button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#EF4444]/20 text-[#EF4444] text-sm font-semibold transition-all duration-200 shadow-soft mt-2">
                <span>Delete Account</span>
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </button>
            </div>
          </div>

        </div>

      </div>

      <DeactivateAccountModal
      isOpen={isDeactivateModalOpen}
      onClose={() => setIsDeactivateModalOpen(false)}
      onConfirm={handleDeactivateAccount} />

      <PhoneEditModal
      isOpen={isPhoneModalOpen}
      onClose={() => setIsPhoneModalOpen(false)}
      onSave={handlePhoneSave}
      currentPhone={user?.mobile || ""} />

      <DeleteAccountModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDeleteAccount} />

    </div>);

};

export default Settings;