// // import React, { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { useAuth } from "../../context/authContext";
// // import { motion } from "framer-motion";
// // import { 
// //   ShieldCheck, 
// //   Mail, 
// //   Calendar, 
// //   Phone, 
// //   Globe, 
// //   Edit,
// //   User,
// //   Activity,
// //   Key,
// //   Lock,
// //   Clock,
// //   LogOut,
// //   MapPin,
// //   ChevronRight,
// //   AlertTriangle
// // } from "lucide-react";
// // import moment from "moment";

// // const AdminProfile = () => {
// //   const { user } = useAuth();
// //   const navigate = useNavigate();
// //   const [isLoading, setIsLoading] = useState(true);

// //   // Simulate loading state for a polished feel
// //   useEffect(() => {
// //     const timer = setTimeout(() => setIsLoading(false), 600);
// //     return () => clearTimeout(timer);
// //   }, []);

// //   if (isLoading) {
// //     return (
// //       <main className="min-h-[calc(100vh-72px)] bg-slate-50/50 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
// //         <div className="mx-auto max-w-5xl animate-pulse space-y-6">
// //           <div className="h-64 w-full rounded-[24px] bg-slate-200/60"></div>
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //             <div className="h-80 rounded-[24px] bg-slate-200/60 md:col-span-2"></div>
// //             <div className="h-80 rounded-[24px] bg-slate-200/60"></div>
// //           </div>
// //         </div>
// //       </main>
// //     );
// //   }

// //   if (!user) {
// //     return (
// //       <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50/50 p-4">
// //         <div className="text-center">
// //           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
// //             <AlertTriangle className="h-8 w-8 text-red-600" />
// //           </div>
// //           <h2 className="text-xl font-semibold text-slate-900">Profile Not Found</h2>
// //           <p className="mt-2 text-sm text-slate-500">Could not load administrator details.</p>
// //         </div>
// //       </main>
// //     );
// //   }

// //   const createdAtFormatted = user.createdAt 
// //     ? moment(user.createdAt).format("MMMM DD, YYYY") 
// //     : "Recently";

// //   // Fallback styling helper
// //   const renderField = (value, fallback = "Not provided") => {
// //     if (value) return <span className="font-medium text-slate-900">{value}</span>;
// //     return <span className="font-medium italic text-slate-400">{fallback}</span>;
// //   };

// //   return (
// //     <main className="min-h-[calc(100vh-72px)] bg-slate-50/50 px-4 pb-12 pt-6 text-slate-900 sm:px-6 lg:px-8">
// //       <div className="mx-auto max-w-5xl space-y-6">
        
// //         {/* Page Header */}
// //         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// //           <div>
// //             <h1 className="text-2xl font-bold text-slate-900">Administrator Profile</h1>
// //             <p className="text-sm text-slate-500 mt-1">Manage your administrative account settings and preferences.</p>
// //           </div>
// //           <div className="flex items-center gap-3">
// //             <button 
// //               onClick={() => navigate("/updateProfile", { state: user })}
// //               className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
// //             >
// //               <Edit className="h-4 w-4" />
// //               Edit Profile
// //             </button>
// //           </div>
// //         </div>

// //         {/* Top Summary Card */}
// //         <motion.div
// //           initial={{ opacity: 0, y: 10 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           className="relative overflow-hidden rounded-[24px] border border-purple-200 bg-white shadow-sm"
// //         >
// //           {/* Decorative background */}
// //           <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-white opacity-50" />
// //           <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-purple-100/50 blur-3xl" />
          
// //           <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 sm:p-8">
// //             <div className="relative shrink-0 group">
// //               <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-md">
// //                 <div className="w-full h-full rounded-xl bg-white overflow-hidden p-0.5">
// //                   <img
// //                     className="w-full h-full rounded-lg object-cover"
// //                     src={
// //                       user?.img ||
// //                       `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=8b5cf6&color=fff&bold=true`
// //                     }
// //                     alt={user?.name || "Administrator"}
// //                     onError={(e) => {
// //                       e.target.onerror = null;
// //                       e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=8b5cf6&color=fff&bold=true`;
// //                     }}
// //                   />
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="flex-1 space-y-3">
// //               <div className="flex flex-wrap items-center gap-2 mb-1">
// //                 <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
// //                   <ShieldCheck className="h-3 w-3" />
// //                   Super Admin
// //                 </span>
// //                 <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
// //                   <Activity className="h-3 w-3" />
// //                   Active
// //                 </span>
// //               </div>
              
