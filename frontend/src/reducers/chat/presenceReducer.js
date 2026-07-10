export const presenceReducer = (state, action) => {
  switch (action.type) {
    case "SET_ONLINE_USERS":
      return {
        ...state,
        onlineUsers: new Set(action.payload)
      };

    case "UPDATE_USER_PRESENCE": {
      const { userId, status } = action.payload;
      const newOnline = new Set(state.onlineUsers);
      if (status === "online") {
        newOnline.add(userId);
      } else {
        newOnline.delete(userId);
      }
      return {
        ...state,
        onlineUsers: newOnline
      };
    }

    case "SET_TYPING": {
      const { roomId, userName } = action.payload;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [roomId]: userName
        }
      };
    }

    case "CLEAR_TYPING": {
      const roomId = action.payload;
      const updatedTyping = { ...state.typingUsers };
      delete updatedTyping[roomId];
      return {
        ...state,
        typingUsers: updatedTyping
      };
    }

    default:
      return state;
  }
};
export default presenceReducer;

