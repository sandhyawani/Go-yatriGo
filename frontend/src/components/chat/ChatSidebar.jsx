import React from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Trash2,
  MoreVertical,
  Search,
  X,
  MessageSquare,
  Users,
  Check,
  ArrowLeft
} from "lucide-react";

export const ChatSidebar = ({
  isDeleteSelectionMode,
  selectedRoomIds,
  setIsDeleteSelectionMode,
  setSelectedRoomIds,
  handleDeleteSelectedChats,
  socketConnected,
  showListMoreOptions,
  setShowListMoreOptions,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  requestChats,
  followRequests,
  loading,
  filteredRooms,
  activeRoom,
  handleSelectRoom,
  handleToggleRoomSelection,
  currentUserId,
  onlineUsers,
  getAvatar,
  getLatestMessagePreview,
  formatTime,
  isSearchingGlobal,
  globalUsers,
  handleSelectGlobalUser,
  handleAcceptFollowRequest,
  handleDeclineFollowRequest
}) => {
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
            <span className="text-[13px] font-bold text-slate-900">
              {selectedRoomIds.size} Selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsDeleteSelectionMode(false);
                  setSelectedRoomIds(new Set());
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
                className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
              </Link>
              <h2 className="text-[15px] font-bold text-slate-900">Messages</h2>
            </div>
            <div className="flex items-center gap-2 relative">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  socketConnected
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    socketConnected
                      ? "bg-emerald-500"
                      : "bg-amber-400 animate-pulse"
                  }`}
                />
                {socketConnected ? "Online" : "Connecting"}
              </span>
              <button
                onClick={() => setShowListMoreOptions((prev) => !prev)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showListMoreOptions && (
                <>
                  <div
                    className="fixed inset-0 z-[999]"
                    onClick={() => setShowListMoreOptions(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-[1000] bg-white shadow-xl rounded-xl border border-slate-100 w-36 overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setIsDeleteSelectionMode(true);
                        setShowListMoreOptions(false);
                        setSelectedRoomIds(new Set());
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

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-[13px] pl-8 pr-8 py-2 rounded-lg outline-none border border-slate-200 focus:border-primary-600/40 focus:ring-2 focus:ring-primary-600/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border-b border-transparent">
          {["chats", "requests", "groups"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-[11px] font-semibold capitalize rounded-md transition-all ${
                activeTab === tab
                  ? "bg-white shadow-sm text-brand-600 border-b-2 border-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {tab === "requests" &&
                requestChats.length + followRequests.length > 0 && (
                  <span className="ml-1 bg-[#FF5A7A] text-white px-1 py-0.5 rounded-full text-[9px]">
                    {requestChats.length + followRequests.length}
                  </span>
                )}
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <div
        role="listbox"
        className="flex-1 overflow-y-auto cs p-1.5 space-y-0.5"
      >
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
            followRequests.filter(
              (n) =>
                !searchQuery ||
                n.sender?.name
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase()),
            ).length === 0) &&
          (!searchQuery ||
            (globalUsers.filter(
              (u) =>
                !filteredRooms.some(
                  (r) =>
                    r.type === "direct" &&
                    r.members?.some((m) => m._id === u._id),
                ),
            ).length === 0 &&
              !isSearchingGlobal)) ? (
          <div className="text-center py-10 px-4 select-none">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {searchQuery ? (
                "No users or conversations found"
              ) : (
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
            {/* Follow Requests section inside requests tab */}
            {activeTab === "requests" &&
              followRequests
                .filter(
                  (n) =>
                    !searchQuery ||
                    n.sender?.name
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                )
                .map((req) => (
                  <div
                    key={req._id}
                    className="p-3 rounded-2xl bg-[#fafafa]/50 border border-slate-100 flex flex-col gap-2.5 mb-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getAvatar(req.sender, req.sender?.name)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-slate-800 truncate">
                          {req.sender?.name || "Traveler"}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          @{req.sender?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFollowRequest(req)}
                        className="flex-1 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold transition-all shadow-sm shadow-primary-600/10 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineFollowRequest(req)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}

            {/* Room items */}
            {filteredRooms.map((room) => {
              const isSelected = activeRoom?._id === room._id;
              const hasUnread =
                room.unreadCount > 0 && activeRoom?._id !== room._id;

              return (
                <div
                  key={room._id}
                  className={`group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-300 ${
                    isSelected
                      ? "bg-brand-50/70 border border-brand-100/30"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                  onClick={() =>
                    isDeleteSelectionMode
                      ? handleToggleRoomSelection(room._id)
                      : handleSelectRoom(room)
                  }
                >
                  {isDeleteSelectionMode && (
                    <div className="shrink-0 flex items-center justify-center">
                      <div
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                          selectedRoomIds.has(room._id)
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selectedRoomIds.has(room._id) && (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="relative shrink-0">
                    {room.type === "group" ? (
                      <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center shadow-inner">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                    ) : (
                      <img
                        src={getAvatar(room, room.name)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100"
                      />
                    )}
                    {room.type === "direct" &&
                      (() => {
                        const other = room.members?.find(
                          (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                        );
                        const otherId = other?._id || other;
                        return otherId && onlineUsers.has(otherId);
                      })() && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[13px] truncate font-bold text-slate-800">
                        {room.name}
                      </span>
                      {room.latestMessage && (
                        <span className="text-[10px] font-medium text-slate-400 shrink-0 select-none pl-2">
                          {formatTime(room.latestMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[12px] truncate pr-2 ${
                          hasUnread
                            ? "font-semibold text-slate-900"
                            : "font-normal text-slate-400"
                        }`}
                      >
                        {getLatestMessagePreview(room.latestMessage, currentUserId)}
                      </p>
                      {hasUnread && (
                        <span className="h-4.5 min-w-[18px] px-1 bg-primary-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm shrink-0">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Global users search results section */}
            {searchQuery && (
              <>
                <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100/50 mt-2 select-none">
                  Global Search
                </div>
                {isSearchingGlobal ? (
                  <div className="p-3 text-center text-xs text-slate-400 animate-pulse">
                    Searching...
                  </div>
                ) : globalUsers.filter(
                    (u) =>
                      !filteredRooms.some(
                        (r) =>
                          r.type === "direct" &&
                          r.members?.some((m) => m._id === u._id),
                      ),
                  ).length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No new people found
                  </div>
                ) : (
                  globalUsers
                    .filter(
                      (u) =>
                        !filteredRooms.some(
                          (r) =>
                            r.type === "direct" &&
                            r.members?.some((m) => m._id === u._id),
                        ),
                    )
                    .map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleSelectGlobalUser(u)}
                        className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-brand-50/50 hover:-translate-y-[1px] hover:shadow-sm border border-transparent"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={getAvatar(u, u.name)}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {onlineUsers.has(u._id) && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[13px] truncate font-medium text-slate-700">
                              {u.name}
                            </span>
                          </div>
                          <p className="text-[12px] truncate pr-2 font-normal text-[#888780]">
                            {u.role || u.type || "Traveler"}
                          </p>
                        </div>
                      </button>
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

