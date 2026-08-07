import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";

const MobileTopHeader = () => {
  const location = useLocation();
  const { user, setIsSearchOpen, showNotifPanel, setShowNotifPanel } = useSidebar();
  const { unreadCount, handleMarkAllRead } = useNotifications(user);

  const path = location.pathname;
  const hideTopHeader =
    /^\/social\/chat\/.+/.test(path) ||
    path.startsWith("/social/buddy/new") ||
    path.startsWith("/social/buddy/edit") ||
    path.startsWith("/social/journey/") ||
    path.startsWith("/updateProfile");

  if (hideTopHeader) return null;

  return (
    <div className="lg:hidden sticky top-0 bg-white z-[990] px-4 h-12 border-b border-slate-100 flex justify-between items-center">
      {location.pathname.startsWith("/settings/") ? (
        <Link
          to="/settings"
          className="flex items-center gap-2 text-slate-800 font-extrabold text-[15px] hover:text-brand-600 transition-colors"
        >
          <ICONS.ArrowLeft className="w-5 h-5 text-brand-600" />
          <span>Settings</span>
        </Link>
      ) : (
        <Link to="/social/buddy" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/10 overflow-hidden">
            <span className="relative z-10 text-white font-extrabold text-xs tracking-tighter">
              GY
            </span>
          </div>
          <span className="text-[17px] font-black tracking-tight text-slate-900">
            Go YatriGo
          </span>
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ICONS.Search className="w-4.5 h-4.5" />
        </button>
        {user && (
          <>
            <Link
              to="/social/journeys"
              aria-label="Journeys"
              className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${
                location.pathname.startsWith("/social/journeys")
                  ? "text-brand-600"
                  : "text-slate-500"
              }`}
            >
              <ICONS.Map className="w-4.5 h-4.5" />
            </Link>
            <button
              onClick={() => {
                setShowNotifPanel((prev) => !prev);
                if (!showNotifPanel && unreadCount > 0) handleMarkAllRead();
              }}
              className="bell-btn relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ICONS.Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/settings"
              aria-label="Settings"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ICONS.Settings className="w-4.5 h-4.5" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(MobileTopHeader);
