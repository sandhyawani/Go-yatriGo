import React from "react";
import { Heart, MessageCircle, UserPlus, Compass, Trash2 } from "lucide-react";
import { formatTime, getAvatar } from "../../utils/chat/chatHelpers";
import { chatService } from "../../services/chatService";

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
  handleDeleteNotification,
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

  const handleClick = async () => {
    markAsRead(n._id);
    setShowNotifPanel(false);
    const type = (n.type || "").toLowerCase();
    const senderId = n.sender?._id || n.sender?.id;
    const memoryId = typeof n.post === "object" ? n.post?._id : n.post;
    const dispatchId = typeof n.story === "object" ? n.story?._id : n.story;

    if (type === "follow" || type === "follow_request" || type === "new_follower") {
      if (senderId) navigate(`/profile/${senderId}`);
    } else if (memoryId || type === "post_like" || type === "post_comment" || type.includes("memory")) {
      if (memoryId && senderId) {
        navigate(`/profile/${senderId}?postId=${memoryId}`);
      } else {
        navigate(senderId ? `/profile/${senderId}` : "/");
      }
    } else if (dispatchId || type === "story_like" || type === "story_reply") {
      navigate("/", { state: dispatchId ? { dispatchId } : undefined });
    } else if (n.type === "buddy_request" || n.type === "buddy_approved" || n.type === "buddy_rejected") {
      navigate(`/social/buddy/${n.relatedId}`);
    } else if (type === "message_request" || type === "new_message" || type === "direct") {
      const roomId = typeof n.room === "object" ? n.room?._id : n.room;
      if (roomId) {
        navigate(`/social/chat/${roomId}`);
        return;
      }

      const targetUserId = n.sender?._id || n.sender?.id;
      if (targetUserId) {
        try {
          const directRoomId = await chatService.getDirectRoomId(targetUserId);
          if (directRoomId) {
            navigate(`/social/chat/${directRoomId}`);
            return;
          }
        } catch {
        }
      }
      navigate("/social/chat");
    } else {
      navigate(`/`);
    }
  };

  return (
    <div
    onClick={handleClick}
    className={`p-3.5 rounded-2xl border transition-all duration-300 relative flex items-start gap-3 cursor-pointer ${
    n.isRead ?
    "bg-white border-slate-100/50 hover/50" :
    "bg-brand-50/20 border-brand-100/30 hover:bg-brand-50/30 shadow-2xs"
    }`}>

      {!n.isRead &&
      <div className="absolute right-3.5 top-3.5 w-1.5 h-1.5 bg-brand rounded-full" />}


      <div className="relative shrink-0">
        <img
        src={getAvatar(n.sender, n.sender?.name)}
        alt=""
        className="w-9 h-9 rounded-full object-cover border border-slate-100" />

        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center">
          {getNotifIcon(n.type)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] leading-relaxed text-text-primary">
          <span className="font-bold text-text-primary pr-1 hover:underline">{n.sender?.name}</span>
          {n.message || n.content || n.text || ""}
        </div>
        <span className="text-[10px] text-text-muted font-medium block mt-1.5">{formatTime(n.createdAt)}</span>

        {!n.isRead &&
        <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {n.type === "follow_request" &&
          <>
                <button
            onClick={(e) => handleAcceptRequest(e, n.sender?._id)}
            className="btn-primary">

                  Accept
                </button>
                <button
            onClick={(e) => handleRejectRequest(e, n.sender?._id)}
            className="px-3.5 py-1 bg-background text-text-secondary text-[11px] font-bold rounded-lg hover transition-all">

                  Decline
                </button>
              </>}


            {n.type === "message_request" &&
          <>
                <button
            onClick={(e) => handleAcceptMessage(e, n.relatedId, n._id)}
            className="btn-primary">

                  Accept Chat
                </button>
                <button
            onClick={(e) => handleRejectMessage(e, n.relatedId, n._id)}
            className="px-3.5 py-1 bg-background text-text-secondary text-[11px] font-bold rounded-lg hover transition-all">

                  Decline Chat
                </button>
              </>}


            {n.type === "buddy_request" &&
          <>
                <button
            onClick={(e) => handleAcceptJoin(e, n.relatedId, n.requestId, n._id)}
            className="btn-primary">

                  Approve Squad
                </button>
                <button
            onClick={(e) => handleRejectJoin(e, n.relatedId, n.requestId, n._id)}
            className="px-3.5 py-1 bg-background text-text-secondary text-[11px] font-bold rounded-lg hover transition-all">

                  Reject Squad
                </button>
              </>}

          </div>}

      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (handleDeleteNotification) handleDeleteNotification(n._id);
        }}
        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-1 shrink-0 self-start"
        title="Delete notification"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
export default NotificationItem;