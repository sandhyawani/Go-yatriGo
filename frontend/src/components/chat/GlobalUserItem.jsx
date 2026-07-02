import React from "react";
import { getAvatar } from "../../utils/chat/chatHelpers";

export const GlobalUserItem = ({
  u,
  onlineUsers,
  handleSelectGlobalUser
}) => {
  return (
    <button
      onClick={() => handleSelectGlobalUser(u)}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-purple-50/50 hover:-translate-y-[1px] hover:shadow-sm border border-transparent"
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
  );
};
export default GlobalUserItem;
