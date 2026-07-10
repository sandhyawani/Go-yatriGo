import { useState, useContext } from "react";
import { chatService } from "../../services/chatService";
import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import { AuthContext } from "../../context/authContext";
import { ChatContext } from "../../context/chat/ChatContext";

export const useChatActions = (currentUserId, activeRoom) => {
  const { user, dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleBlockUser = async () => {
    try {
      const otherUser = activeRoom?.members?.find(
        (member) => (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;

      const otherUserId = otherUser._id || otherUser;
      const isBlocked = user?.blockedUsers?.includes(otherUserId);

      if (!isBlocked) {
        setShowBlockModal(true);
        return;
      }

      toast.loading("Unblocking user...", { id: "block" });
      const res = await chatService.unblockUser(otherUserId);
      if (res.success) {
        showToast.success(res.message, { id: "block" });
        const freshSelf = await chatService.getUserProfile(currentUserId);
        authDispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.blockedUsers || freshSelf.user?.blockedUsers },
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed", {
        id: "block",
      });
    }
  };

  const confirmBlockUser = async () => {
    try {
      const otherUser = activeRoom?.members?.find(
        (member) => (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;

      const otherUserId = otherUser._id || otherUser;
      setShowBlockModal(false);
      toast.loading("Blocking user...", { id: "block" });
      const res = await chatService.blockUser(otherUserId);
      if (res.success) {
        showToast.success(res.message, { id: "block" });
        const freshSelf = await chatService.getUserProfile(currentUserId);
        authDispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.blockedUsers || freshSelf.user?.blockedUsers },
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed", {
        id: "block",
      });
    }
  };

  const handleReportUser = async () => {
    try {
      const otherUser = activeRoom?.members?.find(
        (member) => (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;
      toast.loading("Reporting user...", { id: "report" });
      const res = await chatService.reportUser(otherUser._id || otherUser, "Inappropriate behavior in chat");
      if (res.success) {
        showToast.success("User reported", { id: "report" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error reporting user", {
        id: "report",
      });
    }
  };

  const handleClearChat = async () => {
    if (!activeRoom) return;
    try {
      toast.loading("Clearing chat...", { id: "clear" });
      const res = await chatService.clearChat(activeRoom._id);
      if (res.success) {
        dispatch({ type: "SET_MESSAGES", payload: [] });
        showToast.success("Chat cleared", { id: "clear" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error clearing chat", {
        id: "clear",
      });
    }
  };

  return {
    showBlockModal,
    setShowBlockModal,
    handleBlockUser,
    confirmBlockUser,
    handleReportUser,
    handleClearChat
  };
};
export default useChatActions;

