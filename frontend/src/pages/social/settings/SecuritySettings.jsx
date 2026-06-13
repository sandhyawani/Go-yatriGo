import { showToast } from "../../../utils/showToast";
// import React, { useEffect, useState, useRef } from 'react';
// import { Key, Activity, Monitor, LogOut, Shield, Eye, EyeOff, CheckCircle, AlertTriangle, Smartphone, Globe, ChevronRight } from 'lucide-react';
// import SettingsToggle from '../../../components/SettingsToggle';
// import axios from '../../../api/axios';
// import { showToast } from "../../../utils/showToast";

// const PasswordStrength = ({ password }) => {
//   const checks = [
//     { label: 'At least 8 characters', pass: password.length >= 8 },
//     { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
//     { label: 'Number', pass: /\d/.test(password) },
//     { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
//   ];
//   const score = checks.filter(c => c.pass).length;
//   const levels = [
//     { label: 'Weak', color: '#ef4444' },
//     { label: 'Fair', color: '#f97316' },
//     { label: 'Good', color: '#eab308' },
//     { label: 'Strong', color: '#22c55e' },
//   ];
//   const level = levels[Math.max(0, score - 1)];

//   if (!password) return null;

//   return (
//     <div style={{ marginTop: '8px' }}>
//       <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
//         {[1, 2, 3, 4].map(i => (
//           <div key={i} style={{
//             flex: 1, height: '3px', borderRadius: '2px',
//             background: i <= score ? level.color : '#e2e8f0',
//             transition: 'background 0.3s ease'
//           }} />
//         ))}
//       </div>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: '11px', fontWeight: 600, color: level.color }}>{level.label}</span>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           {checks.map(c => (
//             <span key={c.label} style={{
//               fontSize: '11px', color: c.pass ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px'
//             }}>
//               <span>{c.pass ? '✓' : '○'}</span> {c.label}
//             </span>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// const SessionCard = ({ session, onRevoke }) => {
//   const [confirming, setConfirming] = useState(false);

//   const getBrowserIcon = (browser = '') => {
//     if (browser.toLowerCase().includes('chrome')) return '🌐';
//     if (browser.toLowerCase().includes('safari')) return '🧭';
//     if (browser.toLowerCase().includes('firefox')) return '🦊';
//     return '💻';
//   };

//   const timeAgo = (date) => {
//     const diff = Date.now() - new Date(date).getTime();
//     const mins = Math.floor(diff / 60000);
//     if (mins < 1) return 'Just now';
//     if (mins < 60) return `${mins}m ago`;
//     const hrs = Math.floor(mins / 60);
//     if (hrs < 24) return `${hrs}h ago`;
//     return `${Math.floor(hrs / 24)}d ago`;
//   };

//   return (
//     <div style={{
//       display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//       padding: '14px 16px', borderRadius: '12px',
//       background: session.isCurrent ? '#f0fdf4' : '#f8fafc',
//       border: `1px solid ${session.isCurrent ? '#bbf7d0' : '#e2e8f0'}`,
//       transition: 'all 0.2s',
//     }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//         <div style={{
//           width: '38px', height: '38px', borderRadius: '10px',
//           background: session.isCurrent ? '#dcfce7' : '#f1f5f9',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           fontSize: '18px',
//         }}>
//           {getBrowserIcon(session.browser)}
//         </div>
//         <div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
//               {session.browser} on {session.os}
//             </span>
//             {session.isCurrent && (
//               <span style={{
//                 fontSize: '10px', fontWeight: 800, color: '#16a34a',
//                 background: '#dcfce7', padding: '2px 7px', borderRadius: '6px',
//                 letterSpacing: '0.05em', textTransform: 'uppercase'
//               }}>This device</span>
//             )}
//           </div>
//           <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
//               <Globe style={{ width: '11px', height: '11px' }} /> {session.location || 'Unknown location'}
//             </span>
//             <span style={{ fontSize: '12px', color: '#94a3b8' }}>
//               {timeAgo(session.lastActive)}
//             </span>
//           </div>
//         </div>
//       </div>
//       {!session.isCurrent && (
//         confirming ? (
//           <div style={{ display: 'flex', gap: '6px' }}>
//             <button
//               onClick={() => { onRevoke(session._id); setConfirming(false); }}
//               style={{
//                 fontSize: '12px', fontWeight: 700, color: '#fff',
//                 background: '#ef4444', border: 'none', borderRadius: '8px',
//                 padding: '5px 10px', cursor: 'pointer'
//               }}>Revoke</button>
//             <button
//               onClick={() => setConfirming(false)}
//               style={{
//                 fontSize: '12px', fontWeight: 600, color: '#64748b',
//                 background: '#f1f5f9', border: 'none', borderRadius: '8px',
//                 padding: '5px 10px', cursor: 'pointer'
//               }}>Cancel</button>
//           </div>
//         ) : (
//           <button
//             onClick={() => setConfirming(true)}
//             style={{
//               fontSize: '12px', fontWeight: 600, color: '#ef4444',
//               background: '#fff1f2', border: '1px solid #fecdd3',
//               borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
//               transition: 'all 0.15s'
//             }}>Revoke</button>
//         )
//       )}
//     </div>
//   );
// };

