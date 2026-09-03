import React, { Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "./SidebarProvider";
import DesktopSidebar from "./desktop/DesktopSidebar";
import MobileTopHeader from "./mobile/MobileTopHeader";
import MobileBottomNav from "./mobile/MobileBottomNav";
import MobileCreateDrawer from "./mobile/MobileCreateDrawer";
import CreateTravelMemoryModal from "../../modals/CreateTravelMemoryModal";
import CreateJourneyModal from "../../journey/CreateJourneyModal";
import NavigationTour from "../../tour/NavigationTour";
import { useSidebar } from "./SidebarProvider";

const NotificationPanel = lazy(() => import("./notifications/NotificationPanel"));
const SearchPanel = lazy(() => import("./search/SearchPanel"));

const SidebarLayout = ({ children }) => {
  const {
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateJourneyOpen,
    setIsCreateJourneyOpen,
  } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Called when a journey is successfully created inside the global modal.
  // Navigate directly to the new journey's detail page.
  const handleJourneyCreated = (newJourney) => {
    setIsCreateJourneyOpen(false);
    if (newJourney?._id) {
      navigate(`/social/journeys/${newJourney._id}`);
    }
  };

  // Ensure main scroll container and window reset to 0 when navigating to home page
  React.useEffect(() => {
    if (isHomePage) {
      window.scrollTo(0, 0);
      const el = document.getElementById("main-scroll-container");
      if (el) el.scrollTop = 0;
    }
  }, [isHomePage]);

  // Lock main-scroll-container at top on desktop home page to prevent feed/sidebar shifting
  React.useEffect(() => {
    if (!isHomePage) return;
    const el = document.getElementById("main-scroll-container");
    if (!el) return;

    const enforceTop = () => {
      if (window.innerWidth >= 1024 && el.scrollTop !== 0) {
        el.scrollTop = 0;
      }
    };
    el.addEventListener("scroll", enforceTop, { passive: true });
    return () => el.removeEventListener("scroll", enforceTop);
  }, [isHomePage]);

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen lg:overflow-hidden bg-slate-100 selection:bg-brand/30">
      <DesktopSidebar />
      <MobileTopHeader />

      <main
        id="main-scroll-container"
        className={`flex min-w-0 flex-1 h-full min-h-0 ${
          isHomePage ? "overflow-y-auto lg:overflow-hidden" : "overflow-y-auto"
        } overflow-x-hidden relative scroll-smooth bg-slate-100/70`}
      >
        <div className="mx-auto min-w-0 w-full max-w-[1920px] h-full min-h-0 flex flex-col">
          {children}
        </div>
      </main>

      <MobileBottomNav />
      <MobileCreateDrawer />

      <Suspense fallback={null}>
        <NotificationPanel />
        <SearchPanel />
      </Suspense>

      {/* Global Travel Memory creation modal */}
      <CreateTravelMemoryModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSuccess={() => navigate("/")}
      />

      {/* Global Journey creation modal — shared by every entry point */}
      <CreateJourneyModal
        isOpen={isCreateJourneyOpen}
        onClose={() => setIsCreateJourneyOpen(false)}
        onCreated={handleJourneyCreated}
      />

      {/* First-time user onboarding navigation tour */}
      <NavigationTour />
    </div>
  );
};

const SocialSidebarWrapper = ({ children }) => {
  return (
    <SidebarProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </SidebarProvider>
  );
};

export default SocialSidebarWrapper;
