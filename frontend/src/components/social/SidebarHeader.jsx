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
User,
Camera,
Users,
Video,
MapPin,
ArrowRight } from
"lucide-react";
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
  isActive ?
  "bg-brand-500/10 text-brand-500 font-semibold shadow-sm" :
  "text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-semibold hover:-translate-y-0.5"
  }`;

  const iconClass = (isActive) =>
  `w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
  isActive ? "text-brand-500" : "text-slate-500 group-hover:text-brand-500"
  }`;

  return (
    <div className="flex flex-col gap-0.5">
      {}
      <Link to="/" className="flex items-center gap-2.5 px-3 py-2 mb-2 group">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0 group-hover:-rotate-[8deg] group-hover:scale-105 transition-all duration-300 overflow-hidden">
          <div className="absolute top-[-2px] right-[-2px] w-5 h-5 bg-white/30 rounded-full blur-[3px]"></div>
          <span className="relative z-10 text-white font-extrabold text-[15px] tracking-tighter flex items-center drop-shadow-sm">
            G<span className="text-[#FFD166] -ml-[1.5px] mt-[2px]">Y</span>
          </span>
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-slate-900 truncate">
          Go YatriGo
        </span>
      </Link>

      {}
      <Link to="/" className={navItemClass(location.pathname === "/")}>
        <HomeIcon className={iconClass(location.pathname === "/")} />
        Home
      </Link>

      <Link
      to="/social/buddy"
      className={navItemClass(location.pathname.startsWith("/social/buddy"))}>

        <Compass className={iconClass(location.pathname.startsWith("/social/buddy"))} />
        Explore
      </Link>

      <button onClick={() => setIsSearchOpen(true)} className={navItemClass(false)}>
        <Search className={iconClass(false)} />
        Search
      </button>

      <Link
      to="/social/journeys"
      className={navItemClass(location.pathname.startsWith("/social/journeys"))}>

        <Navigation className={iconClass(location.pathname.startsWith("/social/journeys"))} />
        Journey Hub
      </Link>

      <Link
      to="/social/chat"
      className={navItemClass(location.pathname.startsWith("/social/chat"))}>

        <MessageSquare className={iconClass(location.pathname.startsWith("/social/chat"))} />
        Chat
      </Link>

      {}
      <div className="relative w-full">
        <button
        onClick={() => setShowNotifPanel((prev) => !prev)}
        className={navItemClass(showNotifPanel)}>

          <Bell className={iconClass(showNotifPanel)} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="w-2.5 h-2.5 bg-accent-500 rounded-full shrink-0" />
          )}

        </button>
      </div>

      {}
      <Menu as="div" className="relative w-full">
        <Menu.Button className="w-full flex items-center justify-center gap-2 px-3 py-3 my-4 rounded-xl bg-gradient-to-r from-[#6D3EF5] to-[#8B5CF6] text-white font-bold text-[13.5px] shadow-[0_10px_30px_rgba(109,62,245,0.3)] hover:shadow-[0_15px_40px_rgba(109,62,245,0.4)] hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all duration-300">
          <span>✈️</span>
          Create
        </Menu.Button>
        <Transition
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 scale-95 blur-sm translate-y-4"
        enterTo="opacity-100 scale-100 blur-0 translate-y-0"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 scale-100 blur-0 translate-y-0"
        leaveTo="opacity-0 scale-95 blur-sm translate-y-4">

          <Menu.Items className="absolute left-[calc(100%+16px)] bottom-0 w-[320px] bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_20px_60px_-15px_rgba(109,62,245,0.2)] z-50 focus:outline-none p-4 origin-bottom-left flex flex-col gap-3">
            <div className="pb-3 border-b border-slate-200/50 mb-2">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <span>✈️</span> Create
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Choose your next travel experience
              </p>
            </div>

            <Menu.Item>
              {({ active }) =>
              <Link
              to="/social/journeys"
              className={`group relative w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#6D3EF5]/10 to-transparent shadow-sm translate-y-[-4px]' : 'bg-white/50 hover:bg-gradient-to-r hover:from-[#6D3EF5]/10 hover:to-transparent hover:shadow-[0_8px_20px_rgba(109,62,245,0.12)] hover:-translate-y-1'}`}
              style={{ border: '1px solid rgba(109,62,245,0.1)' }}>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-[#6D3EF5] transition-colors">
                      Start Journey
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium">
                      Create a solo or group expedition
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#6D3EF5] group-hover:translate-x-1 transition-all duration-300" />
                </Link>}

            </Menu.Item>

            <Menu.Item>
              {({ active }) =>
              <button
              onClick={() => setIsCreatePostOpen(true)}
              className={`group relative w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#6D3EF5]/10 to-transparent shadow-sm translate-y-[-4px]' : 'bg-white/50 hover:bg-gradient-to-r hover:from-[#6D3EF5]/10 hover:to-transparent hover:shadow-[0_8px_20px_rgba(109,62,245,0.12)] hover:-translate-y-1'}`}
              style={{ border: '1px solid rgba(109,62,245,0.1)' }}>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-[#6D3EF5] transition-colors">
                      Travel Memory
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium">
                      Capture photos and memories
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#6D3EF5] group-hover:translate-x-1 transition-all duration-300" />
                </button>}

            </Menu.Item>

            <Menu.Item>
              {({ active }) =>
              <Link
              to="/social/buddy/new"
              className={`group relative w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#6D3EF5]/10 to-transparent shadow-sm translate-y-[-4px]' : 'bg-white/50 hover:bg-gradient-to-r hover:from-[#6D3EF5]/10 hover:to-transparent hover:shadow-[0_8px_20px_rgba(109,62,245,0.12)] hover:-translate-y-1'}`}
              style={{ border: '1px solid rgba(109,62,245,0.1)' }}>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-[#6D3EF5] transition-colors">
                      Travel Squad
                    </h4>
                    <p className="text-[13px] text-slate-500 font-medium">
                      Create a travel group
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#6D3EF5] group-hover:translate-x-1 transition-all duration-300" />
                </Link>}

            </Menu.Item>

            <div className="pt-3 border-t border-slate-200/50 mt-1 text-center">
              <p className="text-[10px] font-bold text-[#6D3EF5] uppercase tracking-widest opacity-60">
                Powered by Go YatriGo Explorer System
              </p>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <Link to="/profile" className={navItemClass(location.pathname === "/profile")}>
        <User className={iconClass(location.pathname === "/profile")} />
        Profile
      </Link>
    </div>);

};
export default SidebarHeader;