// const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
//   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
//     <div style={{
//       width: '36px', height: '36px', borderRadius: '10px',
//       background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
//     }}>
//       <Icon style={{ width: '17px', height: '17px', color: iconColor }} />
//     </div>
//     <div>
//       <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
//       {subtitle && <p style={{ fontSize: '12px', color: '#64748b', margin: 0, marginTop: '1px' }}>{subtitle}</p>}
//     </div>
//   </div>
// );

// const Card = ({ children, style = {} }) => (
//   <div style={{
//     background: '#ffffff',
//     borderRadius: '20px',
//     padding: '24px',
//     border: '1px solid #e2e8f0',
//     boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
//     ...style
//   }}>
//     {children}
//   </div>
// );

// const SecuritySettings = () => {
//   const [settings, setSettings] = useState(null);
//   const [sessions, setSessions] = useState([]);
//   const [oldPassword, setOldPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showOld, setShowOld] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [logoutConfirm, setLogoutConfirm] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [resSettings, resSessions] = await Promise.all([
//           axios.get('/settings', { withCredentials: true }),
//           axios.get('/settings/login-activity', { withCredentials: true })
//         ]);
//         setSettings(resSettings.data.data);
//         setSessions(resSessions.data.data);
//       } catch (err) {
//         console.error(err);
//         showToast.error('Failed to load security settings');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handlePasswordChange = async (e) => {
//     e.preventDefault();
//     if (newPassword.length < 6) return showToast.error('New password must be at least 6 characters');
//     if (newPassword !== confirmPassword) return showToast.error('Passwords do not match');
//     if (oldPassword === newPassword) return showToast.error('New password must differ from current password');

