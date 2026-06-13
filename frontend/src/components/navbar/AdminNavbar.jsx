// import React, { Fragment, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Menu, Transition } from "@headlessui/react";
// import {
//   Bell,
//   ChevronDown,
//   FileWarning,
//   LogOut,
//   Menu as MenuIcon,
//   Plus,
//   Search,
//   Settings,
//   ShieldCheck,
//   User,
//   UserPlus,
// } from "lucide-react";
// import { useAuth } from "../../context/authContext";

// const AdminNavbar = ({ onOpenMenu }) => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [query, setQuery] = useState("");

//   const handleLogout = async () => {
//     await logout();
//     navigate("/login", { replace: true });
//   };

//   const handleSearch = (event) => {
//     event.preventDefault();
//     const term = query.trim().toLowerCase();

//     if (term.includes("user") || term.includes("member")) {
//       navigate("/users");
//     } else if (term.includes("contact") || term.includes("support")) {
//       navigate("/admin/contacts");
//     } else if (term) {
//       navigate("/admin/reports");
//     }
//   };

//   const dropdownItem =
//     "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-900";

//   return (
//     <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-purple-100 bg-white/90 px-4 shadow-sm backdrop-blur-2xl md:px-7">
//       <button
//         type="button"
//         onClick={onOpenMenu}
//         className="rounded-xl border border-purple-100 bg-purple-50 p-2.5 text-purple-700 transition hover:bg-purple-100 hover:text-purple-900 md:hidden"
//         aria-label="Open navigation"
//       >
//         <MenuIcon className="h-5 w-5" />
//       </button>

//       <div className="hidden min-w-0 md:block">
//         <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
//           Trust & Safety
//         </p>
//         <p className="truncate text-sm font-medium text-slate-900">Moderation workspace</p>
//       </div>

//       <form
//         onSubmit={handleSearch}
//         className="group relative ml-auto w-full max-w-[360px] md:ml-5"
//       >
//         <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-purple-600" />
//         <input
//           type="search"
//           value={query}
//           onChange={(event) => setQuery(event.target.value)}
//           placeholder="Search users or reports..."
//           className="h-11 w-full rounded-xl border border-purple-100 bg-purple-50 pl-10 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-200"
//           aria-label="Search administration"
//         />
//         <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-purple-200 px-1.5 py-0.5 text-[10px] text-slate-400 lg:block">
//           /
//         </span>
//       </form>

//       <Menu as="div" className="relative">
//         <Menu.Button className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white p-1.5 pr-2 text-slate-700 shadow-sm transition hover:bg-purple-50">
//           <img
//             className="h-8 w-8 rounded-lg object-cover"
//             src={
//               user?.img ||
//               `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=9333ea&color=fff`
//             }
//             alt={user?.name || "Administrator"}
//           />
//           <ChevronDown className="hidden h-3.5 w-3.5 md:block" />
//         </Menu.Button>
//         <Transition
//           as={Fragment}
//           enter="transition duration-100 ease-out"
//           enterFrom="scale-95 opacity-0"
//           enterTo="scale-100 opacity-100"
//           leave="transition duration-75 ease-in"
//           leaveFrom="scale-100 opacity-100"
//           leaveTo="scale-95 opacity-0"
//         >
//           <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-purple-100 bg-white p-2 shadow-xl outline-none">
//             <div className="mb-2 flex items-center gap-3 border-b border-purple-100 px-3 py-2.5">
//               <ShieldCheck className="h-5 w-5 text-purple-600" />
//               <div className="min-w-0">
//                 <p className="truncate text-sm font-semibold text-slate-900">{user?.name || "Administrator"}</p>
//                 <p className="text-[11px] text-slate-500">Platform admin</p>
//               </div>
//             </div>
//             <Menu.Item>
//               <Link to="/admin/profile" className={dropdownItem}>
//                 <User className="h-4 w-4" />
//                 Profile
//               </Link>
//             </Menu.Item>
//             <Menu.Item>
//               <Link to="/settings/security" className={dropdownItem}>
//                 <Settings className="h-4 w-4" />
//                 Security settings
//               </Link>
//             </Menu.Item>
//             <Menu.Item>
//               <button type="button" onClick={handleLogout} className={`${dropdownItem} text-rose-600 hover:text-rose-700`}>
//                 <LogOut className="h-4 w-4" />
//                 Sign out
//               </button>
//             </Menu.Item>
//           </Menu.Items>
//         </Transition>
//       </Menu>
//     </header>
//   );
// };

// export default AdminNavbar;




// src/components/admin/AdminNavbar.jsx
import React, { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  Bell,
  ChevronDown,
  FileWarning,
  LogOut,
  Menu as MenuIcon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const AdminNavbar = ({ onOpenMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();

    if (term.includes("user") || term.includes("member")) {
      navigate("/users");
    } else if (term.includes("contact") || term.includes("support")) {
      navigate("/admin/contacts");
    } else if (term) {
      navigate("/admin/reports");
    }
  };

  const dropdownItem =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-purple-50 hover:text-purple-900";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-purple-100 bg-white/90 px-4 shadow-sm backdrop-blur-2xl md:px-7">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-xl border border-purple-100 bg-purple-50 p-2.5 text-purple-700 transition hover:bg-purple-100 hover:text-purple-900 md:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Trust & Safety
        </p>
        <p className="truncate text-sm font-medium text-slate-900">
          Moderation workspace
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="group relative ml-auto w-full max-w-[360px] md:ml-5"
      >
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-purple-600" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users or reports..."
          className="h-11 w-full rounded-xl border border-purple-100 bg-purple-50 pl-10 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-200"
          aria-label="Search administration"
        />
        <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-purple-200 px-1.5 py-0.5 text-[10px] text-slate-400 lg:block">
          /
        </span>
      </form>

      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white p-1.5 pr-2 text-slate-700 shadow-sm transition hover:bg-purple-50">
          <img
            className="h-8 w-8 rounded-lg object-cover"
            src={
              user?.img ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || "Admin"
              )}&background=9333ea&color=fff`
            }
            alt={user?.name || "Administrator"}
          />
          <ChevronDown className="hidden h-3.5 w-3.5 md:block" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="scale-95 opacity-0"
          enterTo="scale-100 opacity-100"
          leave="transition duration-75 ease-in"
          leaveFrom="scale-100 opacity-100"
          leaveTo="scale-95 opacity-0"
        >
          <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-purple-100 bg-white p-2 shadow-xl outline-none">
            <div className="mb-2 flex items-center gap-3 border-b border-purple-100 px-3 py-2.5">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[11px] text-slate-500">Platform admin</p>
              </div>
            </div>

            <Menu.Item>
              <Link to="/admin/profile" className={dropdownItem}>
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Menu.Item>

            <Menu.Item>
              <Link to="/admin/settings/security" className={dropdownItem}>
                <Settings className="h-4 w-4" />
                Security settings
              </Link>
            </Menu.Item>

            <Menu.Item>
              <button
                type="button"
                onClick={handleLogout}
                className={`${dropdownItem} text-rose-600 hover:text-rose-700`}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </header>
  );
};

export default AdminNavbar;