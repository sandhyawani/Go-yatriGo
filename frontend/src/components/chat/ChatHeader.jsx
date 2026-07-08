import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Compass, Phone, Video, MoreVertical, Trash2 } from "lucide-react";

export const ChatHeader = ({
  activeRoom,
  setActiveRoom,
  currentUserId,
  onlineUsers,
  user,
  getAvatar,
  showHeaderOptions,
  setShowHeaderOptions,
  headerOptionsRef,
  handleReportUser,
  handleBlockUser,
  handleClearChat,
  handleDeleteChat
}) => {
  return (
    <div className="h-16 px-5 bg-white/90 backdrop-blur-md border-b border-slate-100 flex justify-between items-center shrink-0 z-50 sticky top-0 shadow-[0_2px_10px_-5px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveRoom(null)}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg transition-colors lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          {activeRoom.type === "group" ? (
            <div className="w-9 h-9 rounded-xl bg-primary-600/10 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-primary-600" />
            </div>
          ) : (
            <img
              src={getAvatar(activeRoom, activeRoom.name)}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          )}
          {activeRoom.type === "direct" &&
            (() => {
              const other = activeRoom.members?.find(
                (member) => (member._id || member)?.toString() !== currentUserId?.toString()
              );
              const otherId = other?._id || other;
              return otherId && onlineUsers.has(otherId);
            })() && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            )}
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
            {activeRoom.name}
            {activeRoom.type === "group" && (
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                Group
              </span>
            )}
          </h3>
          <div
            className={`text-[11px] font-medium mt-0.5 ${
              activeRoom.type === "group"
                ? "text-slate-400"
                : (() => {
                    const other = activeRoom.members?.find(
                      (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                    );
                    const otherId = other?._id || other;
                    return otherId && onlineUsers.has(otherId);
                  })()
                  ? "text-emerald-500"
                  : "text-slate-400"
            }`}
          >
            {activeRoom.type === "direct" &&
            (() => {
              const other = activeRoom.members?.find(
                (member) => (member._id || member)?.toString() !== currentUserId?.toString()
              );
              const otherId = other?._id || other;
              return otherId && user?.blockedUsers?.includes(otherId);
            })() ? (
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[11px] inline-block">
                🔒 Blocked
              </span>
            ) : activeRoom.type === "group" ? (
              `${activeRoom.members?.length || 0} members`
            ) : (() => {
                const other = activeRoom.members?.find(
                  (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                );
                const otherId = other?._id || other;
                return otherId && onlineUsers.has(otherId);
              })() ? (
              "Online"
            ) : (
              "Offline"
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {activeRoom.travelGroupId && (
          <Link
            to={`/social/buddy/${activeRoom.travelGroupId._id || activeRoom.travelGroupId}`}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[12px] font-semibold transition-all"
          >
            <Compass className="w-3.5 h-3.5" /> Trip
          </Link>
        )}
        <button
          aria-label="Start voice call"
          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-all hidden sm:flex"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          aria-label="Start video call"
          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-all hidden sm:flex"
        >
          <Video className="w-4 h-4" />
        </button>
        <div ref={headerOptionsRef} className="relative">
          <button
            onClick={() => setShowHeaderOptions(!showHeaderOptions)}
            aria-label="More options"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showHeaderOptions && (
            <div className="absolute right-4 top-10 z-[9999] w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-100 overflow-hidden py-1 flex flex-col">
              {activeRoom.type === "direct" &&
                (() => {
                  const otherUser = activeRoom.members?.find(
                    (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                  );
                  const isBlocked =
                    otherUser &&
                    user?.blockedUsers?.includes(otherUser._id || otherUser);
                  return (
                    <>
                      <button
                        onClick={handleReportUser}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
                      >
                        Report User
                      </button>
                      <button
                        onClick={handleBlockUser}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
                      >
                        {isBlocked ? "Unblock User" : "Block User"}
                      </button>
                      <div className="border-t border-slate-100"></div>
                    </>
                  );
                })()}
              <button
                onClick={handleClearChat}
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
              >
                Clear Chat
              </button>
              <button
                onClick={(e) => handleDeleteChat(activeRoom, e)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;