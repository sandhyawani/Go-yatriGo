import React, { Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "./SidebarProvider";
import DesktopSidebar from "./desktop/DesktopSidebar";
import MobileTopHeader from "./mobile/MobileTopHeader";
import MobileBottomNav from "./mobile/MobileBottomNav";
import MobileCreateDrawer from "./mobile/MobileCreateDrawer";
import CreateTravelMemoryModal from "../../modals/CreateTravelMemoryModal";
import { useSidebar } from "./SidebarProvider";

// Assuming NotificationErrorBoundary exists or we just use Suspense
const NotificationPanel = lazy(() => import("./notifications/NotificationPanel"));
const SearchPanel = lazy(() => import("./search/SearchPanel"));

const SidebarLayout = ({ children }) => {
  const { isCreatePostOpen, setIsCreatePostOpen } = useSidebar();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 selection:bg-brand-500/30">
      <DesktopSidebar />
      <MobileTopHeader />
      
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative scroll-smooth bg-slate-50/50">
        <div className="mx-auto w-full max-w-[1920px]">
          {children}
        </div>
      </main>

      <MobileBottomNav />
      <MobileCreateDrawer />

      <Suspense fallback={null}>
        <NotificationPanel />
        <SearchPanel />
      </Suspense>

      <CreateTravelMemoryModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSuccess={() => navigate("/")}
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
