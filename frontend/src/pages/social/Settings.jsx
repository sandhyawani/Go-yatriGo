import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { Shield, Lock, Activity, LogOut, AlertTriangle, User, Headphones, X, Bookmark, EyeOff, Compass, Star } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-sm">
      <div className="bg-surface rounded-[var(--radius-card)] p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-secondary rounded-full hover:bg-background transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-text-primary">Delete Account?</h2>
          <p className="text-sm text-text-muted mt-2">
            This action cannot be undone. All your trips, messages, and data will be permanently removed.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Type DELETE to confirm</label>
            <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Current Password</label>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/50 backdrop-blur-sm">
      <div className="bg-surface rounded-[var(--radius-card)] p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-secondary rounded-full hover:bg-background transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-text-primary">Deactivate Account?</h2>
          <p className="text-sm text-text-muted mt-2">
            Your profile will be temporarily hidden. You can easily reactivate your account anytime simply by logging back in.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Current Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {isLoading ? "Deactivating..." : "Deactivate Account"}
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

  if (loading) {
    return (
      <div className="p-8 text-center text-text-muted flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
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
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account preferences</p>
        </div>

        <div className="space-y-10">
          
          <section>
            <h2 className="text-sm font-bold text-text-primary mb-4 px-2">Account</h2>
            <div className="flex flex-col gap-1">
              <SettingsRow icon={User} title="Edit Profile" subtitle="Public travel identity" to="/updateProfile" />
              
              {/* Email Display */}
              <div className="flex items-center justify-between p-4 rounded-xl hover transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text-primary">Email Address</span>
                  {fetchError && !user ?
                  <p className="text-xs text-rose-400 mt-0.5">Unable to load</p> :
                  <p className="text-xs text-text-muted mt-0.5">{user?.email || "No email address added"}</p>}
                </div>
                {user?.verifiedEmail &&
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">Verified</span>}
              </div>

              <SettingsRow icon={Lock} title="Change Password" subtitle="Update your password" to="/settings/security?tab=password" />
              <SettingsRow icon={Activity} title="Login Activity" subtitle="Where you're logged in" to="/settings/security?tab=sessions" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-primary mb-4 px-2">Privacy & Safety</h2>
            <div className="flex flex-col gap-1">
              <SettingsToggle
              title="Private Account"
              description="Only approved followers can see your travel memories and stories."
              settingKey="privateAccount"
              initialValue={currentPrivacy.privateAccount}
              endpoint="/users/privacy-settings" />

              <SettingsSelect
              title="Follow Requests"
              description="Choose who can send you Follow requests."
              settingKey="connectionRequests"
              initialValue={currentPrivacy.connectionRequests}
              endpoint="/users/privacy-settings"
              options={[
              { value: "everyone", label: "Everyone" },
              { value: "mates_only", label: "Trip Mates Only" }]} />

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

              <SettingsRow icon={EyeOff} title="Blocked Users" subtitle="Manage blocked travelers" to="/blocked-users" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-primary mb-4 px-2">Notifications</h2>
            <div className="flex flex-col gap-1">
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

              <div className="h-px bg-background my-2 mx-4" />
              
              <SettingsToggle
              title="Messages"
              description="Receive alerts for new messages."
              settingKey="messageNotifications"
              initialValue={currentSettings.messageNotifications}
              endpoint="/settings" />

              <SettingsToggle
              title="Follow Requests"
              description="Get notified about new Follow requests."
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
              description="Receive notifications for interactions on your travel memories."
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
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-primary mb-4 px-2">Travel & Safety</h2>
            <div className="flex flex-col gap-1">
              <SettingsRow icon={Shield} title="Emergency Contacts" subtitle="Manage your primary and secondary contacts" to="/emergency-contacts" />
              
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

              <SettingsRow icon={Compass} title="Travel Safety Guidelines" subtitle="Best practices for a safe and enjoyable trip" to="/settings/safety-guidelines" />
              
              <div className="h-px bg-background my-2 mx-4" />
              
              <SettingsRow icon={Star} title="Felt Vibes" subtitle="Your travel moments you've felt" to="/felt-vibes" />
              <SettingsRow icon={Bookmark} title="Saved Memories" subtitle="Travel memories you've saved for later" to="/saved" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-primary mb-4 px-2">Support</h2>
            <div className="flex flex-col gap-1">
              <SettingsRow icon={Headphones} title="Help & Support" subtitle="Get help with your account" to="/help-support" />
              <SettingsRow icon={AlertTriangle} title="Report a Problem" subtitle="Report bugs or issues" to="/report" />
              <SettingsRow icon={Shield} title="Community Guidelines" subtitle="Our rules for a safe community" to="/settings/community-guidelines" />
              <SettingsRow icon={Shield} title="Privacy Policy" subtitle="How we handle your data" to="/settings/legal/privacy" />
              <SettingsRow icon={Shield} title="Terms of Service" subtitle="Agreement and policies" to="/settings/legal/terms" />
            </div>
          </section>

          <section className="pt-6 border-t border-slate-200">
            <h2 className="text-sm font-bold text-rose-500 mb-4 px-2">Account Actions</h2>
            <div className="flex flex-col gap-2">
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-background text-text-primary text-sm font-bold transition-all duration-200">
                <span>Log Out</span>
                <LogOut className="w-5 h-5 text-text-muted" />
              </button>
              
              <button onClick={() => setIsDeactivateModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-bold transition-all duration-200">
                <span>Deactivate Account</span>
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </button>
              
              <button onClick={() => setIsDeleteModalOpen(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold transition-all duration-200">
                <span>Permanently Delete Account</span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </button>
            </div>
          </section>

        </div>

      </div>

      <DeactivateAccountModal
      isOpen={isDeactivateModalOpen}
      onClose={() => setIsDeactivateModalOpen(false)}
      onConfirm={handleDeactivateAccount} />

      <DeleteAccountModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDeleteAccount} />

    </div>);

};

export default Settings;