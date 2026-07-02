import React, { useState, useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import {
  Home as HomeIcon,
  Search,
  Compass,
  MessageSquare,
  Bell,
  User
} from "lucide-react";

import { useNotifications } from "../../hooks/social/useNotifications";
import { useFriendRequests } from "../../hooks/social/useFriendRequests";
import { useSocialSearch } from "../../hooks/social/useSocialSearch";

import SidebarHeader from "../social/SidebarHeader";
import SidebarSearch from "../social/SidebarSearch";
import NotificationPanel from "../social/NotificationPanel";
import CreateStoryModal from "../story/CreateStoryModal";
import CreatePostModal from "../post/CreatePostModal";

export const SocialSidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Drawers & Modals States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Hook integrations
  const {
    notifications,
    unreadCount,
    journeyInvitations,
    markAllRead,
    markAsRead,
    removeJourneyInvitation,
    dispatch
  } = useNotifications(user);

  const {
    handleAcceptRequest,
    handleRejectRequest,
    handleAcceptMessage,
    handleRejectMessage,
    handleAcceptJoin,
    handleRejectJoin
  } = useFriendRequests(dispatch);

  const {
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchResults,
    searchTab,
    setSearchTab
  } = useSocialSearch();

  const handleRefreshData = () => {
    window.dispatchEvent(new Event("refresh_home_posts"));
  };

  const navItemClass = (isActive) =>
    `flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-bold transition-all ${
      isActive ? "text-[#6C4DF6]" : "text-slate-400 hover:text-slate-600"
    }`;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-slate-100 bg-white h-screen sticky top-0 px-4 py-6 justify-between select-none">
        <SidebarHeader
          location={location}
          user={user}
          unreadCount={unreadCount}
          setIsSearchOpen={setIsSearchOpen}
          setShowNotifPanel={setShowNotifPanel}
          showNotifPanel={showNotifPanel}
          setIsCreateStoryOpen={setIsCreateStoryOpen}
          setIsCreatePostOpen={setIsCreatePostOpen}
        />
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around z-[999] px-2 shadow-lg">
        <Link to="/" className={navItemClass(location.pathname === "/")}>
          <HomeIcon className="w-5 h-5" /> Home
        </Link>
        <button onClick={() => setIsSearchOpen(true)} className={navItemClass(false)}>
          <Search className="w-5 h-5" /> Search
        </button>
        <Link to="/social/buddy" className={navItemClass(location.pathname.startsWith("/social/buddy"))}>
          <Compass className="w-5 h-5" /> Explore
        </Link>
        <Link to="/social/chat" className={navItemClass(location.pathname.startsWith("/social/chat"))}>
          <MessageSquare className="w-5 h-5" /> Chats
        </Link>
        <button onClick={() => setShowNotifPanel((prev) => !prev)} className={navItemClass(showNotifPanel)}>
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF5A7A] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          Alerts
        </button>
        <Link to="/profile" className={navItemClass(location.pathname === "/profile")}>
          <User className="w-5 h-5" /> Profile
        </Link>
      </div>

      {/* Slide-out Drawers */}
      <SidebarSearch
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchLoading={searchLoading}
        searchResults={searchResults}
        searchTab={searchTab}
        setSearchTab={setSearchTab}
      />

      <NotificationPanel
        showNotifPanel={showNotifPanel}
        setShowNotifPanel={setShowNotifPanel}
        notifications={notifications}
        unreadCount={unreadCount}
        journeyInvitations={journeyInvitations}
        markAllRead={markAllRead}
        markAsRead={markAsRead}
        handleAcceptRequest={handleAcceptRequest}
        handleRejectRequest={handleRejectRequest}
        handleAcceptMessage={handleAcceptMessage}
        handleRejectMessage={handleRejectMessage}
        handleAcceptJoin={handleAcceptJoin}
        handleRejectJoin={handleRejectJoin}
        removeJourneyInvitation={removeJourneyInvitation}
      />

      {/* Story & Post Creation Modals */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={handleRefreshData}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handleRefreshData}
      />
    </>
  );
};
export default SocialSidebar;
