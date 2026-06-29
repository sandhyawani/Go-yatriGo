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
                    onClick={() => navigate("/admin/settings/security?tab=password")}
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
                    onClick={() => navigate("/admin/settings/security?tab=2fa")}
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