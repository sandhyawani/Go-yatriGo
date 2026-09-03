import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";
import DesktopNav from "./DesktopNav";
import ProfileMenu from "../../../settings/ProfileMenu";

const DesktopSidebar = () => {
  const location = useLocation();
  const { user } = useSidebar();

  const myId = user?._id || user?.id;
  const isProfileActive =
    location.pathname === "/profile" ||
    Boolean(myId && location.pathname === `/profile/${myId}`);

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
    <aside className="hidden lg:flex flex-col w-[240px] xl:w-[252px] shrink-0 h-screen py-3 pl-3 pr-1.5 sticky top-0 z-50 select-none">
      <nav className="flex flex-col h-full bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] rounded-[26px] p-3 justify-between transition-all relative">
        
        {/* Top Navigation */}
        <div className="flex flex-col">
          <DesktopNav />
        </div>


        {/* Bottom Section: Profile & User Menu */}
        <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-slate-200/60">
          <Link
            to={myId ? `/profile/${myId}` : "/profile"}
            data-tour="nav-profile"
            className={navItemClass(isProfileActive)}
          >
            <ICONS.User className={iconClass(isProfileActive)} />
            <span className="flex-1 text-left">Profile</span>
            {isProfileActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </Link>

          {user ? (
            <div className="pt-1">
              <ProfileMenu />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/login"
                className="btn-secondary py-2 px-3 text-center text-xs font-bold rounded-xl shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary py-2 px-3 text-center text-xs font-bold rounded-xl shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default React.memo(DesktopSidebar);


