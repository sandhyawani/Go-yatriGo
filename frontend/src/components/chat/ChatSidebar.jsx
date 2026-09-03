import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Trash2, MoreVertical, Search, X, MessageSquare, Users, Check, EyeOff, Loader2, Send, Clock, UserMinus } from "lucide-react";

const GroupSidebarAvatar = ({ room }) => {
  const [imgError, setImgError] = React.useState(false);

  if (room.pic && !imgError) {
    return (
      <img
      src={room.pic}
      alt=""
      onError={() => setImgError(true)}
      className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" />);


  }

  return (
    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shadow-sm border border-brand/10">
      <Users className="w-5 h-5 text-brand" />
    </div>);

};

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
  sentRequests = [],
  handleCancelSentRequest,
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
  handleDeclineFollowRequest,
  processingRequestIds = new Set()
}) => {
  const navigate = useNavigate();
  const [requestSubTab, setRequestSubTab] = useState("received");

  const handleProfileClick = (e, room) => {
    if (room.type === "direct") {
      e.stopPropagation();
      const otherUser = room.members?.find(
      (member) => (member._id || member)?.toString() !== currentUserId?.toString()
      );
      const targetId = otherUser?._id || otherUser || currentUserId;
      if (targetId) {
        navigate(targetId.toString() === currentUserId?.toString() ? `/profile` : `/profile/${targetId}`);
      }
    }
  };

  return (
    <aside
    className={`w-full lg:w-[300px] border-r border-slate-100 bg-white flex flex-col shrink-0 h-full ${
    activeRoom ? "hidden lg:flex" : "flex"
    }`}>

      <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
        {isDeleteSelectionMode ?
        (() => {
          const selectedRoomsList = filteredRooms.filter((r) => selectedRoomIds.has(r._id));
          const isOnlyJourneyGroups = selectedRoomsList.length > 0 && selectedRoomsList.every((r) => r.journeyId);

          return (
            <div className={`flex items-center justify-between py-2 px-1.5 -mx-1 rounded-xl border ${isOnlyJourneyGroups ? 'bg-brand/5 border-brand/10' : 'bg-red-50/50 border-red-100/50'}`}>
                <div className="flex items-center gap-1.5 pl-1 shrink-0">
                  <span className={`flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] font-bold ${isOnlyJourneyGroups ? 'bg-brand/10 text-brand' : 'bg-red-100 text-red-600'}`}>
                    {selectedRoomIds.size}
                  </span>
                  <span className={`text-[12px] font-semibold ${isOnlyJourneyGroups ? 'text-brand' : 'text-red-900'}`}>
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                onClick={() => {
                  setIsDeleteSelectionMode(false);
                  setSelectedRoomIds(new Set());
                }}
                className="px-2 py-1.5 text-[11px] font-bold text-text-secondary hover:bg-white/60 hover:text-text-primary rounded-lg transition-all whitespace-nowrap">

                    Cancel
                  </button>
                  {selectedRoomIds.size > 0 &&
                <button
                onClick={handleDeleteSelectedChats}
                className={`px-2 py-1.5 text-[11px] font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap ${
                isOnlyJourneyGroups ? "bg-brand hover:bg-brand-dark active:scale-[0.98] shadow-brand/20" : "bg-red-500 hover:bg-red-600 active:scale-[0.98] shadow-red-200"
                }`}>

                      {isOnlyJourneyGroups ? <EyeOff className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                      {isOnlyJourneyGroups ? "Hide" : "Delete Chat"}
                    </button>}

                </div>
              </div>);

        })() :

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
            to="/"
            className="p-1.5 text-text-muted hover:text-primary-600 rounded-lg hover:bg-background transition-colors flex items-center justify-center"
            title="Back to Home">

                <Home className="w-4 h-4" />
              </Link>
              <h2 className="text-[15px] font-bold text-text-primary">Messages</h2>
            </div>
            <div className="flex items-center gap-2 relative">
              <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            socketConnected ?
            "bg-emerald-50 text-emerald-600" :
            "bg-amber-50 text-amber-600"
            }`}>

                <span
              className={`w-1.5 h-1.5 rounded-full ${
              socketConnected ?
              "bg-emerald-500" :
              "bg-amber-400 animate-pulse"
              }`} />

                {socketConnected ? "Online" : "Connecting"}
              </span>
              <button
            onClick={() => setShowListMoreOptions((prev) => !prev)}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-background transition-colors flex items-center justify-center"
            title="Options">

                <MoreVertical className="w-4 h-4" />
              </button>
              {showListMoreOptions &&
            <>
                  <div
              className="fixed inset-0 z-[999]"
              onClick={() => setShowListMoreOptions(false)} />

                  <div className="absolute right-0 top-full mt-1.5 z-[1000] bg-white shadow-xl rounded-xl border border-slate-100 w-36 overflow-hidden py-1">
                    <button
                onClick={() => {
                  setIsDeleteSelectionMode(true);
                  setShowListMoreOptions(false);
                  setSelectedRoomIds(new Set());
                }}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-text-primary hover transition-colors flex items-center gap-2">

                      <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                      Delete Chats
                    </button>
                  </div>
                </>}

            </div>
          </div>}


        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background text-sm pl-9 pr-9 py-2 rounded-xl outline-none border border-border-default focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200" />

          {searchQuery &&
          <button
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">

              <X className="w-4 h-4" />
            </button>}

        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-border-default gap-1">
          {["chats", "requests", "groups"].map((tab) =>
          <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all duration-200 ${
          activeTab === tab ?
          "bg-brand text-white shadow-sm" :
          "text-text-muted hover:text-text-primary"
          }`}>

              {tab}
              {tab === "requests" &&
            (requestChats.length + followRequests.length > 0 || sentRequests.length > 0) &&
            <span className="ml-1 bg-brand text-white px-1.5 py-0.5 rounded-full text-[9px]">
                    {requestChats.length + followRequests.length + sentRequests.length}
                  </span>}

            </button>
          )}
        </div>

        {activeTab === "requests" && (
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 gap-1 mt-1.5">
            <button
              onClick={() => setRequestSubTab("received")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                requestSubTab === "received"
                  ? "bg-white text-brand shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>Received</span>
              {requestChats.length + followRequests.length > 0 && (
                <span className="bg-brand text-white px-1 py-0.2 rounded-full text-[9px]">
                  {requestChats.length + followRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRequestSubTab("sent")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                requestSubTab === "sent"
                  ? "bg-white text-brand shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Sent</span>
              {sentRequests.length > 0 && (
                <span className="bg-slate-200 text-slate-700 px-1 py-0.2 rounded-full text-[9px]">
                  {sentRequests.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div
      role="listbox"
      className="flex-1 overflow-y-auto cs p-1.5 pb-24 lg:pb-1.5 space-y-0.5">

        {loading ?
        Array.from({ length: 5 }).map((_, i) =>
        <div key={i} className="p-3 rounded-xl animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-background rounded-full shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2.5 bg-background rounded w-1/2" />
                <div className="h-2.5 bg-background rounded w-3/4" />
              </div>
            </div>
        ) :
        activeTab === "requests" && requestSubTab === "sent" ? (
          sentRequests.length === 0 ? (
            <div className="text-center py-10 px-4 select-none">
              <Send className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-medium text-text-muted">
                No pending sent requests
              </p>
            </div>
          ) : (
            sentRequests
              .filter((req) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const recipient = req.recipient || req.receiver;
                return (
                  (recipient?.name || "").toLowerCase().includes(q) ||
                  (recipient?.username || "").toLowerCase().includes(q) ||
                  (req.message || "").toLowerCase().includes(q)
                );
              })
              .map((req) => {
                const reqKey = req._id || req.id || req.cancelId;
                const recipientUser = req.recipient || req.receiver;
                const recipientName = recipientUser?.name || recipientUser?.username || req.targetName || "Traveler";
                const isProcessing = processingRequestIds.has(reqKey);

                return (
                  <div
                    key={reqKey}
                    className="p-3 rounded-2xl bg-background/50 border border-slate-100 flex flex-col gap-2.5 mb-1.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={getAvatar(recipientUser, recipientName)}
                        alt={recipientName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-xs cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = req.targetId || recipientUser?._id;
                          if (targetId) navigate(`/profile/${targetId}`);
                        }}
                      />
                      <div
                        className="flex-1 min-w-0 cursor-pointer hover:opacity-85"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = req.targetId || recipientUser?._id;
                          if (targetId) navigate(`/profile/${targetId}`);
                        }}
                      >
                        <h4 className="text-[12px] font-bold text-text-primary truncate hover:text-brand transition-colors">
                          {recipientName}
                        </h4>
                        <p className="text-[10px] text-text-muted truncate">
                          {req.message}
                        </p>
                      </div>
                      <span className="text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handleCancelSentRequest) {
                            handleCancelSentRequest(req);
                          }
                        }}
                        disabled={isProcessing}
                        className="flex-1 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-rose-600 text-[11px] font-semibold transition-all duration-200 border border-rose-200/70 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                        Cancel Request
                      </button>
                    </div>
                  </div>
                );
              })
          )
        ) :
        filteredRooms.length === 0 && (
        activeTab !== "requests" ||
        followRequests.filter(
        (n) =>
        !searchQuery ||
        n.sender?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
        ).length === 0) && (
        !searchQuery ||
        globalUsers.filter(
        (u) =>
        !filteredRooms.some(
        (r) =>
        r.type === "direct" &&
        r.members?.some((m) => m._id === u._id)
        )
        ).length === 0 &&
        !isSearchingGlobal) ?
        <div className="text-center py-10 px-4 select-none">
            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-medium text-text-muted">
              {searchQuery ?
            "No users or conversations found" :

            <>
                  {activeTab === "chats" && "Your conversations will appear here."}
                  {activeTab === "requests" && "No new chat requests"}
                  {activeTab === "groups" && "Your journey groups will appear here."}
                </>}

            </p>
          </div> :

        <>
            {activeTab === "requests" && requestSubTab === "received" &&
          followRequests
          .filter(
          (n) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              (n.sender?.name || "").toLowerCase().includes(q) ||
              (n.sender?.username || "").toLowerCase().includes(q)
            );
          }
          )
          .map((req) => {
            const senderId = req.sender?._id || req.sender;
            const isProcessing = processingRequestIds.has(req._id || senderId);
            return (
              <div
              key={req._id}
              className="p-3 rounded-2xl bg-background/50 border border-slate-100 flex flex-col gap-2.5 mb-1.5 shadow-xs">

                        <div className="flex items-center gap-2.5">
                          <img
                  src={getAvatar(req.sender, req.sender?.name)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-xs cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (senderId) navigate(`/profile/${senderId}`);
                  }} />

                          <div
                  className="flex-1 min-w-0 cursor-pointer hover:opacity-85"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (senderId) navigate(`/profile/${senderId}`);
                  }}>
                            <h4 className="text-[12px] font-bold text-text-primary truncate hover:text-brand transition-colors">
                              {req.sender?.name || "Traveler"}
                            </h4>
                            <p className="text-[10px] text-text-muted truncate">
                              @{req.sender?.username || "traveler"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptFollowRequest(senderId, req._id);
                  }}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 rounded-xl bg-brand hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-all duration-200 shadow-soft flex items-center justify-center gap-1">

                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                          <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeclineFollowRequest(senderId, req._id);
                  }}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 rounded-xl bg-white border border-border-default text-text-primary hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-semibold transition-all duration-200 flex items-center justify-center gap-1">

                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
            );
          })}

            {filteredRooms.map((room) => {
            const isSelected = activeRoom?._id === room._id;
            const hasUnread =
            room.unreadCount > 0 && activeRoom?._id !== room._id;

            return (
              <div
              key={room._id}
              className={`group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-200 ${
              isSelected ?
              "bg-brand-50/30 border-l-[3px] border-l-brand border-y border-r border-y-brand/15 border-r-brand/15 pl-2.5" :
              "hover/80 border border-transparent"
              }`}
              onClick={() =>
              isDeleteSelectionMode ?
              handleToggleRoomSelection(room._id) :
              handleSelectRoom(room)}>


                  {isDeleteSelectionMode &&
                <div className="shrink-0 flex items-center justify-center">
                      <div
                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                  selectedRoomIds.has(room._id) ?
                  "bg-red-500 border-red-500 text-white" :
                  "border-slate-300 bg-white"
                  }`}>

                        {selectedRoomIds.has(room._id) &&
                    <Check className="w-3 h-3 stroke-[3]" />}

                      </div>
                    </div>}


                  <div className="relative shrink-0">
                    {room.type === "group" || room.type === "journey" || room.travelGroupId || room.journeyId ?
                  <GroupSidebarAvatar room={room} /> :

                  <img
                  src={getAvatar(room, room.name)}
                  alt=""
                  className={`w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100 ${
                  room.type === "direct" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                  }`}
                  onClick={(e) => handleProfileClick(e, room)} />}


                    {room.type === "direct" &&
                  (() => {
                    const other = room.members?.find(
                    (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                    );
                    const otherId = other?._id || other;
                    return otherId && onlineUsers.has(otherId);
                  })() &&
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}

                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[13px] truncate font-bold text-text-primary">
                        {room.name}
                      </span>
                      {room.latestMessage &&
                    <span className="text-[10px] font-medium text-text-muted shrink-0 select-none pl-2">
                          {formatTime(room.latestMessage.createdAt)}
                        </span>}

                    </div>
                    <div className="flex items-center justify-between">
                      <p
                    className={`text-[12px] truncate pr-2 ${
                    hasUnread ?
                    "font-semibold text-text-primary" :
                    "font-normal text-text-muted"
                    }`}>

                        {getLatestMessagePreview(room.latestMessage, currentUserId)}
                      </p>
                      {hasUnread &&
                    <span className="h-[18px] min-w-[18px] px-1.5 bg-brand text-white rounded-full text-[10px] font-semibold flex items-center justify-center shadow-sm shrink-0">
                          {room.unreadCount}
                        </span>}

                    </div>
                  </div>
                </div>);

          })}

            {activeTab === "chats" && searchQuery &&
          <>
                <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-text-muted border-t border-slate-100/50 mt-2 select-none">
                  Global Search
                </div>
                {isSearchingGlobal ?
            <div className="p-3 text-center text-xs text-text-muted animate-pulse">
                    Searching...
                  </div> :
            globalUsers.filter(
            (u) =>
            !filteredRooms.some(
            (r) =>
            r.type === "direct" &&
            r.members?.some((m) => m._id === u._id)
            )
            ).length === 0 ?
            <div className="p-3 text-center text-xs text-text-muted">
                    No new people found
                  </div> :

            globalUsers
            .filter(
            (u) =>
            !filteredRooms.some(
            (r) =>
            r.type === "direct" &&
            r.members?.some((m) => m._id === u._id)
            )
            )
            .map((u) =>
            <button
            key={u._id}
            onClick={() => handleSelectGlobalUser(u)}
            className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-brand-50/50 hover:-translate-y-[1px] hover:shadow-sm border border-transparent">

                        <div className="relative shrink-0">
                          <img
                src={getAvatar(u, u.name)}
                alt={u.name}
                className="w-10 h-10 rounded-full object-cover" />

                          {onlineUsers.has(u._id) &&
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}

                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[13px] truncate font-medium text-text-primary">
                              {u.name}
                            </span>
                          </div>
                          <p className="text-[12px] truncate pr-2 font-normal text-text-muted">
                            {u.role || u.type || "Traveler"}
                          </p>
                        </div>
                      </button>
            )}

              </>}

          </>}

      </div>
    </aside>);

};

export default ChatSidebar;