// //               <div>
// //                 <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
// //                   {user.name}
// //                 </h2>
// //                 <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
// //                   <Mail className="h-4 w-4" />
// //                   {user.email}
// //                 </p>
// //               </div>
// //             </div>
            
// //           </div>
// //         </motion.div>

// //         {/* Content Grid */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
// //           {/* Main Info Column */}
// //           <div className="md:col-span-2 space-y-6">
// //             <motion.div 
// //               initial={{ opacity: 0, y: 10 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: 0.1 }}
// //               className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
// //             >
// //               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
// //                 <User className="h-5 w-5 text-violet-500" />
// //                 Account Information
// //               </h3>
              
// //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
// //                 <div>
// //                   <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Full Name</label>
// //                   <div className="mt-1 flex items-center gap-2">
// //                     {renderField(user.name)}
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Username</label>
// //                   <div className="mt-1 flex items-center gap-2">
// //                     {renderField(user.username || `@${user.name.toLowerCase().replace(/\s/g, '')}`)}
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Phone Number</label>
// //                   <div className="mt-1 flex items-center gap-2">
// //                     <Phone className="h-4 w-4 text-slate-400" />
// //                     {renderField(user.mobile)}
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Country / Region</label>
// //                   <div className="mt-1 flex items-center gap-2">
// //                     <Globe className="h-4 w-4 text-slate-400" />
// //                     {renderField(user.country)}
// //                   </div>
// //                 </div>
// //                 <div className="sm:col-span-2 pt-4 mt-2 border-t border-slate-100">
// //                   <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Member Since</label>
// //                   <div className="mt-1 flex items-center gap-2">
// //                     <Calendar className="h-4 w-4 text-slate-400" />
// //                     {renderField(createdAtFormatted)}
// //                   </div>
// //                 </div>
// //               </div>
// //             </motion.div>

// //             <motion.div 
// //               initial={{ opacity: 0, y: 10 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: 0.2 }}
// //               className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
// //             >
// //               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
// //                 <Lock className="h-5 w-5 text-violet-500" />
// //                 Security & Access
// //               </h3>
              
// //               <div className="space-y-4">
// //                 <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
// //                   <div className="flex items-start gap-3">
// //                     <Key className="h-5 w-5 text-slate-400 mt-0.5" />
// //                     <div>
// //                       <h4 className="text-sm font-semibold text-slate-900">Account Password</h4>
// //                       <p className="text-xs text-slate-500 mt-0.5">Last changed 3 months ago</p>
// //                     </div>
// //                   </div>
// //                   <button className="text-sm font-semibold text-violet-600 hover:text-violet-700">Update</button>
// //                 </div>

// //                 <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
// //                   <div className="flex items-start gap-3">
// //                     <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
// //                     <div>
// //                       <h4 className="text-sm font-semibold text-slate-900">Two-Factor Authentication</h4>
// //                       <p className="text-xs text-slate-500 mt-0.5">Currently enabled via authenticator app</p>
// //                     </div>
// //                   </div>
// //                   <button className="text-sm font-semibold text-violet-600 hover:text-violet-700">Manage</button>
// //                 </div>
// //               </div>
// //             </motion.div>
// //           </div>

// //           {/* Sidebar Column */}
// //           <div className="space-y-6">
// //             <motion.div 
// //               initial={{ opacity: 0, y: 10 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: 0.3 }}
// //               className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
// //             >
// //               <h3 className="text-base font-semibold text-slate-900 mb-4">Admin Privileges</h3>
// //               <ul className="space-y-3">
// //                 {[
// //                   "Manage Users & Roles",
// //                   "View Analytics Dashboard",
// //                   "System Configurations",
// //                   "Content Moderation"
// //                 ].map((item, i) => (
// //                   <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
// //                     <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
// //                     {item}
// //                   </li>
// //                 ))}
// //               </ul>
// //             </motion.div>

