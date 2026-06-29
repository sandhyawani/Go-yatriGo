import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const navigation = [
  { label: "Overview", to: "/admin", end: true, Icon: LayoutDashboard },
  { label: "Verification Requests", to: "/admin/verifications", Icon: ShieldAlert, priority: true },
  { label: "Reports & Moderation", to: "/admin/reports", Icon: ShieldAlert },
  { label: "User Directory", to: "/users", Icon: Users },
  { label: "Contact Requests", to: "/admin/contacts", Icon: Mail },
  { label: "Create Operator", to: "/adduser", Icon: UserPlus },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-[1000] flex w-[240px] flex-col border-r border-purple-100 bg-white px-3 py-4 shadow-lg backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Admin navigation"
    >
      <div className="mb-4 flex items-center justify-between px-2">
        <Link to="/admin" onClick={onClose} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-purple-600">
              Go YatriGo
            </span>
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900">
              Admin Console
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-700 md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Workspace
      </div>
      <nav className="space-y-1">
        {navigation.map(({ label, to, end, Icon, priority }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-purple-50 text-purple-900 shadow-sm border border-purple-100"
                  : "text-slate-600 hover:bg-purple-50/50 hover:text-purple-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="admin-active-route"
                    className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-gradient-to-b from-purple-400 to-purple-600 shadow-sm"
                  />
                )}
                <Icon
                  className={`h-[18px] w-[18px] ${
                    isActive ? "text-purple-600" : "text-slate-400 group-hover:text-purple-500"
                  }`}
                />
                <span className="min-w-0 flex-1">{label}</span>
                {priority && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                    Priority
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-700">
          <Sparkles className="h-3.5 w-3.5" />
          Trust Center
        </div>
        <p className="text-sm font-medium leading-5 text-slate-900">Review safety reports first.</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Keep the community protected with fast moderation decisions.
        </p>
        <Link
          to="/admin/reports"
          onClick={onClose}
          className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 border border-purple-100 transition hover:bg-purple-50"
        >
          Open queue
          <ChevronRight className="h-4 w-4 text-purple-600" />
        </Link>
      </div>

      <div className="mt-auto border-t border-purple-100 pt-3">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white border border-purple-100 p-2.5">
          <img
            className="h-9 w-9 rounded-xl object-cover"
            src={
              user?.img ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=9333ea&color=fff`
            }
            alt=""
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name || "Administrator"}</p>
            <p className="text-[11px] text-slate-500">Administrator</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            App
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-label="Close navigation overlay"
          />
        )}
      </AnimatePresence>
      {sidebar}
    </>
  );
};

export default AdminSidebar;
