import React, { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "./SidebarProvider";
import DesktopSidebar from "./desktop/DesktopSidebar";
import MobileTopHeader from "./mobile/MobileTopHeader";
import MobileBottomNav from "./mobile/MobileBottomNav";
import MobileCreateDrawer from "./mobile/MobileCreateDrawer";
import CreateTravelMemoryModal from "../../modals/CreateTravelMemoryModal";
import CreateJourneyModal from "../../journey/CreateJourneyModal";
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

  // Called when a journey is successfully created inside the global modal.
  // Navigate directly to the new journey's detail page.
  const handleJourneyCreated = (newJourney) => {
    setIsCreateJourneyOpen(false);
    if (newJourney?._id) {
      navigate(`/social/journeys/${newJourney._id}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 selection:bg-brand-500/30">
      <DesktopSidebar />
      <MobileTopHeader />

      <main className="flex min-w-0 flex-1 h-full overflow-y-auto overflow-x-hidden relative scroll-smooth bg-slate-50/50">
        <div className="mx-auto min-w-0 w-full max-w-[1920px]">
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
