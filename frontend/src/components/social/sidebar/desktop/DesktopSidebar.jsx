import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";
import DesktopNav from "./DesktopNav";
import CreateDropdown from "./CreateDropdown";
import ProfileMenu from "../../../settings/ProfileMenu";

const DesktopSidebar = () => {
  const location = useLocation();
  const { user } = useSidebar();

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
    <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-50">
      <nav className="flex flex-col h-full bg-white border-r border-slate-100 shadow-sm py-6 px-4 justify-between transition-colors duration-300">
        
        <DesktopNav />

        <CreateDropdown />

        <div className="flex flex-col gap-1 mt-auto pb-4">
          <Link
            to="/profile"
            className={navItemClass(location.pathname === "/profile")}
          >
            <ICONS.User className={iconClass(location.pathname === "/profile")} />
            Profile
          </Link>
        </div>

        <div className="border-t border-slate-200 pt-5">
          {user ? (
            <ProfileMenu />
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="btn-secondary py-2 px-4 text-center text-sm font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary py-2 px-4 text-center text-sm font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default React.memo(DesktopSidebar);
