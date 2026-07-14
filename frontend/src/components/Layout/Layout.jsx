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
      className={`flex min-h-[100dvh] flex-col lg:flex-row isolate ${
        isAdminWorkspace ? "bg-brand-dark w-full" : "bg-background max-w-[1440px] mx-auto w-full lg:h-screen lg:overflow-hidden"
      }`}
    >
      {/* Sidebar Section */}
      {isAdminWorkspace ? (
        <AdminSidebar isOpen={adminNavOpen} onClose={() => setAdminNavOpen(false)} />
      ) : (
        hasNavigation && !isChatPage && <SocialSidebar />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full min-w-0 relative z-navbar ${
          isChatPage ? "" : "overflow-x-hidden"
        } ${
          isAdminWorkspace
            ? "lg:ml-[240px] lg:w-[calc(100%-240px)]"
            : isChatPage
            ? "p-0 lg:h-screen lg:overflow-hidden"
            : "px-4 lg:pl-8 lg:pr-8 pt-2 pb-24 lg:pb-6 lg:h-screen lg:overflow-y-auto"
        }`}
      >
        {isAdminWorkspace && <AdminNavbar onOpenMenu={() => setAdminNavOpen(true)} />}
        
        {/* Route views container wrapping the actual screen views */}
        <div className="w-full">
          <RouteTour />
        </div>

        {hasNavigation && !isAdminWorkspace && !isChatPage && !isBuddyDetailPage && <Footer />}
      </main>
    </div>
  );
};

export default Layout;

