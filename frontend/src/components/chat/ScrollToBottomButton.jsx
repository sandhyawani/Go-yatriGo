import React from "react";
import { ChevronDown } from "lucide-react";

export const ScrollToBottomButton = ({
  showScrollBottom,
  scrollToBottom,
  unreadNewMessagesCount
}) => {
  if (!showScrollBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="absolute -top-12 right-6 bg-[#7F77DD] text-white shadow-lg hover:bg-[#6b62d6] transition-all z-20 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
    >
      <ChevronDown className="w-4 h-4" />
      {unreadNewMessagesCount > 0 && <span>New Messages ({unreadNewMessagesCount})</span>}
    </button>
  );
};
export default ScrollToBottomButton;
