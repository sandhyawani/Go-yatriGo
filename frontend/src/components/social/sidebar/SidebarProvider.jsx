import React, { createContext, useContext, useState } from "react";
import { AuthContext } from "../../../context/authContext";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

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
    showNotifPanel,
    setShowNotifPanel,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
