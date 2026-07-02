import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, MoreVertical, Trash2, Home } from "lucide-react";
import RoomItem from "./RoomItem";
import FollowRequestItem from "./FollowRequestItem";
import GlobalUserItem from "./GlobalUserItem";
import SidebarSearchInput from "./SidebarSearchInput";
import SidebarTabs from "./SidebarTabs";

export const ChatSidebar = ({
  user,
  currentUserId,
  rooms,
  activeRoom,
  loading,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  globalUsers,
  isSearchingGlobal,
  isDeleteSelectionMode,
  setIsDeleteSelectionMode,
  selectedRoomIds,
  showListMoreOptions,
  setShowListMoreOptions,
  selectRoom,
  handleSelectGlobalUser,
  handleToggleRoomSelection,
  handleDeleteSelectedChats,
  handleAcceptFollow,
  handleRejectFollow,
  filteredRooms,
  requestChats,
  followRequests,
  socketConnected,
  onlineUsers,
  typingUsers
}) => {
  const navigate = useNavigate();

  const handleClearSearch = () => setSearchQuery("");

  return (
    <aside
      className={`w-full lg:w-[300px] border-r border-slate-100 bg-white flex flex-col shrink-0 h-full ${
        activeRoom ? "hidden lg:flex" : "flex"
      }`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
        {isDeleteSelectionMode ? (
          <div className="flex items-center justify-between h-8">
            <span className="text-[13px] font-bold text-slate-900">{selectedRoomIds.size} Selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDeleteSelectionMode(false);
                  selectedRoomIds.clear();
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelectedChats}
                disabled={selectedRoomIds.size === 0}
                className={`px-2.5 py-1 text-[11px] font-bold text-white rounded-lg transition-all flex items-center gap-1 ${
                  selectedRoomIds.size === 0
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 active:scale-[0.98]"
                }`}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="p-1.5 text-slate-500 hover:text-[#6C4DF6] rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
              </Link>
              <h2 className="text-[15px] font-bold text-slate-900">Messages</h2>
            </div>
            <div className="flex items-center gap-2 relative">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  socketConnected ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    socketConnected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                  }`}
                />
                {socketConnected ? "Online" : "Connecting"}
              </span>
              <button
                onClick={() => setShowListMoreOptions((prev) => !prev)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showListMoreOptions && (
                <>
                  <div className="fixed inset-0 z-[999]" onClick={() => setShowListMoreOptions(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-[1000] bg-white shadow-xl rounded-xl border border-slate-100 w-36 overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setIsDeleteSelectionMode(true);
                        setShowListMoreOptions(false);
                        selectedRoomIds.clear();
                      }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      Delete Chats
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <SidebarSearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleClearSearch={handleClearSearch}
        />

        <SidebarTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          requestChats={requestChats}
          followRequests={followRequests}
        />
      </div>

      {/* Room List */}
      <div role="listbox" className="flex-1 overflow-y-auto cs p-1.5 space-y-0.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))
        ) : filteredRooms.length === 0 &&
          (activeTab !== "requests" ||
            followRequests.filter((n) => !searchQuery || n.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) &&
          (!searchQuery ||
            (globalUsers.filter((u) => !filteredRooms.some((r) => r.type === "direct" && r.members?.some((m) => m._id === u._id))).length === 0 &&
              !isSearchingGlobal)) ? (
          <div className="text-center py-10 px-4 select-none">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {searchQuery ? "No users or conversations found" : (
                <>
                  {activeTab === "chats" && "No conversations yet"}
                  {activeTab === "requests" && "No pending requests"}
                  {activeTab === "groups" && "No group chats yet"}
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            {searchQuery && (filteredRooms.length > 0 || globalUsers.length > 0) && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Existing Chats</div>
            )}
            {filteredRooms.map((room) => (
              <RoomItem
                key={room._id}
                room={room}
                isSelected={activeRoom?._id === room._id}
                isDeleteSelectionMode={isDeleteSelectionMode}
                selectedRoomIds={selectedRoomIds}
                handleToggleRoomSelection={handleToggleRoomSelection}
                currentUserId={currentUserId}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                user={user}
                selectRoom={selectRoom}
              />
            ))}

            {activeTab === "requests" &&
              followRequests
                .filter((n) => !searchQuery || n.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((n) => (
                  <FollowRequestItem
                    key={n._id}
                    n={n}
                    navigate={navigate}
                    handleAcceptFollow={handleAcceptFollow}
                    handleRejectFollow={handleRejectFollow}
                  />
                ))}

            {searchQuery && (
              <>
                <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">People</div>
                {isSearchingGlobal ? (
                  <div className="p-3 text-center text-xs text-slate-400 animate-pulse">Searching...</div>
                ) : globalUsers.filter((u) => !filteredRooms.some((r) => r.type === "direct" && r.members?.some((m) => m._id === u._id))).length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">No new people found</div>
                ) : (
                  globalUsers
                    .filter((u) => !filteredRooms.some((r) => r.type === "direct" && r.members?.some((m) => m._id === u._id)))
                    .map((u) => (
                      <GlobalUserItem
                        key={u._id}
                        u={u}
                        onlineUsers={onlineUsers}
                        handleSelectGlobalUser={handleSelectGlobalUser}
                      />
                    ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
export default ChatSidebar;