//     setIsUpdating(true);
//     try {
//       const res = await axios.put('/auth/change-password', { oldPassword, newPassword }, { withCredentials: true });
//       if (res.data.success) {
//         showToast.success('Password updated successfully');
//         setOldPassword('');
//         setNewPassword('');
//         setConfirmPassword('');
//       }
//     } catch (err) {
//       showToast.error(err.response?.data?.message || 'Failed to change password');
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleRevokeSession = async (sessionId) => {
//     try {
//       await axios.delete(`/settings/sessions/${sessionId}`, { withCredentials: true });
//       setSessions(prev => prev.filter(s => s._id !== sessionId));
//       showToast.success('Session revoked');
//     } catch {
//       showToast.error('Failed to revoke session');
//     }
//   };

//   const handleLogoutOtherDevices = async () => {
//     try {
//       await axios.post('/settings/logout-other-devices', {}, { withCredentials: true });
//       showToast.success('Logged out of all other devices');
//       setSessions(prev => prev.filter(s => s.isCurrent));
//       setLogoutConfirm(false);
//     } catch {
//       showToast.error('Failed to logout other devices');
//     }
//   };

//   const otherSessions = sessions.filter(s => !s.isCurrent);

//   if (loading) return (
//     <div style={{
//       minHeight: '100vh', background: '#f8fafc', paddingLeft: '250px', paddingTop: '0',
//       display: 'flex', alignItems: 'center', justifyContent: 'center'
//     }}>
//       <div style={{ textAlign: 'center' }}>
//         <div style={{
//           width: '36px', height: '36px', border: '3px solid #e2e8f0',
//           borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 12px',
//           animation: 'spin 0.8s linear infinite'
//         }} />
//         <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Loading security settings…</p>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     </div>
//   );

//   if (!settings) return null;

//   const inputStyle = {
//     width: '100%', padding: '10px 14px', borderRadius: '10px',
//     background: '#f8fafc', border: '1px solid #e2e8f0',
//     fontSize: '14px', color: '#1e293b', outline: 'none',
//     boxSizing: 'border-box',
//     transition: 'border-color 0.15s',
//   };

//   const labelStyle = {
//     display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
//     textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px'
//   };

//   return (
//     <div style={{
//       minHeight: '100vh', background: '#f8fafc',
//       paddingLeft: '250px', paddingTop: '0', paddingBottom: '80px'
//     }}
//       className="security-settings-page"
//     >
//       <style>{`
//         @media (max-width: 768px) {
//           .security-settings-page { padding-left: 0 !important; padding-top: 56px !important; }
//         }
//         .pw-input-wrap input:focus { border-color: #6366f1 !important; background: #fff !important; }
//         .submit-btn:hover:not(:disabled) { background: #4f46e5 !important; }
//         .submit-btn:active:not(:disabled) { transform: scale(0.99); }
//         .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
//         .logout-btn:hover { background: #fef2f2 !important; }
//       `}</style>

//       <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>

//         {/* Page title */}
//         <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
//           <div style={{
//             width: '42px', height: '42px', borderRadius: '12px',
//             background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center'
//           }}>
//             <Shield style={{ width: '20px', height: '20px', color: '#fff' }} />
//           </div>
//           <div>
//             <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Security</h1>
//             <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>
//               Manage your password, sessions, and authentication
//             </p>
//           </div>
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

//           {/* Change Password */}
//           <Card>
//             <SectionHeader
//               icon={Key}
//               iconBg="#ede9fe"
//               iconColor="#7c3aed"
//               title="Change password"
//               subtitle="Use a strong, unique password you don't use elsewhere"
//             />
//             <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//               {/* Current password */}
//               <div>
//                 <label style={labelStyle}>Current password</label>
//                 <div className="pw-input-wrap" style={{ position: 'relative' }}>
//                   <input
//                     type={showOld ? 'text' : 'password'}
//                     value={oldPassword}
//                     onChange={e => setOldPassword(e.target.value)}
//                     required
//                     placeholder="Enter current password"
//                     style={{ ...inputStyle, paddingRight: '42px' }}
//                   />
//                   <button type="button" onClick={() => setShowOld(!showOld)} style={{
//                     position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
//                     background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0
//                   }}>
//                     {showOld ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
//                   </button>
//                 </div>
//               </div>

//               {/* New password */}
//               <div>
//                 <label style={labelStyle}>New password</label>
//                 <div className="pw-input-wrap" style={{ position: 'relative' }}>
//                   <input
//                     type={showNew ? 'text' : 'password'}
//                     value={newPassword}
//                     onChange={e => setNewPassword(e.target.value)}
//                     required
//                     placeholder="Create a strong password"
//                     style={{ ...inputStyle, paddingRight: '42px' }}
//                   />
//                   <button type="button" onClick={() => setShowNew(!showNew)} style={{
//                     position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
//                     background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0
//                   }}>
//                     {showNew ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
//                   </button>
//                 </div>
//                 <PasswordStrength password={newPassword} />
//               </div>

//               {/* Confirm password */}
//               <div>
//                 <label style={labelStyle}>Confirm new password</label>
//                 <div style={{ position: 'relative' }}>
//                   <input
//                     type="password"
//                     value={confirmPassword}
//                     onChange={e => setConfirmPassword(e.target.value)}
//                     required
//                     placeholder="Re-enter new password"
//                     style={{
//                       ...inputStyle,
//                       borderColor: confirmPassword && confirmPassword !== newPassword ? '#fca5a5' : undefined,
//                     }}
//                   />
//                   {confirmPassword && (
//                     <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
//                       {confirmPassword === newPassword
//                         ? <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} />
//                         : <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
//                       }
//                     </div>
//                   )}
//                 </div>
//                 {confirmPassword && confirmPassword !== newPassword && (
//                   <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>
//                     Passwords do not match
//                   </p>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 disabled={isUpdating}
//                 className="submit-btn"
//                 style={{
//                   width: '100%', padding: '11px',
//                   background: '#6366f1', color: '#fff',
//                   fontWeight: 700, fontSize: '14px', border: 'none',
//                   borderRadius: '10px', cursor: 'pointer',
//                   transition: 'all 0.15s', marginTop: '4px'
//                 }}
//               >
//                 {isUpdating ? 'Updating password…' : 'Update password'}
//               </button>
//             </form>
//           </Card>

//           {/* 2FA */}
//           <Card>
//             <SectionHeader
//               icon={Smartphone}
//               iconBg="#fef3c7"
//               iconColor="#d97706"
//               title="Two-factor authentication"
//               subtitle="Require a second verification step when signing in"
//             />
//             <SettingsToggle
//               title="Enable 2FA"
//               description="Protect your account with an authenticator app or SMS code."
//               settingKey="twoFactorEnabled"
//               initialValue={settings.twoFactorEnabled}
//               endpoint="/settings/2fa"
//             />
//           </Card>

//           {/* Login Activity */}
//           <Card>
//             <SectionHeader
//               icon={Activity}
//               iconBg="#eff6ff"
//               iconColor="#2563eb"
//               title="Active sessions"
//               subtitle={`${sessions.length} device${sessions.length !== 1 ? 's' : ''} currently signed in`}
//             />

//             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//               {sessions.length === 0 ? (
//                 <div style={{
//                   padding: '24px', textAlign: 'center', color: '#94a3b8',
//                   fontSize: '13px', background: '#f8fafc', borderRadius: '12px'
//                 }}>No active sessions found</div>
//               ) : (
//                 sessions.map(session => (
//                   <SessionCard
//                     key={session._id}
//                     session={session}
//                     onRevoke={handleRevokeSession}
//                   />
//                 ))
//               )}
//             </div>

//             {otherSessions.length > 0 && (
//               <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
//                 {!logoutConfirm ? (
//                   <button
//                     onClick={() => setLogoutConfirm(true)}
//                     className="logout-btn"
//                     style={{
//                       width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
//                       gap: '8px', padding: '11px', fontSize: '13px', fontWeight: 700,
//                       color: '#ef4444', background: '#fff1f2',
//                       border: '1px solid #fecdd3', borderRadius: '10px',
//                       cursor: 'pointer', transition: 'background 0.15s'
//                     }}
//                   >
//                     <LogOut style={{ width: '15px', height: '15px' }} />
//                     Sign out of {otherSessions.length} other {otherSessions.length === 1 ? 'device' : 'devices'}
//                   </button>
//                 ) : (
//                   <div style={{
//                     background: '#fff1f2', border: '1px solid #fecdd3',
//                     borderRadius: '12px', padding: '14px 16px'
//                   }}>
//                     <p style={{ fontSize: '13px', color: '#7f1d1d', fontWeight: 600, margin: '0 0 12px' }}>
//                       Sign out of all other devices? This cannot be undone.
//                     </p>
//                     <div style={{ display: 'flex', gap: '8px' }}>
//                       <button
//                         onClick={handleLogoutOtherDevices}
//                         style={{
//                           flex: 1, padding: '9px', fontSize: '13px', fontWeight: 700,
//                           background: '#ef4444', color: '#fff', border: 'none',
//                           borderRadius: '8px', cursor: 'pointer'
//                         }}
//                       >Confirm sign out</button>
//                       <button
//                         onClick={() => setLogoutConfirm(false)}
//                         style={{
//                           flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600,
//                           background: '#fff', color: '#64748b', border: '1px solid #e2e8f0',
//                           borderRadius: '8px', cursor: 'pointer'
//                         }}
//                       >Cancel</button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </Card>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default SecuritySettings;


// src/pages/social/settings/SecuritySettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Key,
  Activity,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Globe,
  ArrowLeft,
  XCircle,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import SettingsToggle from "../../../components/SettingsToggle";
import axios from "../../../api/axios";

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((item) => item.pass).length;
  const levels = [
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f97316" },
    { label: "Good", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
  ];
  const level = levels[Math.max(0, score - 1)];

  if (!password) return null;

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: index <= score ? level.color : "#e2e8f0",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: level.color }}>
          {level.label}
        </span>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {checks.map((item) => (
            <span
              key={item.label}
              style={{
                fontSize: "11px",
                color: item.pass ? "#22c55e" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>{item.pass ? "✓" : "○"}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const parseUserAgent = (uaString) => {
  if (!uaString) return { browser: "Unknown", os: "Unknown" };
  const ua = uaString.toLowerCase();
  
  let browser = "Unknown Browser";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  let os = "Unknown OS";
  if (ua.includes("win")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { browser, os };
};

const SessionCard = ({ session, onRevoke }) => {
  const [confirming, setConfirming] = useState(false);

  const parsedUA = session.browser && session.browser.includes("Mozilla/") 
    ? parseUserAgent(session.browser) 
    : { browser: session.browser, os: session.os };

  const displayBrowser = parsedUA.browser || session.browser || "Unknown Browser";
  const displayOS = (session.os === "Unknown" || !session.os) ? parsedUA.os : session.os;

  const getBrowserIcon = (browserName = "") => {
    const value = browserName.toLowerCase();
    if (value.includes("chrome")) return "🌐";
    if (value.includes("safari")) return "🧭";
    if (value.includes("firefox")) return "🦊";
    return "💻";
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: session.isCurrent ? "#f0fdf4" : "#f8fafc",
        border: `1px solid ${session.isCurrent ? "#bbf7d0" : "#e2e8f0"}`,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: session.isCurrent ? "#dcfce7" : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          {getBrowserIcon(displayBrowser)}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              {displayBrowser} on {displayOS}
            </span>

            {session.isCurrent && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#16a34a",
                  background: "#dcfce7",
                  padding: "2px 7px",
                  borderRadius: "6px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                This device
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "2px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Globe style={{ width: "11px", height: "11px" }} />
              {session.location || "Unknown location"}
            </span>

            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {timeAgo(session.lastActive)}
            </span>
          </div>
        </div>
      </div>

      {!session.isCurrent &&
        (confirming ? (
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                onRevoke(session._id);
                setConfirming(false);
              }}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                background: "#ef4444",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Revoke
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#ef4444",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "5px 12px",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            Revoke
          </button>
        ))}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon style={{ width: "17px", height: "17px", color: iconColor }} />
    </div>
    <div>
      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
        {title}
      </h2>
      {subtitle ? (
        <p style={{ fontSize: "12px", color: "#64748b", margin: 0, marginTop: "1px" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#ffffff",
      borderRadius: "20px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

const SecuritySettings = () => {
  const location = useLocation();
  const isAdminMode = location.pathname.startsWith("/admin");
  const backPath = isAdminMode ? "/admin/profile" : "/settings";

  const pageMeta = useMemo(
    () =>
      isAdminMode
        ? {
            title: "Admin Security",
            subtitle: "Manage administrator password, sessions, and authentication",
            backLabel: "Back to Admin Profile",
          }
        : {
            title: "Security",
            subtitle: "Manage your password, sessions, and authentication",
            backLabel: "Back to Settings",
          },
    [isAdminMode]
  );

  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSettings, resSessions] = await Promise.all([
          axios.get("/settings", { withCredentials: true }),
          axios.get("/settings/login-activity", { withCredentials: true }),
        ]);

        setSettings(resSettings.data.data);
        setSessions(resSessions.data.data);
      } catch (error) {
        console.error(error);
        showToast.error("Failed to load security settings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      showToast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    if (oldPassword === newPassword) {
      showToast.error("New password must differ from current password");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await axios.put(
        "/auth/change-password",
        { oldPassword, newPassword },
        { withCredentials: true }
      );

      if (response.data.success) {
        showToast.success("Password updated successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.delete(`/settings/sessions/${sessionId}`, { withCredentials: true });
      setSessions((prev) => prev.filter((session) => session._id !== sessionId));
      showToast.success("Session revoked");
    } catch {
      showToast.error("Failed to revoke session");
    }
  };

  const handleLogoutOtherDevices = async () => {
    try {
      await axios.post("/settings/logout-other-devices", {}, { withCredentials: true });
      showToast.success("Logged out of all other devices");
      setSessions((prev) => prev.filter((session) => session.isCurrent));
      setLogoutConfirm(false);
    } catch {
      showToast.error("Failed to logout other devices");
    }
  };

  const otherSessions = sessions.filter((session) => !session.isCurrent);

  if (loading) {
    return (
      <div
        className="security-settings-page"
        style={{
          
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #e2e8f0",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
            Loading security settings…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#1e293b",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "6px",
  };

  return (
    <div
      className="security-settings-page"
      style={{
        
        background: "#f8fafc",
        paddingBottom: "80px",
      }}
    >
      <style>{`
        .pw-input-wrap input:focus { border-color: #6366f1 !important; background: #fff !important; }
        .submit-btn:hover:not(:disabled) { background: #4f46e5 !important; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .logout-btn:hover { background: #fef2f2 !important; }
      `}</style>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>
        <Link
          to={backPath}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "18px",
            fontSize: "12px",
            fontWeight: 800,
            color: "#64748b",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <ArrowLeft style={{ width: "15px", height: "15px" }} />
          {pageMeta.backLabel}
        </Link>

        <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {pageMeta.title}
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, marginTop: "2px" }}>
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card>
            <SectionHeader
              icon={Key}
              iconBg="#ede9fe"
              iconColor="#7c3aed"
              title="Change password"
              subtitle="Use a strong, unique password you don't use elsewhere"
            />

            <form
              onSubmit={handlePasswordChange}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={labelStyle}>Current password</label>
                <div className="pw-input-wrap" style={{ position: "relative" }}>
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    style={{ ...inputStyle, paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                    }}
                  >
                    {showOld ? (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>New password</label>
                <div className="pw-input-wrap" style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Create a strong password"
                    style={{ ...inputStyle, paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                    }}
                  >
                    {showNew ? (
                      <EyeOff style={{ width: "16px", height: "16px" }} />
                    ) : (
                      <Eye style={{ width: "16px", height: "16px" }} />
                    )}
                  </button>
                </div>

                <PasswordStrength password={newPassword} />
              </div>

              <div>
                <label style={labelStyle}>Confirm new password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    style={{
                      ...inputStyle,
                      borderColor:
                        confirmPassword && confirmPassword !== newPassword
                          ? "#fca5a5"
                          : undefined,
                    }}
                  />

                  {confirmPassword && (
                    <div
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      {confirmPassword === newPassword ? (
                        <CheckCircle style={{ width: "16px", height: "16px", color: "#22c55e" }} />
                      ) : (
                        <AlertTriangle style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                      )}
                    </div>
                  )}
                </div>

                {confirmPassword && confirmPassword !== newPassword && (
                  <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", fontWeight: 500 }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="submit-btn"
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "#6366f1",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginTop: "4px",
                }}
              >
                {isUpdating ? "Updating password…" : "Update password"}
              </button>
            </form>
          </Card>

          <Card>
            <SectionHeader
              icon={Smartphone}
              iconBg="#fef3c7"
              iconColor="#d97706"
              title="Two-factor authentication"
              subtitle="Require a second verification step when signing in"
            />

            <SettingsToggle
              title="Enable 2FA"
              description="Protect your account with an authenticator app or SMS code."
              settingKey="twoFactorEnabled"
              initialValue={settings.twoFactorEnabled}
              endpoint="/settings/2fa"
            />
          </Card>

          <Card>
            <SectionHeader
              icon={Activity}
              iconBg="#eff6ff"
              iconColor="#2563eb"
              title="Active sessions"
              subtitle={`${sessions.length} device${sessions.length !== 1 ? "s" : ""} currently signed in`}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sessions.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "13px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >
                  No active sessions found
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    onRevoke={handleRevokeSession}
                  />
                ))
              )}
            </div>

            {otherSessions.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                {!logoutConfirm ? (
                  <button
                    type="button"
                    onClick={() => setLogoutConfirm(true)}
                    className="logout-btn"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "11px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#ef4444",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    <LogOut style={{ width: "15px", height: "15px" }} />
                    Sign out of {otherSessions.length} other{" "}
                    {otherSessions.length === 1 ? "device" : "devices"}
                  </button>
                ) : (
                  <div
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "12px",
                      padding: "14px 16px",
                    }}
                  >
                    <p style={{ fontSize: "13px", color: "#7f1d1d", fontWeight: 600, margin: "0 0 12px" }}>
                      Sign out of all other devices? This cannot be undone.
                    </p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={handleLogoutOtherDevices}
                        style={{
                          flex: 1,
                          padding: "9px",
                          fontSize: "13px",
                          fontWeight: 700,
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        Confirm sign out
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoutConfirm(false)}
                        style={{
                          flex: 1,
                          padding: "9px",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: "#fff",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