// //             <motion.div 
// //               initial={{ opacity: 0, y: 10 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: 0.4 }}
// //               className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
// //             >
// //               <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
// //                 <Clock className="h-4 w-4 text-slate-400" />
// //                 Recent Activity
// //               </h3>
// //               <div className="space-y-4">
// //                 <div className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-slate-100 last:before:hidden">
// //                   <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
// //                     <MapPin className="h-3 w-3 text-slate-500" />
// //                   </div>
// //                   <div>
// //                     <p className="text-sm font-medium text-slate-900">Logged in via Chrome</p>
// //                     <p className="text-xs text-slate-500">Today at 10:24 AM</p>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-slate-100 last:before:hidden">
// //                   <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
// //                     <Edit className="h-3 w-3 text-slate-500" />
// //                   </div>
// //                   <div>
// //                     <p className="text-sm font-medium text-slate-900">Updated system settings</p>
// //                     <p className="text-xs text-slate-500">Yesterday at 4:12 PM</p>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-slate-100 last:before:hidden">
// //                   <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
// //                     <ShieldCheck className="h-3 w-3 text-slate-500" />
// //                   </div>
// //                   <div>
// //                     <p className="text-sm font-medium text-slate-900">Approved 12 new users</p>
// //                     <p className="text-xs text-slate-500">May 24, 2026</p>
// //                   </div>
// //                 </div>
// //               </div>
// //               <button className="mt-6 w-full flex items-center justify-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
// //                 View All Activity <ChevronRight className="h-4 w-4" />
// //               </button>
// //             </motion.div>
// //           </div>
          
// //         </div>
// //       </div>
// //     </main>
// //   );
// // };

// // export default AdminProfile;


// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/authContext";
// import { motion } from "framer-motion";
// import {
//   ShieldCheck, Mail, Calendar, Phone, Globe, Edit,
//   User, Activity, Key, Lock, Clock, MapPin,
//   ChevronRight, AlertTriangle
// } from "lucide-react";
// import moment from "moment";

// const AdminProfile = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const t = setTimeout(() => setIsLoading(false), 600);
//     return () => clearTimeout(t);
//   }, []);

//   if (isLoading) {
//     return (
//       <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
//         <div className="mx-auto max-w-4xl animate-pulse space-y-4">
//           <div className="h-8 w-48 rounded-lg bg-slate-200" />
//           <div className="h-36 w-full rounded-2xl bg-slate-200" />
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="h-64 rounded-2xl bg-slate-200 md:col-span-2" />
//             <div className="h-64 rounded-2xl bg-slate-200" />
//           </div>
//         </div>
//       </main>
//     );
//   }

//   if (!user) {
//     return (
//       <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
//         <div className="text-center">
//           <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
//             <AlertTriangle className="h-6 w-6 text-red-500" />
//           </div>
//           <h2 className="text-base font-semibold text-slate-900">Profile Not Found</h2>
//           <p className="mt-1 text-sm text-slate-500">Could not load administrator details.</p>
//         </div>
//       </main>
//     );
//   }

//   const createdAtFormatted = user.createdAt
//     ? moment(user.createdAt).format("MMM DD, YYYY")
//     : "Recently";

//   const renderField = (value, fallback = "Not provided") =>
//     value
//       ? <span className="text-[13px] font-medium text-slate-800">{value}</span>
//       : <span className="text-[13px] italic text-slate-400">{fallback}</span>;

//   const fade = (delay = 0) => ({
//     initial: { opacity: 0, y: 8 },
//     animate: { opacity: 1, y: 0 },
//     transition: { delay, duration: 0.2 },
//   });

//   return (
//     <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-4xl space-y-4">

//         {/* Page header */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div>
//             <h1 className="text-lg font-bold text-slate-900">Administrator Profile</h1>
//             <p className="text-xs text-slate-500 mt-0.5">Manage your admin account settings and preferences.</p>
//           </div>
//           <button
//             onClick={() => navigate("/updateProfile", { state: user })}
//             className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors self-start"
//           >
//             <Edit className="h-3.5 w-3.5" />
//             Edit Profile
//           </button>
//         </div>

//         {/* Hero card */}
//         <motion.div {...fade()} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//           <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-white pointer-events-none" />
//           <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-100/40 blur-2xl pointer-events-none" />

//           <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
//             {/* Avatar */}
//             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl p-[2px] bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-md shrink-0">
//               <div className="w-full h-full rounded-[10px] overflow-hidden bg-white">
//                 <img
//                   className="w-full h-full object-cover"
//                   src={user?.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=8b5cf6&color=fff&bold=true`}
//                   alt={user?.name}
//                   onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=8b5cf6&color=fff&bold=true`; }}
//                 />
//               </div>
//             </div>

//             {/* Info */}
//             <div className="flex-1 min-w-0">
//               <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
//                 <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
//                   <ShieldCheck className="h-2.5 w-2.5" /> Super Admin
//                 </span>
//                 <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
//                   <Activity className="h-2.5 w-2.5" /> Active
//                 </span>
//               </div>
//               <h2 className="text-lg font-bold text-slate-900 truncate">{user.name}</h2>
//               <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
//                 <Mail className="h-3 w-3" /> {user.email}
//               </p>
//             </div>
//           </div>
//         </motion.div>

