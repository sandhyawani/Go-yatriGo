import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { navItems } from "../constants/navItems";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";

const DesktopNav = () => {
  const location = useLocation();
  const { setIsSearchOpen, user, showNotifPanel, setShowNotifPanel } = useSidebar();
  const { unreadCount } = useNotifications();

  const navItemClass = (isActive) =>
    `relative flex items-center gap-3 py-2.5 transition-all duration-200 group w-full select-none text-[15px] ${
      isActive
        ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600 rounded-r-xl rounded-l-none pl-3 pr-3.5 shadow-xs font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium hover:-translate-y-0.5 px-3.5 rounded-xl"
    }`;

  const iconClass = (isActive) =>
    `w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
      isActive ? "text-brand-700" : "text-slate-400 group-hover:text-brand-600"
    }`;

  return (
    <div className="flex flex-col gap-0.5 font-sans">
      <Link to="/" className="flex items-center gap-3 px-2.5 py-1.5 mb-2 group">
        <div className="relative w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20 shrink-0 group-hover:-rotate-6 transition-all duration-300">
          <span className="relative z-10 text-white font-bold text-sm tracking-tighter">
            GY
          </span>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 truncate font-heading">
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
          onClick={() => setShowNotifPanel((prev) => !prev)}
          className={`bell-btn ${navItemClass(showNotifPanel)}`}
          aria-label="Notifications"
        >
          <ICONS.Bell className={iconClass(showNotifPanel)} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full shrink-0 animate-pulse shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(DesktopNav);
