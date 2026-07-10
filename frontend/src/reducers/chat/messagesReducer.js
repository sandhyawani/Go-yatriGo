import { getRoomIdString } from "../../utils/chat/chatHelpers";

export const messagesReducer = (state, action) => {
  switch (action.type) {
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload
      };

    case "SET_LOADING_MESSAGES":
      return {
        ...state,
        loadingMessages: action.payload
      };

    case "RECEIVE_MESSAGE": {
      const { message, currentUserId } = action.payload;
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = [...state.messages];

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        const msgSenderId = typeof message.sender === "object"
          ? (message.sender?._id || message.sender?.id)
          : message.sender;

        let reconciled = false;
        if (message.clientMsgId) {
          const idx = state.messages.findIndex((m) => m._id === message.clientMsgId);
          if (idx !== -1) {
            updatedMessages[idx] = {
              ...message,
              isPending: false,
              replyTo: message.replyTo || state.messages[idx].replyTo
            };
            reconciled = true;
          }
        }

        if (!reconciled) {
          const isReaction =
            (message.text || "").startsWith("Reacted to your story:") ||
            (message.content || "").startsWith("Reacted to your story:");

          if (isReaction && message.storyId) {
            const storyRef = getRoomIdString(message.storyId);
            const existingIdx = state.messages.findIndex((m) => {
              const mSenderId = typeof m.sender === "object" ? (m.sender?._id || m.sender?.id) : m.sender;
              const mStoryId = getRoomIdString(m.storyId);
              return mSenderId?.toString() === msgSenderId?.toString() &&
                mStoryId === storyRef &&
                ((m.text || "").startsWith("Reacted to your story:") ||
                  (m.content || "").startsWith("Reacted to your story:"));
            });
            if (existingIdx !== -1) {
              updatedMessages[existingIdx] = message;
              reconciled = true;
            }
          }
        }

        if (!reconciled) {
          if (state.messages.some((m) => m._id === message._id)) {
            updatedMessages = state.messages.map((m) =>
              m._id === message._id ? { ...m, ...message } : m
            );
          } else {
            updatedMessages.push(message);
          }
        }
      }

      // Update room list latestMessage
      const msgSenderId = typeof message.sender === "object"
        ? (message.sender?._id || message.sender?.id)
        : message.sender;
      const isSelf = msgSenderId?.toString() === currentUserId?.toString();

      const updatedRooms = state.rooms.map((r) => {
        if (getRoomIdString(r._id) === incomingRoomId) {
          const shouldIncrement = incomingRoomId !== activeRoomId && !isSelf;
          return {
            ...r,
            latestMessage: message,
            updatedAt: new Date().toISOString(),
            unreadCount: shouldIncrement ? (r.unreadCount || 0) + 1 : r.unreadCount
          };
        }
        return r;
      });

      const sortedRooms = [...updatedRooms].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      return {
        ...state,
        messages: updatedMessages,
        rooms: sortedRooms
      };
    }

    case "MESSAGE_SENT_ACK": {
      const { roomId, messageId, clientMsgId, message } = action.payload;
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = [...state.messages];
      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        const idx = state.messages.findIndex(
          (m) => m._id === clientMsgId || m._id === messageId
        );
        if (idx !== -1) {
          updatedMessages[idx] = {
            ...updatedMessages[idx],
            ...message,
            _id: messageId,
            isPending: false,
            replyTo: message.replyTo || updatedMessages[idx].replyTo
          };
        } else {
          updatedMessages.push(message);
        }
      }

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "MESSAGE_DELIVERED": {
      const { roomId, messageId, userId } = action.payload;
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = state.messages;
      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        updatedMessages = state.messages.map((m) => {
          if (m._id === messageId) {
            const deliveredTo = m.deliveredTo ? [...m.deliveredTo] : [];
            if (!deliveredTo.includes(userId)) deliveredTo.push(userId);
            return { ...m, deliveredTo };
          }
          return m;
        });
      }

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "MESSAGES_SEEN": {
      const { roomId, userId } = action.payload;
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = state.messages;
      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        updatedMessages = state.messages.map((m) => {
          const unreadBy = m.unreadBy ? m.unreadBy.filter((id) => id !== userId) : [];
          const seenBy = m.seenBy ? [...m.seenBy] : [];
          if (!seenBy.includes(userId)) seenBy.push(userId);
          const deliveredTo = m.deliveredTo ? [...m.deliveredTo] : [];
          if (!deliveredTo.includes(userId)) deliveredTo.push(userId);
          return { ...m, unreadBy, seenBy, deliveredTo };
        });
      }

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "STORY_REACTION_UPDATED": {
      const message = action.payload;
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = state.messages;
      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        const storyRef = getRoomIdString(message.storyId);
        const idx = state.messages.findIndex((m) => {
          const mSenderId = typeof m.sender === "object" ? (m.sender?._id || m.sender?.id) : m.sender;
          const msgSenderId = typeof message.sender === "object" ? (message.sender?._id || message.sender?.id) : message.sender;
          const mStoryId = getRoomIdString(m.storyId);
          return m._id === message._id ||
            (mSenderId?.toString() === msgSenderId?.toString() &&
             mStoryId === storyRef &&
             (m.text || "").startsWith("Reacted to your story:"));
        });
        const updated = [...state.messages];
        if (idx !== -1) {
          updated[idx] = message;
        } else {
          updated.push(message);
        }
        updatedMessages = updated;
      }

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "MESSAGE_UNSENT": {
      const { roomId, messageId } = action.payload;
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(state.activeRoom?._id);

      let updatedMessages = state.messages;
      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        updatedMessages = state.messages.map((m) =>
          m._id === messageId ? { ...m, isUnsent: true } : m
        );
      }

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "ADD_REACTION": {
      const { messageId, emoji, currentUserId } = action.payload;
      const updatedMessages = state.messages.map((m) => {
        if (m._id === messageId) {
          const existingReactions = m.reactions || [];
          return {
            ...m,
            reactions: [...existingReactions, { emoji, userId: currentUserId }]
          };
        }
        return m;
      });

      return {
        ...state,
        messages: updatedMessages
      };
    }

    case "DELETE_MESSAGE_LOCAL": {
      const { messageId } = action.payload;
      return {
        ...state,
        messages: state.messages.filter((m) => m._id !== messageId)
      };
    }

    case "PAGINATE_MESSAGES": {
      const { messages: newMsgs, hasMore, page } = action.payload;
      return {
        ...state,
        messages: [...newMsgs, ...state.messages],
        hasMoreMessages: hasMore,
        messagesPage: page,
        loadingMessages: false
      };
    }

    default:
      return state;
  }
};
export default messagesReducer;

