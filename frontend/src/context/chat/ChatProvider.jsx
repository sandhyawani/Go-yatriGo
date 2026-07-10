import React, { useReducer } from "react";
import { ChatContext } from "./ChatContext";
import { chatReducer, initialChatState } from "../../reducers/chatReducer";

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};
export default ChatProvider;

