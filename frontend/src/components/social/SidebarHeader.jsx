import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  Home as HomeIcon,
  Search,
  Compass,
  Navigation,
  MessageSquare,
  Bell,
  PlusSquare,
  User
} from "lucide-react";
import ProfileMenu from "../settings/ProfileMenu";

export const SidebarHeader = ({
  location,
  user,
  unreadCount,
  setIsSearchOpen,
  setShowNotifPanel,
  showNotifPanel,
  setIsCreateStoryOpen,
  setIsCreatePostOpen
}) => {
  const navItemClass = (isActive) =>
    `relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group w-full select-none text-[14px] ${
      isActive
        ? "bg-brand-500/10 text-brand-500 font-semibold shadow-sm"
        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-semibold hover:-translate-y-0.5"
    }`;

  const iconClass = (isActive) =>
    `w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
      isActive ? "text-brand-500" : "text-slate-500 group-hover:text-brand-500"
    }`;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-3 py-2 mb-2 group">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0 group-hover:-rotate-[8deg] group-hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute top-[-2px] right-[-2px] w-5 h-5 bg-white/30 rounded-full blur-[3px]"></div>
          <span className="relative z-10 text-white font-extrabold text-[15px] tracking-tighter flex items-center drop-shadow-sm">
            G<span className="text-[#FFD166] -ml-[1.5px] mt-[2px]">Y</span>
          </span>
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-slate-900 truncate">
          Go YatriGo<span className="text-brand-500">.</span>
        </span>
      </Link>

      {/* Nav Links */}
      <Link to="/" className={navItemClass(location.pathname === "/")}>
        <HomeIcon className={iconClass(location.pathname === "/")} />
        Home
      </Link>

      <button onClick={() => setIsSearchOpen(true)} className={navItemClass(false)}>
        <Search className={iconClass(false)} />
        Search
      </button>

      <Link
        to="/social/buddy"
        className={navItemClass(location.pathname.startsWith("/social/buddy"))}
      >
        <Compass className={iconClass(location.pathname.startsWith("/social/buddy"))} />
        Explore
      </Link>

      <Link
        to="/social/journeys"
        className={navItemClass(location.pathname.startsWith("/social/journeys"))}
      >
        <Navigation className={iconClass(location.pathname.startsWith("/social/journeys"))} />
        Journeys
      </Link>

      <Link
        to="/social/chat"
        className={navItemClass(location.pathname.startsWith("/social/chat"))}
      >
        <MessageSquare className={iconClass(location.pathname.startsWith("/social/chat"))} />
        Messages
      </Link>

      {/* Notifications trigger */}
      <div className="relative w-full">
        <button
          onClick={() => setShowNotifPanel((prev) => !prev)}
          className={navItemClass(showNotifPanel)}
        >
          <Bell className={iconClass(showNotifPanel)} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="w-4.5 h-4.5 min-w-[18px] bg-accent-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Create dropdown */}
      <Menu as="div" className="relative w-full">
        <Menu.Button className="w-full flex items-center justify-center gap-2 px-3 py-3 my-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-[13.5px] shadow-[0_10px_30px_rgba(108,77,246,0.25)] hover:shadow-[0_15px_40px_rgba(108,77,246,0.35)] hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all duration-300">
          <PlusSquare className="w-4 h-4" />
          Create
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 scale-95 translate-y-4"
          enterTo="opacity-100 scale-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100 translate-y-0"
          leaveTo="opacity-0 scale-95 translate-y-4"
        >
          <Menu.Items className="absolute left-[calc(100%+16px)] bottom-0 w-[240px] bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 focus:outline-none p-2 origin-bottom-left">
            <div className="absolute -left-2 bottom-[14px] w-4 h-4 bg-white border-l border-b border-slate-100 transform rotate-45 rounded-sm" />
            <div className="space-y-1 relative z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsCreateStoryOpen(true)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                      <PlusSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-800">Create Story</p>
                      <p className="text-[10px] text-slate-500 font-medium">Share moments for 24h</p>
                    </div>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                      <PlusSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-800">Post a Memory</p>
                      <p className="text-[10px] text-slate-500 font-medium">Share travel photos</p>
                    </div>
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/social/buddy/new"
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                      <Compass className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-800">Create Trip Group</p>
                      <p className="text-[10px] text-slate-500 font-medium">Host a travel squad</p>
                    </div>
                  </Link>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <Link to="/profile" className={navItemClass(location.pathname === "/profile")}>
        <User className={iconClass(location.pathname === "/profile")} />
        Profile
      </Link>
    </div>
  );
};
export default SidebarHeader;