//         {/* Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//           {/* Left — main info */}
//           <div className="md:col-span-2 space-y-4">

//             {/* Account info */}
//             <motion.div {...fade(0.05)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-4">
//                 <User className="h-4 w-4 text-violet-500" /> Account Information
//               </h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
//                 {[
//                   { label: "Full Name", value: user.name, icon: null },
//                   { label: "Username", value: user.username || `@${user.name.toLowerCase().replace(/\s/g, "")}`, icon: null },
//                   { label: "Phone", value: user.mobile, icon: <Phone className="h-3.5 w-3.5 text-slate-400" /> },
//                   { label: "Country", value: user.country, icon: <Globe className="h-3.5 w-3.5 text-slate-400" /> },
//                 ].map(({ label, value, icon }) => (
//                   <div key={label}>
//                     <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
//                     <div className="flex items-center gap-1.5">
//                       {icon}
//                       {renderField(value)}
//                     </div>
//                   </div>
//                 ))}
//                 <div className="sm:col-span-2 pt-3 mt-1 border-t border-slate-100">
//                   <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Member Since</p>
//                   <div className="flex items-center gap-1.5">
//                     <Calendar className="h-3.5 w-3.5 text-slate-400" />
//                     {renderField(createdAtFormatted)}
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Security */}
//             <motion.div {...fade(0.1)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-4">
//                 <Lock className="h-4 w-4 text-violet-500" /> Security & Access
//               </h3>
//               <div className="space-y-2">
//                 {[
//                   {
//                     icon: <Key className="h-4 w-4 text-slate-400" />,
//                     title: "Account Password",
//                     sub: "Last changed 3 months ago",
//                     action: "Update",
//                   },
//                   {
//                     icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
//                     title: "Two-Factor Authentication",
//                     sub: "Enabled via authenticator app",
//                     action: "Manage",
//                   },
//                 ].map(({ icon, title, sub, action }) => (
//                   <div key={title} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
//                     <div className="flex items-center gap-3">
//                       {icon}
//                       <div>
//                         <p className="text-[13px] font-semibold text-slate-800">{title}</p>
//                         <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
//                       </div>
//                     </div>
//                     <button className="text-[12px] font-semibold text-violet-600 hover:text-violet-700 transition-colors">
//                       {action}
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>

//           {/* Right sidebar */}
//           <div className="space-y-4">

//             {/* Privileges */}
//             <motion.div {...fade(0.15)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h3 className="text-sm font-semibold text-slate-900 mb-3">Admin Privileges</h3>
//               <ul className="space-y-2">
//                 {["Manage Users & Roles", "View Analytics Dashboard", "System Configurations", "Content Moderation"].map((item) => (
//                   <li key={item} className="flex items-center gap-2 text-[12px] text-slate-600">
//                     <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
//                     {item}
//                   </li>
//                 ))}
//               </ul>
//             </motion.div>

//             {/* Recent activity */}
//             <motion.div {...fade(0.2)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//               <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-1.5">
//                 <Clock className="h-3.5 w-3.5 text-slate-400" /> Recent Activity
//               </h3>
//               <div className="space-y-3">
//                 {[
//                   { icon: <MapPin className="h-3 w-3 text-slate-500" />, title: "Logged in via Chrome", time: "Today at 10:24 AM" },
//                   { icon: <Edit className="h-3 w-3 text-slate-500" />, title: "Updated system settings", time: "Yesterday at 4:12 PM" },
//                   { icon: <ShieldCheck className="h-3 w-3 text-slate-500" />, title: "Approved 12 new users", time: "May 24, 2026" },
//                 ].map(({ icon, title, time }, i, arr) => (
//                   <div key={i} className="flex items-start gap-2.5 relative">
//                     {i < arr.length - 1 && (
//                       <div className="absolute left-[11px] top-6 bottom-[-12px] w-px bg-slate-100" />
//                     )}
//                     <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 ring-2 ring-white mt-0.5">
//                       {icon}
//                     </div>
//                     <div>
//                       <p className="text-[12px] font-medium text-slate-800 leading-tight">{title}</p>
//                       <p className="text-[11px] text-slate-400 mt-0.5">{time}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <button className="mt-4 w-full flex items-center justify-center gap-1 text-[12px] font-medium text-violet-600 hover:text-violet-700 transition-colors">
//                 View All <ChevronRight className="h-3.5 w-3.5" />
//               </button>
//             </motion.div>

