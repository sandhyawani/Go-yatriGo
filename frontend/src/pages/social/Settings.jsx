import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/authContext";
import { Shield, Lock, Activity, LogOut, AlertTriangle, User, Headphones, FileText, Bell, ChevronRight, X, Heart, Bookmark, EyeOff, MessageSquare, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SettingsRow from "../../components/SettingsRow";
import { showToast } from "../../utils/showToast";
import axios from "../../api/axios";

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
            <input type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="DELETE" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {isLoading ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Settings = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your account preferences</p>
        </div>

        {/* Grouped Sections */}
        <div className="space-y-8">
          
          {/* Section 1: Account */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">1. Account</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={User} title="Edit Profile" subtitle="Public travel identity" to="/updateProfile" colorClass="text-blue-500 bg-blue-50" />
              <SettingsRow icon={Lock} title="Change Password" subtitle="Update your password" to="/settings/security" colorClass="text-indigo-500 bg-indigo-50" />
              <SettingsRow icon={Activity} title="Login Activity" subtitle="Where you're logged in" to="/settings/security" colorClass="text-cyan-500 bg-cyan-50" />
            </div>
          </div>

          {/* Section 2: Privacy & Safety */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">2. Privacy & Safety</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={Shield} title="Privacy Settings" subtitle="Private account, online status, invites" to="/settings/privacy" colorClass="text-purple-500 bg-purple-50" />
              <SettingsRow icon={EyeOff} title="Blocked Users" subtitle="Manage blocked travelers" to="/blocked-users" colorClass="text-slate-500 bg-slate-100" />
            </div>
          </div>

          {/* Section 3: Content */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">3. Content</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={Bookmark} title="Saved Posts" subtitle="Your bookmarked memories" to="/saved" colorClass="text-emerald-500 bg-emerald-50" />
              <SettingsRow icon={Heart} title="Felt Vibes" subtitle="Collections of vibes you've felt" to="/felt-vibes" colorClass="text-pink-500 bg-pink-50" />
              <SettingsRow icon={Compass} title="My Travel Groups" subtitle="Groups you manage or joined" to="/social/buddy?filter=hosted" colorClass="text-amber-500 bg-amber-50" />
            </div>
          </div>

          {/* Section 4: Notifications */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">4. Notifications</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={Bell} title="Notification Settings" subtitle="Messages, stories, group invites" to="/settings/notifications" colorClass="text-brand-500 bg-brand-50" />
            </div>
          </div>

          {/* Section 5: Support */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">5. Support</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={Headphones} title="Help & Support" subtitle="Get help with your account" to="/help-support" colorClass="text-sky-500 bg-sky-50" />
              <SettingsRow icon={MessageSquare} title="Contact Us" subtitle="Reach out to our team" to="/contact" colorClass="text-indigo-500 bg-indigo-50" />
              <SettingsRow icon={AlertTriangle} title="Report a Problem" subtitle="Report bugs or issues" to="/report" colorClass="text-orange-500 bg-orange-50" />
            </div>
          </div>

          {/* Section 6: Account Management */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-2">6. Account Management</h2>
            <div className="bg-white rounded-3xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-1">
              <SettingsRow icon={LogOut} title="Log Out" onClick={handleLogout} colorClass="text-slate-500 bg-slate-50" />
              <SettingsRow icon={AlertTriangle} title="Deactivate Account" subtitle="Temporarily hide your profile" to="/settings/security" colorClass="text-rose-500 bg-rose-50" />
              <SettingsRow icon={AlertTriangle} title="Delete Account" subtitle="Permanently delete your data" onClick={() => setIsDeleteModalOpen(true)} danger colorClass="text-rose-500 bg-rose-50" />
            </div>
          </div>

        </div>

      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteAccount} 
      />
    </div>
  );
};

export default Settings;
