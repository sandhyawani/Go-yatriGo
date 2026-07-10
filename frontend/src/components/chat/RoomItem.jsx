import React from "react";
import { Users } from "lucide-react";
import { getAvatar, formatTime, getLatestMessagePreview } from "../../utils/chat/chatHelpers";

export const RoomItem = ({
  room,
  isSelected,
  isDeleteSelectionMode,
  selectedRoomIds,
  handleToggleRoomSelection,
  currentUserId,
  onlineUsers,
  typingUsers,
  user,
  selectRoom
}) => {
  const otherMember = room.members?.find(
    (member) => (member._id || member)?.toString() !== currentUserId?.toString()
  );
  const isOnline = otherMember && onlineUsers.has(otherMember._id || otherMember);
  const isTyping = typingUsers[room._id];
  const isBlockedByMe = otherMember && user?.blockedUsers?.includes(otherMember._id || otherMember);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isDeleteSelectionMode) {
          handleToggleRoomSelection(room._id);
        } else {
          selectRoom(room);
        }
      }}
      className={`group relative w-full text-left px-3 py-2.5 transition-all duration-300 flex items-center gap-3 cursor-pointer ${
        isSelected
          ? "bg-brand-50 border-l-4 border-brand-600 text-brand-900 rounded-r-xl"
          : "hover:bg-slate-50 border-l-4 border-transparent text-slate-700"
      }`}
    >
      {isDeleteSelectionMode && (
        <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedRoomIds.has(room._id)}
            onChange={() => handleToggleRoomSelection(room._id)}
            className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-600 cursor-pointer"
          />
        </div>
      )}
      <div className="relative shrink-0">
        {room.type === "group" ? (
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-600" />
          </div>
        ) : (
          <img
            src={getAvatar(room, room.name)}
            alt={room.name}
            className={`w-10 h-10 rounded-full object-cover ${isBlockedByMe ? "opacity-50 grayscale" : ""}`}
          />
        )}
        {isOnline && room.type === "direct" && !isBlockedByMe && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`text-sm truncate ${
                room.unreadCount > 0 ? "font-bold text-slate-900" : "font-medium text-slate-700"
              }`}
            >
              {room.name}
            </span>
            {room.type === "direct" && !isBlockedByMe && (
              <span
                className={`text-xs font-semibold shrink-0 ${
                  isOnline ? "text-emerald-500" : "text-slate-400"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            )}
            {isBlockedByMe && (
              <span className="bg-slate-100 text-slate-500 text-xs rounded-full px-2 py-0.5 shrink-0">
                🔒 Blocked
              </span>
            )}
          </div>
          {room.latestMessage && (
            <span
              className={`text-xs whitespace-nowrap ml-2 ${
                room.unreadCount > 0 ? "font-bold text-brand-600" : "text-slate-400"
              }`}
            >
              {formatTime(room.latestMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p
            className={`text-sm truncate pr-2 ${
              room.unreadCount > 0 ? "font-medium text-slate-900" : "font-normal text-slate-500"
            }`}
          >
            {isTyping ? (
              <span className="text-brand-600 italic">{isTyping} typing...</span>
            ) : room.latestMessage ? (
              getLatestMessagePreview(room.latestMessage, currentUserId)
            ) : (
              "Start chatting"
            )}
          </p>
          {room.unreadCount > 0 && !isSelected && (
            <span className="bg-brand-600 text-white min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-xs font-bold shrink-0">
              {room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default RoomItem;