//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default AdminProfile;


// src/pages/admin/AdminProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Calendar,
  Phone,
  Globe,
  Edit,
  User,
  Activity,
  Key,
  Lock,
  Clock,
  MapPin,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import moment from "moment";

const AdminProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-36 w-full rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-64 rounded-2xl bg-slate-200 md:col-span-2" />
            <div className="h-64 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Profile Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Could not load administrator details.
          </p>
        </div>
      </main>
    );
  }

  const createdAtFormatted = user.createdAt
    ? moment(user.createdAt).format("MMM DD, YYYY")
    : "Recently";

  const renderField = (value, fallback = "Not provided") =>
    value ? (
      <span className="text-[13px] font-medium text-slate-800">{value}</span>
    ) : (
      <span className="text-[13px] italic text-slate-400">{fallback}</span>
    );

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.2 },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Administrator Profile</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage your admin account settings and preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/profile/edit", { state: user })}
            className="inline-flex self-start items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        </div>

        <motion.div
          {...fade()}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-white" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-100/40 blur-2xl" />

          <div className="relative flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[2px] shadow-md sm:h-20 sm:w-20">
              <div className="h-full w-full overflow-hidden rounded-[10px] bg-white">
                <img
                  className="h-full w-full object-cover"
                  src={
                    user?.img ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "Admin"
                    )}&background=8b5cf6&color=fff&bold=true`
                  }
                  alt={user?.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "Admin"
                    )}&background=8b5cf6&color=fff&bold=true`;
                  }}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Super Admin
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <Activity className="h-2.5 w-2.5" />
                  Active
                </span>
              </div>
              <h2 className="truncate text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <motion.div
              {...fade(0.05)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 text-violet-500" />
                Account Information
              </h3>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  { label: "Full Name", value: user.name, icon: null },
                  {
                    label: "Username",
                    value: user.username || `@${user.name.toLowerCase().replace(/\s/g, "")}`,
                    icon: null,
                  },
                  {
                    label: "Phone",
                    value: user.mobile,
                    icon: <Phone className="h-3.5 w-3.5 text-slate-400" />,
                  },
                  {
                    label: "Country",
                    value: user.country,
                    icon: <Globe className="h-3.5 w-3.5 text-slate-400" />,
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {icon}
                      {renderField(value)}
                    </div>
                  </div>
                ))}

                <div className="mt-1 border-t border-slate-100 pt-3 sm:col-span-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Member Since
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {renderField(createdAtFormatted)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fade(0.1)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Lock className="h-4 w-4 text-violet-500" />
                Security & Access
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">
                        Account Password
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Last changed 3 months ago
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/settings/security")}
                    className="text-[12px] font-semibold text-violet-600 transition-colors hover:text-violet-700"
                  >
                    Update
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">
                        Two-Factor Authentication
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Enabled via authenticator app
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/settings/security")}
                    className="text-[12px] font-semibold text-violet-600 transition-colors hover:text-violet-700"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              {...fade(0.15)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Admin Privileges
              </h3>
              <ul className="space-y-2">
                {[
                  "Manage Users & Roles",
                  "View Analytics Dashboard",
                  "System Configurations",
                  "Content Moderation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[12px] text-slate-600">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...fade(0.2)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Recent Activity
              </h3>

              <div className="space-y-3">
                {[
                  {
                    icon: <MapPin className="h-3 w-3 text-slate-500" />,
                    title: "Logged in via Chrome",
                    time: "Today at 10:24 AM",
                  },
                  {
                    icon: <Edit className="h-3 w-3 text-slate-500" />,
                    title: "Updated system settings",
                    time: "Yesterday at 4:12 PM",
                  },
                  {
                    icon: <ShieldCheck className="h-3 w-3 text-slate-500" />,
                    title: "Approved 12 new users",
                    time: "May 24, 2026",
                  },
                ].map(({ icon, title, time }, i, arr) => (
                  <div key={i} className="relative flex items-start gap-2.5">
                    {i < arr.length - 1 && (
                      <div className="absolute bottom-[-12px] left-[11px] top-6 w-px bg-slate-100" />
                    )}
                    <div className="z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium leading-tight text-slate-800">
                        {title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-1 text-[12px] font-medium text-violet-600 transition-colors hover:text-violet-700"
              >
                View All
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminProfile;