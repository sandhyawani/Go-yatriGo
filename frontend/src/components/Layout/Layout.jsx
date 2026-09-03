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
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  const hasNavigation = user && !isAuthPage;
  const isChatPage = location.pathname.startsWith("/social/chat");
  const isHomePage = location.pathname === "/";
  const isBuddyDetailPage = location.pathname.startsWith("/social/buddy/") && location.pathname !== "/social/buddy/new";
  const secondaryAdminRoutes = ["/users", "/userpage", "/update", "/adduser"];
  const isAdminWorkspace =
  Boolean(user?.isAdmin) && (
  location.pathname === "/admin" ||
  location.pathname.startsWith("/admin/") ||
  secondaryAdminRoutes.includes(location.pathname));

  useEffect(() => {
    setAdminNavOpen(false);
    AudioManager.stopAll();
  }, [location.pathname]);

  if (isAdminWorkspace) {
    return (
      <div className="flex min-h-[100dvh] flex-col lg:flex-row isolate bg-brand-dark w-full">
        <AdminSidebar isOpen={adminNavOpen} onClose={() => setAdminNavOpen(false)} />
        <main className="flex-1 w-full min-w-0 relative z-navbar lg:ml-[240px] lg:w-[calc(100%-240px)] bg-white min-h-screen flex flex-col">
          <AdminNavbar onOpenMenu={() => setAdminNavOpen(true)} />
          <div className="w-full">
            <RouteTour />
          </div>
        </main>
      </div>
    );
  }

  if (hasNavigation) {
    return (
      <SocialSidebar>
        <div
          className={
            isChatPage
              ? "w-full h-full p-0"
              : isHomePage
              ? "w-full h-full min-h-0 flex flex-col px-3 sm:px-4 lg:pl-4 lg:pr-4 xl:pl-5 xl:pr-5 pt-2 lg:pt-3 pb-24 lg:pb-3 lg:overflow-hidden"
              : "px-4 lg:pl-8 lg:pr-8 pt-2 pb-24 lg:pb-6"
          }
        >
          <RouteTour />
        </div>
        {!isBuddyDetailPage && !isChatPage && !isHomePage && <Footer />}
      </SocialSidebar>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row isolate bg-background max-w-[1920px] mx-auto w-full lg:h-screen lg:overflow-hidden">
      <main
        id="main-scroll-container"
        className={`flex-1 w-full min-w-0 relative z-navbar ${
          isChatPage ? "" : "overflow-x-hidden"
        } ${
          isChatPage
            ? "p-0 lg:h-screen lg:overflow-hidden"
            : "px-4 lg:pl-8 lg:pr-8 pt-2 pb-24 lg:pb-6 lg:h-screen lg:overflow-y-auto"
        }`}
      >
        <div className="w-full">
          <RouteTour />
        </div>
        {hasNavigation && !isBuddyDetailPage && !isChatPage && <Footer />}
      </main>
    </div>
  );
};

export default Layout;