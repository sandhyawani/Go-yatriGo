// import React, { useContext } from "react";
// import { useLocation } from "react-router-dom";
// import Footer from "../footer/Footer";
// import SocialSidebar from "./SocialSidebar";
// import RouteTour from "../../router/RouteTour";
// import { AuthContext } from "../../context/authContext";
// const Layout = () => {
//   const { user } = useContext(AuthContext);
//   const location = useLocation();

//   const isAuthPage =
//     location.pathname === "/login" ||
//     location.pathname === "/register" ||
//     location.pathname === "/reset-password";

//   const hasNavigation = user && !isAuthPage;

//   return (
//     <div className="bg-[#FAFAFA] min-h-screen flex flex-col md:flex-row">
//       {hasNavigation && <SocialSidebar />}

//       <main className={`flex-1 w-full min-w-0 transition-all duration-300 relative z-10 ${
//   hasNavigation ? 'md:ml-[230px] md:w-[calc(100%-230px)] md:px-6 md:py-5 pb-16 md:pb-0' : ''
// }`}
// >
//         <RouteTour />
//         {hasNavigation && <Footer />}
//       </main>
//     </div>
//   );
// };

// export default Layout;


import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Footer from "../footer/Footer";
import SocialSidebar from "./SocialSidebar";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "../navbar/AdminNavbar";
import RouteTour from "../../router/RouteTour";
import { AuthContext } from "../../context/authContext";
import AudioManager from "../../utils/AudioManager";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [adminNavOpen, setAdminNavOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/reset-password";

  const hasNavigation = user && !isAuthPage;
  const isChatPage = location.pathname.startsWith("/social/chat");
  const isBuddyDetailPage = location.pathname.startsWith("/social/buddy/") && location.pathname !== "/social/buddy/new";
  const secondaryAdminRoutes = ["/users", "/userpage", "/update", "/adduser"];
  const isAdminWorkspace =
    Boolean(user?.isAdmin) &&
    (location.pathname === "/admin" ||
      location.pathname.startsWith("/admin/") ||
      secondaryAdminRoutes.includes(location.pathname));

  useEffect(() => {
    setAdminNavOpen(false);
    AudioManager.stopAll();
  }, [location.pathname]);

  return (
    <div
      className={`flex min-h-[100dvh] ${
        isAdminWorkspace ? "bg-[#080d1c] flex-col lg:flex-row" : "bg-[#f8f7ff] flex-col lg:flex-row"
      }`}
    >
      {isAdminWorkspace ? (
        <AdminSidebar isOpen={adminNavOpen} onClose={() => setAdminNavOpen(false)} />
      ) : (
        hasNavigation && <SocialSidebar />
      )}
      <main
        className={`flex-1 w-full min-w-0 relative z-10 overflow-x-hidden ${
          isAdminWorkspace
            ? "lg:ml-[264px] lg:w-[calc(100%-264px)]"
            : hasNavigation
            ? "lg:ml-[260px] lg:w-[calc(100%-260px)] px-4 lg:px-10 pt-2 pb-24 lg:pb-6"
            : "px-4 lg:px-10 pt-2 pb-24 lg:pb-6"
        }`}
      >
        {isAdminWorkspace && <AdminNavbar onOpenMenu={() => setAdminNavOpen(true)} />}
        <RouteTour />
        {hasNavigation && !isAdminWorkspace && !isChatPage && !isBuddyDetailPage && <Footer />}
      </main>
    </div>
  );
};

export default Layout;
