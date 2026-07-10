import { useContext, useState } from "react";
import { ChatContext } from "../../context/chat/ChatContext";
import { chatService } from "../../services/chatService";
import { showToast } from "../../utils/showToast";
import useAudioRecorder from "./useAudioRecorder";

export const useChatMessages = (user) => {
  const { state, dispatch } = useContext(ChatContext);
  const { messages, activeRoom, loadingMessages, messagesPage, hasMoreMessages } = state;
  const currentUserId = user?._id || user?.id;

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Delegate audio recording to useAudioRecorder
  const {
    isRecording,
    recordingTime,
    audioBlob,
    setAudioBlob,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording
  } = useAudioRecorder();

  const syncRoomMessages = async (room) => {
    if (!room) return;
    try {
      const res = await chatService.getRoomMessages(room._id, 1, 50);
      if (res.success) {
        dispatch({ type: "SET_MESSAGES", payload: res.messages || [] });
      }
    } catch (err) {
      console.error("Failed to sync room messages:", err);
    }
  };

  const fetchRoomMessages = async (room) => {
    if (!room) return;
    try {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: true });
      const res = await chatService.getRoomMessages(room._id, 1, 50);
      if (res.success) {
        dispatch({ type: "SET_MESSAGES", payload: res.messages || [] });
        dispatch({
          type: "PAGINATE_MESSAGES",
          payload: { messages: res.messages || [], hasMore: res.hasMore, page: 1 }
        });
      }
    } catch (err) {
      showToast.error("Failed to retrieve chat history");
    } finally {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: false });
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMessages || !hasMoreMessages || !activeRoom) return;
    try {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: true });
      const nextPage = messagesPage + 1;
      const res = await chatService.getRoomMessages(activeRoom._id, nextPage, 50);
      if (res.success) {
        dispatch({
          type: "PAGINATE_MESSAGES",
          payload: { messages: res.messages || [], hasMore: res.hasMore, page: nextPage }
        });
      }
    } catch (err) {
      showToast.error("Failed to load older messages");
    } finally {
      dispatch({ type: "SET_LOADING_MESSAGES", payload: false });
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile && !audioBlob) return;
    if (!activeRoom) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    const clientMsgId = `opt-${Date.now()}`;
    const optimisticMsg = {
      _id: clientMsgId,
      roomId: activeRoom._id,
      sender: currentUserId,
      senderName: user.name,
      senderPic: user.pic,
      text: textToSend,
      content: textToSend,
      media: selectedFile
        ? URL.createObjectURL(selectedFile)
        : audioBlob
        ? URL.createObjectURL(audioBlob)
        : null,
      isAudio: !!audioBlob,
      isPending: true,
      createdAt: new Date().toISOString(),
      unreadBy: activeRoom.members
        .map((member) => (typeof member === "object" ? member._id : member))
        .filter((id) => id?.toString() !== currentUserId?.toString()),
      seenBy: [currentUserId],
      replyTo: replyToMsg
        ? {
            _id: replyToMsg._id,
            senderName: replyToMsg.sender?.name || replyToMsg.senderName || "User",
            text: replyToMsg.text
          }
        : undefined
    };

    dispatch({
      type: "RECEIVE_MESSAGE",
      payload: { message: optimisticMsg, currentUserId }
    });

    try {
      let mediaUrl = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const uploadRes = await chatService.uploadFile(formData);
        if (uploadRes.url) mediaUrl = uploadRes.url;
        setSelectedFile(null);
      } else if (audioBlob) {
        const formData = new FormData();
        formData.append("image", audioBlob, "voice-message.webm");
        const uploadRes = await chatService.uploadFile(formData);
        if (uploadRes.url) mediaUrl = uploadRes.url;
        setAudioBlob(null);
      }

      const payload = { text: textToSend, clientMsgId };
      if (mediaUrl) payload.media = mediaUrl;
      if (replyToMsg) {
        payload.replyTo = {
          _id: replyToMsg._id,
          senderName: replyToMsg.sender?.name || replyToMsg.senderName || "User",
          text: replyToMsg.text
        };
      }

      const res = await chatService.sendMessage(activeRoom._id, payload);
      if (res.success) {
        dispatch({
          type: "MESSAGE_SENT_ACK",
          payload: {
            roomId: activeRoom._id,
            messageId: res.message._id,
            clientMsgId,
            message: res.message
          }
        });
        setReplyToMsg(null);
      }
    } catch (err) {
      dispatch({ type: "DELETE_MESSAGE_LOCAL", payload: { messageId: clientMsgId } });
      showToast.error(err.response?.data?.message || "Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteForMe = async (messageId) => {
    if (!activeRoom) return;
    try {
      const res = await chatService.deleteMessageForMe(activeRoom._id, messageId);
      if (res.success) {
        dispatch({ type: "DELETE_MESSAGE_LOCAL", payload: { messageId } });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error deleting message");
    }
  };

  const handleUnsend = async (messageId) => {
    if (!activeRoom) return;
    try {
      const res = await chatService.unsendMessage(activeRoom._id, messageId);
      if (res.success) {
        dispatch({ type: "MESSAGE_UNSENT", payload: { roomId: activeRoom._id, messageId } });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error unsending message");
    }
  };

  const handleReaction = (messageId, emoji) => {
    dispatch({ type: "ADD_REACTION", payload: { messageId, emoji, currentUserId } });
  };

  return {
    messages,
    loadingMessages,
    inputText,
    setInputText,
    isSending,
    replyToMsg,
    setReplyToMsg,
    selectedFile,
    setSelectedFile,
    isRecording,
    recordingTime,
    audioBlob,
    setAudioBlob,
    syncRoomMessages,
    fetchRoomMessages,
    loadMoreMessages,
    handleSendMessage,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    handleDeleteForMe,
    handleUnsend,
    handleReaction
  };
};
export default useChatMessages;

