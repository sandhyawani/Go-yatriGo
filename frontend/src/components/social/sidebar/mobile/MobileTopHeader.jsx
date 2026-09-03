import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";
import { useNotifications } from "../hooks/useNotifications";

const MobileTopHeader = () => {
  const location = useLocation();
  const { user, setIsSearchOpen, showNotifPanel, setShowNotifPanel } = useSidebar();
  const { unreadCount } = useNotifications();

  const path = location.pathname;
  const isChatRoom = /^\/social\/chat\/[^/]+$/.test(path);
  const hideTopHeader =
    isChatRoom ||
    path.startsWith("/social/buddy/new") ||
    path.startsWith("/social/buddy/edit") ||
    path.startsWith("/social/journeys/") ||
    path.startsWith("/social/journey/") ||
    path.startsWith("/updateProfile");

  if (hideTopHeader) return null;

  return (
    <div className="lg:hidden sticky top-0 bg-white z-[990] px-3 sm:px-4 h-12 border-b border-slate-100 flex justify-between items-center">
      {location.pathname.startsWith("/settings/") ? (
        <Link
          to="/settings"
          className="flex items-center gap-1.5 sm:gap-2 text-text-primary font-semibold text-[14px] sm:text-[15px] hover:text-brand transition-colors truncate"
        >
          <ICONS.ArrowLeft className="w-5 h-5 text-brand shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
      ) : (
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand-600/10 overflow-hidden shrink-0">
            <span className="relative z-10 text-white font-bold text-xs tracking-tighter">
              GY
            </span>
          </div>
          <span className="text-[15px] sm:text-[17px] font-bold tracking-tight text-text-primary truncate font-heading">
            Go YatriGo
          </span>
        </Link>
      )}

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 sm:p-2.5 rounded-lg hover:bg-background text-text-muted transition-colors"
          aria-label="Search"
        >
          <ICONS.Search className="w-4.5 h-4.5" />
        </button>
        {user && (
          <>
            <Link
              to="/social/journeys"
              aria-label="Journey Hub"
              className={`p-2 sm:p-2.5 rounded-lg hover:bg-background transition-colors ${
                location.pathname.startsWith("/social/journeys")
                  ? "text-brand"
                  : "text-text-muted"
              }`}
            >
              <ICONS.BookOpen className="w-4.5 h-4.5" />
            </Link>
            <button
              onClick={() => setShowNotifPanel((prev) => !prev)}
              className="bell-btn relative p-2 sm:p-2.5 rounded-lg hover:bg-background text-text-muted transition-colors"
              aria-label="Notifications"
            >
              <ICONS.Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[15px] h-3.5 px-0.5 text-[9px] font-extrabold flex items-center justify-center bg-rose-500 text-white rounded-full ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/settings"
              aria-label="Settings"
              className="p-2 sm:p-2.5 rounded-lg hover:bg-background text-text-muted transition-colors"
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
