import React from "react";
import { getAvatar, formatTime } from "../../utils/chat/chatHelpers";
import { Check, X, Loader2 } from "lucide-react";

export const FollowRequestItem = ({
  n,
  navigate,
  handleAcceptFollow,
  handleRejectFollow,
  isProcessing = false
}) => {
  const senderId = n?.sender?._id || n?.sender;
  const senderName = n?.sender?.name || "Traveler";
  const senderUsername = n?.sender?.username;

  const onAcceptClick = (e) => {
    e.stopPropagation();
    if (senderId && handleAcceptFollow) {
      handleAcceptFollow(senderId, n?._id);
    }
  };

  const onRejectClick = (e) => {
    e.stopPropagation();
    if (senderId && handleRejectFollow) {
      handleRejectFollow(senderId, n?._id);
    }
  };

  const onProfileClick = (e) => {
    e.stopPropagation();
    if (senderId && navigate) {
      navigate(`/profile/${senderId}`);
    }
  };

  return (
    <div className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex gap-3 hover:bg-slate-50 border border-slate-100 bg-white shadow-xs mb-1.5">
      <div
        className="relative shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
        onClick={onProfileClick}
      >
        <img
          src={getAvatar(n.sender, senderName)}
          alt={senderName}
          className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-xs"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-0.5">
          <div
            className="flex items-center gap-1.5 truncate cursor-pointer hover:opacity-85"
            onClick={onProfileClick}
          >
            <span className="text-[13px] truncate font-bold text-slate-800 hover:text-[#7C3AED] transition-colors">
              {senderName}
            </span>
            <span className="bg-[#F3E8FF] text-[#7C3AED] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
              Follow
            </span>
          </div>
          <span className="text-[10px] whitespace-nowrap ml-2 text-slate-400 font-medium">
            {formatTime(n.createdAt)}
          </span>
        </div>
        {senderUsername && (
          <p className="text-[10px] text-slate-400 truncate mb-1">
            @{senderUsername}
          </p>
        )}
        <div className="flex justify-between items-center mt-1">
          <div className="flex gap-2 w-full">
            <button
              onClick={onAcceptClick}
              disabled={isProcessing}
              className="flex-1 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Accept
            </button>
            <button
              onClick={onRejectClick}
              disabled={isProcessing}
              className="flex-1 py-1.5 bg-white border border-[#E5E7EB] text-[#1E293B] hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowRequestItem;