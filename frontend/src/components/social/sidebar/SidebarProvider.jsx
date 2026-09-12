import React, { createContext, useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/authContext";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const { user, logout } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateJourneyOpen, setIsCreateJourneyOpen] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const openCreatePost = useCallback(() => {
    setDrawerOpen(false);
    setIsCreateJourneyOpen(false);
    setIsCreatePostOpen(true);
  }, []);

  const openCreateJourney = useCallback(() => {
    setDrawerOpen(false);
    setIsCreatePostOpen(false);
    setIsCreateJourneyOpen(true);
  }, []);

  const value = {
    user,
    logout,
    drawerOpen,
    setDrawerOpen,
    openDrawer,
    closeDrawer,
    isSearchOpen,
    setIsSearchOpen,
    isCreatePostOpen,
    setIsCreatePostOpen,
    isCreateJourneyOpen,
    setIsCreateJourneyOpen,
    openCreatePost,
    openCreateJourney,
    showNotifPanel,
    setShowNotifPanel,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
