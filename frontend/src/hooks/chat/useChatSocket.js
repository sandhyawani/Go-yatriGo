import { useContext, useEffect, useState, useRef } from "react";
import { SocketContext } from "../../context/SocketContext";
import { ChatContext } from "../../context/chat/ChatContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { handleSocketEvent } from "../../socket/socketDispatcher";
import { getRoomIdString } from "../../utils/chat/chatHelpers";

export const useChatSocket = (user, syncRoomMessages) => {
  const socket = useContext(SocketContext);
  const { state, dispatch } = useContext(ChatContext);
  const { activeRoom } = state;
  const [socketConnected, setSocketConnected] = useState(false);

  const activeRoomRef = useRef(activeRoom);
  const userRef = useRef(user);
  const dispatchRef = useRef(dispatch);
  const socketConnectedRef = useRef(socketConnected);
  const prevActiveRoomRef = useRef(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
    userRef.current = user;
    dispatchRef.current = dispatch;
    socketConnectedRef.current = socketConnected;
  });

  // Handle room switching (join new room, leave old room)
  useEffect(() => {
    if (!socket || !socket.connected) return;

    const prevRoomId = getRoomIdString(prevActiveRoomRef.current?._id);
    const newRoomId = getRoomIdString(activeRoom?._id);

    if (prevRoomId && prevRoomId !== newRoomId) {
      console.log("[SOCKET] leave_chat_room:", prevRoomId);
      socket.emit(SOCKET_EVENTS.EMIT_LEAVE_CHAT_ROOM, prevRoomId);
    }

    if (newRoomId) {
      console.log("[SOCKET] join_chat_room:", newRoomId);
      socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, newRoomId);
    }

    prevActiveRoomRef.current = activeRoom;
  }, [activeRoom, socket, socketConnected]);

  // Listeners registration
  useEffect(() => {
    if (!socket) return;

    setSocketConnected(socket.connected);

    const onConnect = () => {
      console.log("[SOCKET] connected:", socket.id);
      setSocketConnected(true);

      // Rejoin active room on reconnect
      const activeId = getRoomIdString(activeRoomRef.current?._id);
      if (activeId) {
        console.log("[SOCKET] rejoining room on connect:", activeId);
        socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, activeId);
        if (syncRoomMessages) {
          syncRoomMessages(activeRoomRef.current);
        }
      }
    };

    const onDisconnect = () => {
      console.log("[SOCKET] disconnected");
      setSocketConnected(false);
    };

    const onUserPresence = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.USER_PRESENCE, data);
    };

    const onInitialOnlineUsers = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.INITIAL_ONLINE_USERS, data);
    };

    const onReceiveChatMessage = (message) => {
      const currentUserId = userRef.current?._id || userRef.current?.id;
      const msgSenderId = typeof message.sender === "object"
        ? (message.sender?._id || message.sender?.id)
        : message.sender;
      const isSelf = msgSenderId?.toString() === currentUserId?.toString();

      // Dispatch to state
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.RECEIVE_CHAT_MESSAGE, message, currentUserId);

      // Receipt acknowledgment
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (!isSelf) {
        if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
          console.log("[SOCKET] Emit mark_messages_read for room:", incomingRoomId);
          socket.emit(SOCKET_EVENTS.EMIT_MARK_MESSAGES_READ, {
            roomId: message.roomId,
            userId: currentUserId,
          });
        } else {
          console.log("[SOCKET] Emit message_delivered for message:", message._id);
          socket.emit(SOCKET_EVENTS.EMIT_MESSAGE_DELIVERED, {
            roomId: message.roomId,
            messageId: message._id,
            userId: currentUserId,
          });
        }
      }
    };

    const onMessageSent = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.MESSAGE_SENT, data);
    };

    const onMessageDelivered = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.MESSAGE_DELIVERED, data);
    };

    const onMessagesSeen = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.MESSAGES_SEEN, data);
    };

    const onMessagesRead = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.MESSAGES_READ, data);
    };

    const onStoryReactionMessageUpdated = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.STORY_REACTION_MESSAGE_UPDATED, data);
    };

    const onIsTyping = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.IS_TYPING, data);
    };

    const onNotTyping = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.NOT_TYPING, data);
    };

    const onMessageUnsent = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.MESSAGE_UNSENT, data);
    };

    const onRequestStatusUpdated = (data) => {
      handleSocketEvent(dispatchRef.current, SOCKET_EVENTS.REQUEST_STATUS_UPDATED, data);
    };

    if (socket.connected) {
      setSocketConnected(true);
    }

    // Attach listeners
    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.USER_PRESENCE, onUserPresence);
    socket.on(SOCKET_EVENTS.INITIAL_ONLINE_USERS, onInitialOnlineUsers);
    socket.on(SOCKET_EVENTS.RECEIVE_CHAT_MESSAGE, onReceiveChatMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_SENT, onMessageSent);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, onMessageDelivered);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED_UPDATE, onMessageDelivered);
    socket.on(SOCKET_EVENTS.MESSAGES_SEEN, onMessagesSeen);
    socket.on(SOCKET_EVENTS.MESSAGES_READ, onMessagesRead);
    socket.on(SOCKET_EVENTS.STORY_REACTION_MESSAGE_UPDATED, onStoryReactionMessageUpdated);
    socket.on(SOCKET_EVENTS.IS_TYPING, onIsTyping);
    socket.on(SOCKET_EVENTS.NOT_TYPING, onNotTyping);
    socket.on(SOCKET_EVENTS.MESSAGE_UNSENT, onMessageUnsent);
    socket.on(SOCKET_EVENTS.REQUEST_STATUS_UPDATED, onRequestStatusUpdated);

    return () => {
      // Remove listeners on cleanup
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.off(SOCKET_EVENTS.USER_PRESENCE, onUserPresence);
      socket.off(SOCKET_EVENTS.INITIAL_ONLINE_USERS, onInitialOnlineUsers);
      socket.off(SOCKET_EVENTS.RECEIVE_CHAT_MESSAGE, onReceiveChatMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_SENT, onMessageSent);
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED, onMessageDelivered);
      socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED_UPDATE, onMessageDelivered);
      socket.off(SOCKET_EVENTS.MESSAGES_SEEN, onMessagesSeen);
      socket.off(SOCKET_EVENTS.MESSAGES_READ, onMessagesRead);
      socket.off(SOCKET_EVENTS.STORY_REACTION_MESSAGE_UPDATED, onStoryReactionMessageUpdated);
      socket.off(SOCKET_EVENTS.IS_TYPING, onIsTyping);
      socket.off(SOCKET_EVENTS.NOT_TYPING, onNotTyping);
      socket.off(SOCKET_EVENTS.MESSAGE_UNSENT, onMessageUnsent);
      socket.off(SOCKET_EVENTS.REQUEST_STATUS_UPDATED, onRequestStatusUpdated);
    };
  }, [socket]);

  return socketConnected;
};
export default useChatSocket;
