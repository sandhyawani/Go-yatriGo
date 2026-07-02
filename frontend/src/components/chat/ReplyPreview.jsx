import React from "react";
import { X } from "lucide-react";

export const ReplyPreview = ({ replyToMsg, setReplyToMsg, user }) => {
  if (!replyToMsg) return null;

  return (
    <div className="mb-2 p-2 bg-slate-50 border-l-4 border-[#7F77DD] rounded-r-lg flex items-center justify-between shadow-sm mx-2 mt-1">
      <div className="flex-1 overflow-hidden">
        <div className="text-[11px] font-bold text-[#7F77DD]">
          Replying to{" "}
          {replyToMsg.sender?.name === user?.name ||
          replyToMsg.senderName === user?.name ||
          replyToMsg.sender?.username === user?.username ||
          replyToMsg.senderName === "You"
            ? "You"
            : replyToMsg.sender?.name || replyToMsg.senderName || "User"}
        </div>
        <div className="text-[12px] text-slate-600 truncate">
          {replyToMsg.text || "Media"}
        </div>
      </div>
      <button onClick={() => setReplyToMsg(null)} className="p-1 text-slate-400 hover:text-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
export default ReplyPreview;
