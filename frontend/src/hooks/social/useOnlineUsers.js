import { useContext } from "react";
import { ChatContext } from "../../context/chat/ChatContext";

export const useOnlineUsers = () => {
  const { state } = useContext(ChatContext);
  return state.onlineUsers;
};
export default useOnlineUsers;
