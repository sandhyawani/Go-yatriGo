import { useContext, useEffect } from "react";
import { SocketContext } from "../../context/SocketContext";
import { ChatContext } from "../../context/chat/ChatContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";

export const useMessageStatus = (user, socketConnected, setUnreadNewMessagesCount) => {
  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(ChatContext);
  const { messages, activeRoom } = state;
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (activeRoom && user && socketConnected && socket) {
      const unread = messages.filter((m) => m.unreadBy?.includes(currentUserId));
      if (unread.length > 0) {
        console.log("[STATUS HOOK] Emitting mark_messages_read for room:", activeRoom._id);
        socket.emit(SOCKET_EVENTS.EMIT_MARK_MESSAGES_READ, {
          roomId: activeRoom._id,
          userId: currentUserId,
        });

        dispatch({
          type: "MESSAGES_SEEN",
          payload: { roomId: activeRoom._id, userId: currentUserId }
        });

        if (setUnreadNewMessagesCount) {
          setUnreadNewMessagesCount(0);
        }
      }
    }
  }, [messages, activeRoom, user, socketConnected, socket, currentUserId, dispatch, setUnreadNewMessagesCount]);
};
export default useMessageStatus;
