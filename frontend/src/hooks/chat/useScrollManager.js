import { useState, useEffect, useRef } from "react";

export const useScrollManager = ({
  chatContainerRef,
  messagesEndRef,
  messages,
  activeRoom,
  currentUserId,
  hasMoreMessages,
  loadingMessages,
  loadMoreMessages
}) => {
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadNewMessagesCount, setUnreadNewMessagesCount] = useState(0);

  const prevMessagesLength = useRef(0);
  const prevActiveRoomId = useRef(null);
  const showScrollBottomRef = useRef(showScrollBottom);

  useEffect(() => {
    showScrollBottomRef.current = showScrollBottom;
  }, [showScrollBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadNewMessagesCount(0);
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // Trigger pagination when reaching top
    if (scrollTop === 0 && hasMoreMessages && !loadingMessages) {
      const prevScrollHeight = scrollHeight;
      loadMoreMessages().then(() => {
        // Restore scroll position
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - prevScrollHeight;
          }
        }, 50);
      });
    }

    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  // Scroll effect on new messages / room change
  useEffect(() => {
    if (!activeRoom) {
      prevMessagesLength.current = 0;
      prevActiveRoomId.current = null;
      return;
    }

    const currentLength = messages.length;
    const currentRoomId = activeRoom._id;

    if (currentRoomId !== prevActiveRoomId.current) {
      // Room changed: snap scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
      setUnreadNewMessagesCount(0);
    } else if (currentLength > prevMessagesLength.current) {
      const lastMsg = messages[currentLength - 1];
      const senderId = typeof lastMsg?.sender === "object"
        ? (lastMsg.sender?._id || lastMsg.sender?.id)
        : lastMsg?.sender;
      const isSelf = senderId?.toString() === currentUserId?.toString();

      if (isSelf) {
        setTimeout(scrollToBottom, 50);
      } else {
        if (showScrollBottomRef.current) {
          setUnreadNewMessagesCount((prev) => prev + 1);
        } else {
          setTimeout(scrollToBottom, 50);
        }
      }
    }

    prevMessagesLength.current = currentLength;
    prevActiveRoomId.current = currentRoomId;
  }, [messages, activeRoom, currentUserId]);

  return {
    showScrollBottom,
    setShowScrollBottom,
    unreadNewMessagesCount,
    setUnreadNewMessagesCount,
    handleScroll,
    scrollToBottom
  };
};
export default useScrollManager;

