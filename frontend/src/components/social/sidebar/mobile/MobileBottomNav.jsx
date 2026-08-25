import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, openDrawer } = useSidebar();

  if (!user) return null;

  const path = location.pathname;
  const isChatRoom = /^\/social\/chat\/[^/]+$/.test(path);
  const hideBottomNav =
    isChatRoom ||
    path.startsWith("/settings/") ||
    path.startsWith("/social/buddy/new") ||
    path.startsWith("/social/buddy/edit") ||
    path.startsWith("/social/journey/") ||
    path.startsWith("/updateProfile");

  if (hideBottomNav) return null;

  return (
    <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] z-[990] h-16 flex justify-around items-center px-1 pb-safe">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname === "/"
            ? "text-brand-600"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <ICONS.Home className="w-5 h-5" />
        <span className="text-[9px] font-bold leading-none">Home</span>
      </Link>

      <Link
        to="/social/buddy"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname.startsWith("/social/buddy")
            ? "text-brand-600"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <ICONS.Compass className="w-5 h-5" />
        <span className="text-[9px] font-bold leading-none">Explore</span>
      </Link>

      <button
        onClick={openDrawer}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1"
      >
        <div className="p-1.5 bg-brand-600 text-white rounded-xl shadow-md shadow-brand-600/20 active:scale-95 transition-transform">
          <ICONS.PlusSquare className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-bold leading-none text-slate-400">Create</span>
      </button>

      <Link
        to="/social/chat"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname.startsWith("/social/chat")
            ? "text-brand-600"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <ICONS.MessageSquare className="w-5 h-5" />
        <span className="text-[9px] font-bold leading-none">Chat</span>
      </Link>

      {(() => {
        const myId = user?._id || user?.id;
        const isProfileActive =
          location.pathname === "/profile" ||
          location.pathname === "/saved" ||
          Boolean(myId && location.pathname === `/profile/${myId}`);
        return (
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
              isProfileActive
                ? "text-brand-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ICONS.User className="w-5 h-5" />
            <span className="text-[9px] font-bold leading-none">Profile</span>
          </Link>
        );
      })()}
    </nav>

  );
};

export default React.memo(MobileBottomNav);
