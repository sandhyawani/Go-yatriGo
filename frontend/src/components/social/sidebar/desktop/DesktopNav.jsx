import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { navItems } from "../constants/navItems";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";
import { Compass } from "lucide-react";
import CreateDropdown from "./CreateDropdown";

const DesktopNav = () => {
  const location = useLocation();
  const { setIsSearchOpen, showNotifPanel, setShowNotifPanel } = useSidebar();
  const { unreadCount } = useNotifications();

  // Keyboard shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  const navItemClass = (isActive) =>
    `relative flex items-center gap-3 py-2.5 px-3 transition-all duration-200 group w-full select-none text-[13.5px] rounded-xl cursor-pointer ${
      isActive
        ? "bg-white/95 text-brand font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)] border border-slate-200/60"
        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
    }`;

  const iconClass = (isActive) =>
    `w-[19px] h-[19px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
      isActive ? "text-brand" : "text-slate-400 group-hover:text-slate-700"
    }`;

  return (
    <div className="flex flex-col gap-1 font-sans">
      {/* Brand Logo Header */}
      <Link
        to="/"
        className="flex items-center gap-3 px-2 py-2 mb-1 group rounded-2xl transition-colors"
      >
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-brand to-brand-dark flex items-center justify-center shadow-md shadow-brand/20 shrink-0 group-hover:scale-105 transition-all duration-300">
          <Compass className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-extrabold tracking-tight text-slate-900 truncate font-heading leading-tight group-hover:text-brand transition-colors">
            Go YatriGo
          </span>
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-brand leading-none mt-0.5">
            Social Travel
          </span>
        </div>
      </Link>

      {/* Nav Items with Create in the middle */}
      <div className="flex flex-col gap-1 pt-0.5">
        {/* First Half: Home, Explore, Search */}
        {navItems.slice(0, 3).map((item, idx) => {
          const Icon = item.icon;

          if (item.isAction && item.action === "openSearch") {
            return (
              <button
                key={idx}
                onClick={() => setIsSearchOpen(true)}
                className={navItemClass(false)}
              >
                <Icon className={iconClass(false)} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          }

          const isActive = item.matchPrefix
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;

          return (
            <Link key={idx} to={item.path} data-tour={item.tourId} className={navItemClass(isActive)}>
              <Icon className={iconClass(isActive)} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}

        {/* Create Action in the middle of other options */}
        <div className="w-full">
          <CreateDropdown />
        </div>

        {/* Second Half: Journey Hub, Chat */}
        {navItems.slice(3).map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.matchPrefix
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path;

          return (
            <Link key={`bottom-${idx}`} to={item.path} data-tour={item.tourId} className={navItemClass(isActive)}>
              <Icon className={iconClass(isActive)} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}

        {/* Notifications Nav Item */}
        <div className="relative w-full">
          <button
            onClick={() => setShowNotifPanel((prev) => !prev)}
            className={`bell-btn ${navItemClass(showNotifPanel)}`}
            aria-label="Notifications"
          >
            <ICONS.Bell className={iconClass(showNotifPanel)} />
            <span className="flex-1 text-left">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full shrink-0 shadow-2xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {showNotifPanel && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


export default React.memo(DesktopNav);


