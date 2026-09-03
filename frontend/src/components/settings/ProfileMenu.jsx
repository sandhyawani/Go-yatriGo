import React, { Fragment, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, User, CheckCircle2, ChevronRight } from "lucide-react";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import { isActuallyVerified } from "../../utils/verification";

const ProfileMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  const isVerified = isActuallyVerified(user) || Boolean(user?.isAdmin);
  const profilePath = user?._id || user?.id ? `/profile/${user._id || user.id}` : "/profile";

  return (
    <Menu as="div" className="relative w-full">
      {({ open }) => (
        <>
          <Menu.Button className={`flex items-center gap-2.5 p-2 rounded-2xl transition-all w-full text-left outline-none group select-none cursor-pointer border ${
            open
              ? "bg-slate-100/90 border-slate-300/80 shadow-xs"
              : "bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/70 hover:border-slate-300/80 shadow-2xs"
          }`}>
            <div className="relative shrink-0">
              <img
                className="h-10 w-10 rounded-full border-2 border-white shadow-xs object-cover ring-2 ring-brand-200/80"
                src={getAvatarUrl(user.pic, user.img, user.name)}
                alt={user.name}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight font-heading group-hover:text-brand transition-colors">
                  {user.name}
                </p>
                {isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand fill-brand/10 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVerified ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <p className="text-[10px] font-semibold text-slate-500 capitalize truncate">
                  {user.isAdmin
                    ? "Verified Admin"
                    : isActuallyVerified(user)
                    ? "Verified Traveler"
                    : user.verificationStatus === "pending"
                    ? "Verification Pending"
                    : "Not Verified"}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/80 border border-slate-200/60 flex items-center justify-center shrink-0 group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand group-hover:rotate-45 transition-all duration-300" />
            </div>
          </Menu.Button>

          <AnimatePresence>
            {open && (
              <Menu.Items
                static
                as={motion.div}
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 bottom-[calc(100%+8px)] w-full min-w-[220px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] z-[100] focus:outline-none p-2"
              >
                <div className="px-3 py-2.5 mb-1.5 rounded-xl bg-gradient-to-r from-sky-50/90 to-brand-50/50 border border-sky-100/70">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate font-heading tracking-tight">
                        {user.name}
                      </p>
                      {isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      )}
                    </div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isActuallyVerified(user) || user.isAdmin
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {user.isAdmin
                        ? "Admin"
                        : isActuallyVerified(user)
                        ? "Verified"
                        : user.verificationStatus === "pending"
                        ? "Pending"
                        : "Not Verified"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to={profilePath}
                      className={`group flex items-center h-9 gap-3 px-3 rounded-xl transition-colors text-xs font-semibold cursor-pointer ${
                        active ? "bg-brand-50 text-brand" : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <User className={`w-4 h-4 transition-colors ${active ? "text-brand" : "text-slate-400"}`} />
                      <span className="flex-1">View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors" />
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`group flex items-center h-9 gap-3 px-3 rounded-xl transition-colors text-xs font-semibold cursor-pointer ${
                        active ? "bg-brand-50 text-brand" : "text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <Settings className={`w-4 h-4 transition-colors ${active ? "text-brand" : "text-slate-400"}`} />
                      <span className="flex-1">Settings</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors" />
                    </Link>
                  )}
                </Menu.Item>

                <div className="h-px bg-slate-150 my-1.5 mx-1" />

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`group flex items-center h-9 gap-3 px-3 rounded-xl w-full text-left transition-colors text-xs font-semibold cursor-pointer ${
                        active
                          ? "bg-rose-50 text-rose-600"
                          : "text-slate-600 hover:text-rose-600"
                      }`}
                    >
                      <LogOut className={`w-4 h-4 transition-colors ${active ? "text-rose-500" : "text-slate-400"}`} />
                      Log out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
};


export default ProfileMenu;