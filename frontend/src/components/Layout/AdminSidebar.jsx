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
      className={`fixed inset-y-0 left-0 z-[1000] flex w-[240px] flex-col border-r border-slate-100 bg-white px-3 py-4 shadow-sm transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Admin navigation"
    >
      <div className="mb-4 flex items-center justify-between px-2 flex-shrink-0">
        <Link to="/admin" onClick={onClose} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-brand-600">
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
          className="rounded-xl p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-700 md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 space-y-4 custom-scrollbar">
        <div>
          <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                      ? "bg-brand-50 text-brand-900 shadow-sm border border-brand-100"
                      : "text-slate-600 hover:bg-brand-50/50 hover:text-brand-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="admin-active-route"
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-gradient-to-b from-brand-400 to-brand-600 shadow-sm"
                      />
                    )}
                    <Icon
                      className={`h-[18px] w-[18px] ${
                        isActive ? "text-brand-600" : "text-slate-400 group-hover:text-brand-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1">{label}</span>
                    {priority && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-600">
                        Priority
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-3 flex-shrink-0">
        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User App
        </Link>
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

