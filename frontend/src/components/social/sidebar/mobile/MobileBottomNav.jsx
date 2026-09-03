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
    <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(15,23,42,0.06)] z-[990] h-16 flex justify-around items-center px-1 pb-safe">
      <Link
        to="/"
        aria-label="Home"
        data-tour="nav-home"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname === "/"
            ? "text-brand font-bold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
      >
        <ICONS.Home className="w-5 h-5" />
        <span className="text-[10.5px] sm:text-xs font-semibold leading-tight mt-0.5">Home</span>
      </Link>

      <Link
        to="/social/buddy"
        aria-label="Explore"
        data-tour="nav-explore"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname.startsWith("/social/buddy")
            ? "text-brand font-bold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
      >
        <ICONS.Compass className="w-5 h-5" />
        <span className="text-[10.5px] sm:text-xs font-semibold leading-tight mt-0.5">Explore</span>
      </Link>

      <button
        onClick={openDrawer}
        aria-label="Create"
        data-tour="nav-create"
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 text-slate-500 hover:text-slate-900 font-medium group"
      >
        <ICONS.PlusSquare className="w-5 h-5 transition-transform group-hover:scale-105 group-active:scale-95" />
        <span className="text-[10.5px] sm:text-xs font-semibold leading-tight mt-0.5">Create</span>
      </button>

      <Link
        to="/social/chat"
        aria-label="Chat"
        data-tour="nav-chat"
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
          location.pathname.startsWith("/social/chat")
            ? "text-brand font-bold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
      >
        <ICONS.MessageSquare className="w-5 h-5" />
        <span className="text-[10.5px] sm:text-xs font-semibold leading-tight mt-0.5">Chat</span>
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
            aria-label="Profile"
            data-tour="nav-profile"
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
              isProfileActive
                ? "text-brand font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <ICONS.User className="w-5 h-5" />
            <span className="text-[10.5px] sm:text-xs font-semibold leading-tight mt-0.5">Profile</span>
          </Link>
        );
      })()}
    </nav>

  );
};

export default React.memo(MobileBottomNav);
