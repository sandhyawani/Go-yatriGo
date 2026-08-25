import React, { createContext, useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/authContext";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const { user, logout } = useContext(AuthContext);

  // Drawer / panels
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Creation modals — shared state so every entry point uses the same modal
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateJourneyOpen, setIsCreateJourneyOpen] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  // Open the Travel Memory creation modal; close drawer first if open
  const openCreatePost = useCallback(() => {
    setDrawerOpen(false);
    setIsCreateJourneyOpen(false);
    setIsCreatePostOpen(true);
  }, []);

  // Open the Journey creation modal; close drawer first if open
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
