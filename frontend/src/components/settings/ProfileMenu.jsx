import React, { Fragment, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut } from "lucide-react";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";

const ProfileMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <Menu as="div" className="relative w-full">
      {({ open }) => (
        <>
          <Menu.Button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors w-full text-left outline-none group select-none">
            <img
              className="h-9 w-9 rounded-full border border-slate-200 object-cover shrink-0"
              src={getAvatarUrl(user.pic, user.img, user.name)}
              alt={user.name}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate leading-tight">{user.isAdmin ? "Administrator" : (user.type || "Traveler")}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </Menu.Button>

          <AnimatePresence>
            {open && (
              <Menu.Items
                static
                as={motion.div}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute right-0 bottom-[calc(100%+6px)] w-[168px] bg-white border border-slate-200 rounded-xl shadow-lg z-[100] focus:outline-none overflow-hidden"
              >
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`flex items-center h-9 gap-2.5 px-3 rounded-lg transition-colors text-[13px] font-medium ${active ? "bg-slate-50 text-slate-900" : "text-slate-600"}`}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <div className="h-px bg-slate-100 my-0.5 mx-2" />
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`flex items-center h-9 gap-2.5 px-3 rounded-lg w-full text-left transition-colors text-[13px] font-medium ${active ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-red-50 hover:text-red-600"}`}
                      >
                        <LogOut className={`w-3.5 h-3.5 ${active ? "text-red-500" : "text-slate-400"}`} />
                        Log out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
};

export default ProfileMenu;