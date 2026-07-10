import React from "react";
import { Heart, MessageCircle, UserPlus, Compass } from "lucide-react";
import { formatTime, getAvatar } from "../../utils/chat/chatHelpers";

export const NotificationItem = ({
  n,
  navigate,
  handleAcceptRequest,
  handleRejectRequest,
  handleAcceptMessage,
  handleRejectMessage,
  handleAcceptJoin,
  handleRejectJoin,
  markAsRead,
  setShowNotifPanel
}) => {
  const getNotifIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />;
      case "comment":
        return <MessageCircle className="w-3.5 h-3.5 text-brand-500 fill-brand-50" />;
      case "follow":
      case "follow_request":
        return <UserPlus className="w-3.5 h-3.5 text-brand-500" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const handleClick = () => {
    markAsRead(n._id);
    setShowNotifPanel(false);
    if (n.type === "follow" || n.type === "follow_request") {
      navigate(`/profile/${n.sender?._id}`);
    } else if (n.type === "buddy_request" || n.type === "buddy_approved" || n.type === "buddy_rejected") {
      navigate(`/social/buddy/${n.relatedId}`);
    } else if (n.type === "message_request") {
      navigate(`/social/chat`);
    } else {
      navigate(`/`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3.5 rounded-2xl border transition-all duration-300 relative flex items-start gap-3 cursor-pointer ${
        n.isRead
          ? "bg-white border-slate-100/50 hover:bg-slate-50/50"
          : "bg-brand-50/20 border-brand-100/30 hover:bg-brand-50/30 shadow-[0_2px_8px_rgba(108,77,246,0.02)]"
      }`}
    >
      {!n.isRead && (
        <div className="absolute right-3.5 top-3.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
      )}

      <div className="relative shrink-0">
        <img
          src={getAvatar(n.sender, n.sender?.name)}
          alt=""
          className="w-9 h-9 rounded-full object-cover border border-slate-100"
        />
        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center">
          {getNotifIcon(n.type)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] leading-relaxed text-slate-700">
          <span className="font-bold text-slate-900 pr-1 hover:underline">{n.sender?.name}</span>
          {n.text}
        </div>
        <span className="text-[10px] text-slate-400 font-medium block mt-1.5">{formatTime(n.createdAt)}</span>

        {/* Action Controls */}
        {!n.isRead && (
          <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {n.type === "follow_request" && (
              <>
                <button
                  onClick={(e) => handleAcceptRequest(e, n.sender?._id)}
                  className="px-3.5 py-1 bg-brand-500 text-white text-[11px] font-bold rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all"
                >
                  Accept
                </button>
                <button
                  onClick={(e) => handleRejectRequest(e, n.sender?._id)}
                  className="px-3.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-all"
                >
                  Decline
                </button>
              </>
            )}

            {n.type === "message_request" && (
              <>
                <button
                  onClick={(e) => handleAcceptMessage(e, n.relatedId, n._id)}
                  className="px-3.5 py-1 bg-brand-500 text-white text-[11px] font-bold rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all"
                >
                  Accept Chat
                </button>
                <button
                  onClick={(e) => handleRejectMessage(e, n.relatedId, n._id)}
                  className="px-3.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-all"
                >
                  Decline Chat
                </button>
              </>
            )}

            {n.type === "buddy_request" && (
              <>
                <button
                  onClick={(e) => handleAcceptJoin(e, n.relatedId, n.requestId, n._id)}
                  className="px-3.5 py-1 bg-brand-500 text-white text-[11px] font-bold rounded-lg hover:bg-brand-600 active:scale-[0.98] transition-all"
                >
                  Approve Squad
                </button>
                <button
                  onClick={(e) => handleRejectJoin(e, n.relatedId, n.requestId, n._id)}
                  className="px-3.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-all"
                >
                  Reject Squad
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default NotificationItem;

