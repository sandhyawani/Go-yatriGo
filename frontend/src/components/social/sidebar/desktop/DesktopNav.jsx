import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { navItems } from "../constants/navItems";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";

const DesktopNav = () => {
  const location = useLocation();
  const { setIsSearchOpen, user, showNotifPanel, setShowNotifPanel } = useSidebar();
  const { unreadCount, handleMarkAllRead } = useNotifications(user);

  const navItemClass = (isActive) =>
    `relative flex items-center gap-3 py-3 transition-all duration-200 group w-full select-none text-sm font-semibold ${
      isActive
        ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600 rounded-r-2xl rounded-l-none pl-3 pr-4 shadow-sm"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium hover:-translate-y-0.5 px-4 rounded-2xl"
    }`;

  const iconClass = (isActive) =>
    `w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
      isActive ? "text-brand-700" : "text-slate-400 group-hover:text-brand-600"
    }`;

  return (
    <div className="flex flex-col gap-1">
      <Link to="/" className="flex items-center gap-3.5 px-3 py-2 mb-4 group">
        <div className="relative w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20 shrink-0 group-hover:-rotate-6 transition-all duration-300">
          <span className="relative z-10 text-white font-bold text-base tracking-tighter">
            GY
          </span>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
          Go YatriGo
        </span>
      </Link>

      {navItems.map((item, idx) => {
        const Icon = item.icon;
        if (item.isAction && item.action === "openSearch") {
          return (
            <button
              key={idx}
              onClick={() => setIsSearchOpen(true)}
              className={navItemClass(false)}
            >
              <Icon className={iconClass(false)} />
              {item.label}
            </button>
          );
        }

        const isActive = item.matchPrefix
          ? location.pathname.startsWith(item.path)
          : location.pathname === item.path;

        return (
          <Link key={idx} to={item.path} className={navItemClass(isActive)}>
            <Icon className={iconClass(isActive)} />
            {item.label}
          </Link>
        );
      })}

      <div className="relative w-full">
        <button
          onClick={() => {
            setShowNotifPanel((prev) => !prev);
            if (!showNotifPanel && unreadCount > 0) handleMarkAllRead();
          }}
          className={`bell-btn ${navItemClass(showNotifPanel)}`}
        >
          <ICONS.Bell className={iconClass(showNotifPanel)} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(DesktopNav);
