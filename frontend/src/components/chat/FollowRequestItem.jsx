import React from "react";
import { getAvatar, formatTime } from "../../utils/chat/chatHelpers";

export const FollowRequestItem = ({
  n,
  navigate,
  handleAcceptFollow,
  handleRejectFollow
}) => {
  return (
    <div className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-brand-50/50 border border-transparent">
      <div
        className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate(`/profile/${n.sender?._id}`)}
      >
        <img
          src={getAvatar(n.sender, n.sender?.name)}
          alt={n.sender?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-0.5">
          <div
            className="flex items-center gap-1.5 truncate cursor-pointer hover:opacity-80"
            onClick={() => navigate(`/profile/${n.sender?._id}`)}
          >
            <span className="text-[13px] truncate font-medium text-slate-700 hover:underline">
              {n.sender?.name}
            </span>
            <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
              Follow
            </span>
          </div>
          <span className="text-[10px] whitespace-nowrap ml-2 text-slate-400">
            {formatTime(n.createdAt)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="flex gap-2 w-full">
            <button
              onClick={(e) => handleAcceptFollow(e, n.sender?._id)}
              className="flex-1 py-1 bg-brand-500 text-white text-[11px] font-bold rounded hover:bg-brand-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={(e) => handleRejectFollow(e, n.sender?._id)}
              className="flex-1 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded hover:bg-slate-200 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FollowRequestItem;

