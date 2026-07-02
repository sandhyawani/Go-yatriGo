import { roomsReducer } from "./chat/roomsReducer";
import { messagesReducer } from "./chat/messagesReducer";
import { presenceReducer } from "./chat/presenceReducer";

export const initialChatState = {
  rooms: [],
  messages: [],
  activeRoom: null,
  onlineUsers: new Set(),
  typingUsers: {},
  loading: true,
  loadingMessages: false,
  messagesPage: 1,
  hasMoreMessages: false
};

export const chatReducer = (state, action) => {
  let nextState = roomsReducer(state, action);
  nextState = messagesReducer(nextState, action);
  nextState = presenceReducer(nextState, action);
  return nextState;
};
export default chatReducer;
