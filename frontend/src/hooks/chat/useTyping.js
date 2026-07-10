import { useContext, useRef } from "react";
import { SocketContext } from "../../context/SocketContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";

export const useTyping = (socketConnected) => {
  const socket = useContext(SocketContext);
  const typingTimeoutRef = useRef(null);

  const sendTypingIndicator = (roomId, userName) => {
    if (socketConnected && socket && roomId) {
      socket.emit(SOCKET_EVENTS.EMIT_TYPING, { roomId, userName });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit(SOCKET_EVENTS.EMIT_STOP_TYPING, { roomId });
      }, 2000);
    }
  };

  return { sendTypingIndicator };
};
export default useTyping;

