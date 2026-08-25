import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "../../api/axios";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import { MessageSquare, Video, Loader2 } from "lucide-react";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import DispatchViewer from "../../components/story/DispatchViewer";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatMessages from "../../components/chat/ChatMessages";
import ChatInput from "../../components/chat/ChatInput";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { chatService } from "../../services/chatService";

const getRoomIdString = (roomField) => {
  if (!roomField) return "";
  if (typeof roomField === "object") {
    return (roomField._id || roomField.id || roomField).toString();
  }
  return roomField.toString();
};

const getMediaTypeLabel = (mediaUrl) => {
  if (!mediaUrl) return "";
  const lower = mediaUrl.toLowerCase();
  if (lower.match(/\.(mp4|webm|ogg|mov|avi|flv|mkv|3gp)$/) || lower.includes("video")) {
    return "🎥 Video";
  }
  if (lower.match(/\.(mp3|wav|ogg|aac|flac|m4a|webm)$/) || lower.includes("voice") || lower.includes("audio")) {
    return "🎙️ Voice message";
  }
  return "📷 Photo";
};

const getLatestMessagePreview = (msg, currentUserId) => {
  if (!msg) return "Start chatting";
  if (msg.isUnsent) return "🚫 This message was removed";

  const text = msg.text || msg.content || "";
  const hasMedia = !!msg.media;
  const hasStory = !!msg.storyId;
  const isSelf = (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
  const prefix = isSelf ? "You: " : "";

  if (hasStory) {
    if (text.startsWith("Reacted")) {
      return text;
    }
    return `💬 Story reply: ${text}`;
  }

  if (hasMedia) {
    const mediaLabel = getMediaTypeLabel(msg.media);
    return text ? `${mediaLabel}: ${text}` : mediaLabel;
  }

  return text ? `${prefix}${text}` : "Message";
};

const ChatRoom = () => {
  const { user, dispatch } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const legacyTargetUserId = location.state?.targetUserId;
  const legacyGroupId = location.state?.groupId;
  const isEmbedded = new URLSearchParams(location.search).get("embed") === "true";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");

  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeMessageOptions, setActiveMessageOptions] = useState(null);


  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showHeaderOptions, setShowHeaderOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const [isDeleteSelectionMode, setIsDeleteSelectionMode] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState(new Set());
  const [showListMoreOptions, setShowListMoreOptions] = useState(false);

  const [replyToMsg, setReplyToMsg] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadNewMessagesCount, setUnreadNewMessagesCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState(new Set());
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const chatContainerRef = useRef(null);
  const activeRoomRef = useRef(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const handleEmojiClick = (emojiObject) => {
    setInputText((prev) => prev + emojiObject.emoji);
  };

  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const headerOptionsRef = useRef(null);

  const socket = useContext(SocketContext);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const isMyRequest = (r) => {
    if (!r || !r.requestedBy || !user) return false;
    const reqId =
    typeof r.requestedBy === "object" ? r.requestedBy._id : r.requestedBy;
    return reqId?.toString() === currentUserId?.toString();
  };

  useEffect(() => {
    fetchChannels();
    const handleRefresh = () => fetchChannels();
    const handleMessageSent = (e) => {
      const detailRoomId = getRoomIdString(e.detail?.roomId);
      const activeId = getRoomIdString(activeRoomRef.current?._id);
      if (detailRoomId && activeId && detailRoomId === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === e.detail._id)) return prev;
          return [...prev, e.detail];
        });
      }
    };
    window.addEventListener("refresh_chats", handleRefresh);
    window.addEventListener("message_sent", handleMessageSent);
    return () => {
      window.removeEventListener("refresh_chats", handleRefresh);
      window.removeEventListener("message_sent", handleMessageSent);
    };

  }, [roomId, legacyTargetUserId, legacyGroupId]);

  const showScrollBottomRef = useRef(showScrollBottom);
  useEffect(() => {
    showScrollBottomRef.current = showScrollBottom;
  }, [showScrollBottom]);

  useEffect(() => {
    if (!socket) return;
    setSocketConnected(socket.connected);

    const userId = currentUserId;

    const onConnect = () => {
      setSocketConnected(true);
      const activeId = getRoomIdString(activeRoomRef.current?._id);
      if (activeId) {
        socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, activeId);
        syncRoomMessages(activeRoomRef.current);
      }
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    if (socket.connected) onConnect();

    const onUserPresence = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        status === "online" ? s.add(userId) : s.delete(userId);
        return s;
      });
    };

    const onInitialOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const onReceiveChatMessage = (message) => {
      const msgSenderId = typeof message.sender === "object" ? message.sender?._id || message.sender?.id : message.sender;
      const isSelf = msgSenderId?.toString() === currentUserId?.toString();

      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);
      const incomingMsgId = message._id?.toString?.() ?? message._id;

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        if (showScrollBottomRef.current && !isSelf) {
          setUnreadNewMessagesCount((prev) => prev + 1);
        }

        setMessages((prev) => {
          let updatedMessages = [...prev];

          if (message.clientMsgId) {
            const idx = prev.findIndex((m) => m._id === message.clientMsgId);
            if (idx !== -1) {
              updatedMessages[idx] = {
                ...message,
                _id: incomingMsgId,
                isPending: false,
                replyTo: message.replyTo || prev[idx].replyTo
              };
              return updatedMessages;
            }
          }

          const isReaction =
          (message.text || "").startsWith("Reacted to your Dispatch:") ||
          (message.content || "").startsWith("Reacted to your Dispatch:");

          if (isReaction && message.storyId) {
            const storyRef = getRoomIdString(message.storyId);
            const existingIdx = prev.findIndex((m) => {
              const mSenderId = typeof m.sender === "object" ? m.sender?._id || m.sender?.id : m.sender;
              const mStoryId = getRoomIdString(m.storyId);
              return mSenderId?.toString() === msgSenderId?.toString() &&
              mStoryId === storyRef && (
              (m.text || "").startsWith("Reacted to your Dispatch:") ||
              (m.content || "").startsWith("Reacted to your Dispatch:"));
            });
            if (existingIdx !== -1) {
              updatedMessages.splice(existingIdx, 1);
              updatedMessages.push({ ...message, _id: incomingMsgId });
              return updatedMessages;
            }
          }

          const isDuplicate = prev.some((m) => m._id?.toString?.() === incomingMsgId);
          if (isDuplicate) {
            updatedMessages = prev.map((m) =>
            m._id?.toString?.() === incomingMsgId ? { ...m, ...message, _id: incomingMsgId } : m
            );
          } else {
            updatedMessages.push({ ...message, _id: incomingMsgId });
          }

          return updatedMessages;
        });
      }

      setRooms((prev) => {
        const roomExists = prev.some((r) => getRoomIdString(r._id) === incomingRoomId);
        if (!roomExists) {
          setTimeout(() => fetchChannels(), 0);
          return prev;
        }

        const updatedRooms = prev.map((r) => {
          if (getRoomIdString(r._id) === incomingRoomId) {
            return {
              ...r,
              latestMessage: message,
              updatedAt: new Date().toISOString(),
              unreadCount:
              getRoomIdString(r._id) !== activeRoomId && !isSelf ?
              (r.unreadCount || 0) + 1 :
              r.unreadCount
            };
          }
          return r;
        });

        return [...updatedRooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      if (socket && socket.connected && !isSelf) {
        if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
          socket.emit(SOCKET_EVENTS.EMIT_MARK_MESSAGES_READ, {
            roomId: message.roomId,
            userId: currentUserId
          });
        } else {
          socket.emit(SOCKET_EVENTS.EMIT_MESSAGE_DELIVERED, {
            roomId: message.roomId,
            messageId: message._id,
            userId: currentUserId
          });
        }
      }
    };

    const onMessageSent = ({ roomId, messageId, clientMsgId, message }) => {
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);
      const normalizedMsgId = messageId?.toString?.() ?? messageId;

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) => {
          const idx = prev.findIndex(
          (m) => m._id === clientMsgId || m._id?.toString?.() === normalizedMsgId
          );
          let updated;
          if (idx !== -1) {
            updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...message,
              _id: normalizedMsgId,
              isPending: false,
              replyTo: message.replyTo || updated[idx].replyTo
            };
          } else {
            const alreadyPresent = prev.some((m) => m._id?.toString?.() === normalizedMsgId);
            updated = alreadyPresent ? prev : [...prev, { ...message, _id: normalizedMsgId }];
          }
          return updated;
        });
      }
    };

    const onMessageDelivered = ({ roomId, messageId, userId }) => {
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) => prev.map((m) => {
          if (m._id === messageId) {
            const deliveredTo = m.deliveredTo ? [...m.deliveredTo] : [];
            if (!deliveredTo.includes(userId)) deliveredTo.push(userId);
            return { ...m, deliveredTo };
          }
          return m;
        }));
      }
    };

    const onMessagesSeen = ({ roomId, userId }) => {
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) => prev.map((m) => {
          const unreadBy = m.unreadBy ? m.unreadBy.filter((id) => id !== userId) : [];
          const seenBy = m.seenBy ? [...m.seenBy] : [];
          if (!seenBy.includes(userId)) seenBy.push(userId);
          const deliveredTo = m.deliveredTo ? [...m.deliveredTo] : [];
          if (!deliveredTo.includes(userId)) deliveredTo.push(userId);
          return { ...m, unreadBy, seenBy, deliveredTo };
        }));
      }
    };

    const onMessagesRead = ({ roomId, userId, readByUserId }) => {
      const targetUserId = userId || readByUserId;
      if (!targetUserId) return;
      onMessagesSeen({ roomId, userId: targetUserId });
    };

    const onStoryReactionMessageUpdated = (message) => {
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) => {
          const storyRef = getRoomIdString(message.storyId);
          const idx = prev.findIndex((m) => {
            const mSenderId = typeof m.sender === "object" ? m.sender?._id || m.sender?.id : m.sender;
            const msgSenderId = typeof message.sender === "object" ? message.sender?._id || message.sender?.id : message.sender;
            const mStoryId = getRoomIdString(m.storyId);
            return m._id === message._id ||
            mSenderId?.toString() === msgSenderId?.toString() &&
            mStoryId === storyRef &&
            (m.text || "").startsWith("Reacted to your Dispatch:");
          });
          const updated = [...prev];
          if (idx !== -1) {
            updated.splice(idx, 1);
          }
          updated.push(message);
          return updated;
        });
      }
    };

    const onIsTyping = ({ roomId, userName }) => {
      setTypingUsers((prev) => ({ ...prev, [roomId]: userName }));
    };

    const onNotTyping = ({ roomId }) => {
      setTypingUsers((prev) => {
        const s = { ...prev };
        delete s[roomId];
        return s;
      });
    };

    const onMessageUnsent = ({ roomId, messageId }) => {
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, isUnsent: true } : m)
        );
      }
    };

    const onRequestStatusUpdated = ({
      roomId,
      requestStatus,
      room,
      updatedBy
    }) => {
      setRooms((prev) =>
      prev.map((r) =>
      r._id === roomId ? { ...r, ...room, requestStatus } : r
      )
      );
      setActiveRoom((prev) =>
      prev?._id === roomId ? { ...prev, ...room, requestStatus } : prev
      );
      if (
      updatedBy &&
      userId &&
      updatedBy?.toString() !== currentUserId?.toString() &&
      requestStatus === "accepted")
      {
        showToast.success("Your message request was accepted!");
      }
    };

    const onRoomAccessRevoked = ({ roomId }) => {
      const revokedId = getRoomIdString(roomId);
      setRooms((prev) => prev.filter((r) => getRoomIdString(r._id) !== revokedId));
      if (getRoomIdString(activeRoomRef.current?._id) === revokedId) {
        setActiveRoom(null);
        showToast.error("Your access to this Journey Group Chat has been revoked.");
      }
    };

    const onNewNotification = (notification) => {
      if (notification && notification.type === "follow_request") {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });
      }
    };

    const onFollowRequestResolved = ({ userId }) => {
      if (!userId) return;
      setNotifications((prev) =>
        prev.filter(
          (n) => !(n.type === "follow_request" && String(n.sender?._id || n.sender) === String(userId))
        )
      );
    };

    const onChatUnhidden = ({ roomId }) => {
      fetchChannels();
    };

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
    socket.on("room_access_revoked", onRoomAccessRevoked);
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, onNewNotification);
    socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, onFollowRequestResolved);
    socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, onFollowRequestResolved);
    socket.on("chat_unhidden", onChatUnhidden);

    return () => {
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
      socket.off("room_access_revoked", onRoomAccessRevoked);
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, onNewNotification);
      socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, onFollowRequestResolved);
      socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, onFollowRequestResolved);
      socket.off("chat_unhidden", onChatUnhidden);
    };

  }, [socket, currentUserId]);








  const fetchChannels = async () => {
    try {
      setLoading(true);
      const targetUserId = roomId ? null : legacyTargetUserId;
      const targetGroupId = legacyGroupId || roomId;
      let roomRes;

      if (targetUserId) {
        roomRes = await chatService.getDirectRoom(targetUserId);
      }

      const res = await axios.get("/chat/rooms", { withCredentials: true });
      const notifRes = await axios.get("/notifications", {
        withCredentials: true
      });
      if (res.data.success) {
        setRooms(res.data.rooms);




        if (targetUserId && roomRes?.room) {
          const targetRoom = roomRes.room;
          if (socket) socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, targetRoom._id);
          const matched = res.data.rooms.find(
          (r) => r._id === targetRoom._id
          );
          if (matched) {
            selectRoom(matched);
          } else {
            setRooms((prev) => [targetRoom, ...prev]);
            selectRoom(targetRoom);
          }
        } else if (targetGroupId) {
          const matched = res.data.rooms.find((r) => {
            const rGroupId =
              typeof r.travelGroupId === "object" ?
              r.travelGroupId?._id :
              r.travelGroupId;
            const rJourneyId =
              typeof r.journeyId === "object" ?
              r.journeyId?._id :
              r.journeyId;
            const rGroupIdStr = rGroupId ? rGroupId.toString() : "";
            const rJourneyIdStr = rJourneyId ? rJourneyId.toString() : "";
            const roomIdStr = r._id ? r._id.toString() : "";
            const targetGroupIdStr = targetGroupId ? targetGroupId.toString() : "";
            return (
              rGroupIdStr === targetGroupIdStr ||
              rJourneyIdStr === targetGroupIdStr ||
              roomIdStr === targetGroupIdStr
            );
          });
          if (matched) selectRoom(matched);
        }
      }
      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications || []);
      }
    } catch (err) {
      showToast.error("Failed to load chat channels");
    } finally {
      setLoading(false);
    }
  };

  const syncRoomMessages = async (room) => {
    if (!room) return;
    try {
      const res = await axios.get(`/chat/room/${room._id}/messages?page=1&limit=50`, {
        withCredentials: true
      });
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setHasMoreMessages(res.data.hasMore);
        setMessagesPage(1);
      }
    } catch (err) {
      console.error("Failed to sync room messages:", err);
    }
  };

  const selectRoom = async (room) => {
    const selectedRoomId = getRoomIdString(room?._id);
    if (!selectedRoomId) return;

    if (roomId !== selectedRoomId) {
      navigate(`/social/chat/${selectedRoomId}`);
    }

    setActiveRoom(room);
    setMessages([]);
    setInputText("");
    setMessagesPage(1);
    setHasMoreMessages(false);

    // Reset unread count locally for this room
    setRooms((prev) =>
      prev.map((r) => (r._id === room._id ? { ...r, unreadCount: 0 } : r))
    );

    if (room.type === "direct") {
      setActiveTab(
      room.requestStatus === "pending" && !isMyRequest(room) ?
      "requests" :
      "chats"
      );
    } else {
      setActiveTab("groups");
    }
    try {
      if (socket && socket.connected) {
        socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, room._id);
      }
      setLoadingMessages(true);
      const res = await axios.get(`/chat/room/${room._id}/messages?page=1&limit=50`, {
        withCredentials: true
      });
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setHasMoreMessages(res.data.hasMore);
        setMessagesPage(1);
      }
      setTimeout(scrollToBottom, 100);
    } catch {
      showToast.error("Failed to retrieve chat history");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectGlobalUser = async (targetUser) => {
    try {
      setLoading(true);
      const roomRes = await chatService.getDirectRoom(targetUser._id);
      if (roomRes.success && roomRes.room) {
        const newRoom = roomRes.room;
        const existingRoom = rooms.find((r) => r._id === newRoom._id);
        if (!existingRoom) {
          setRooms((prev) => [newRoom, ...prev]);
          if (socket && socket.connected) {
            socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, newRoom._id);
          }
        }
        setSearchQuery("");
        setGlobalUsers([]);
        selectRoom(existingRoom || newRoom);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setGlobalUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingGlobal(true);
        const res = await axios.get(`/users/search?q=${searchQuery}`, {
          withCredentials: true
        });
        if (res.data.success) {
          setGlobalUsers(res.data.users || []);
        }
      } catch (err) {
        console.error("Error searching global users", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    if (socketConnected && activeRoom) {
      socket.emit(SOCKET_EVENTS.EMIT_TYPING, { roomId: activeRoom._id, userName: user?.name });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit(SOCKET_EVENTS.EMIT_STOP_TYPING, { roomId: activeRoom._id });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile && !audioBlob) return;
    if (!activeRoom) return;

    const textToSend = inputText.trim();
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsSending(true);

    if (socketConnected) socket.emit(SOCKET_EVENTS.EMIT_STOP_TYPING, { roomId: activeRoom._id });

    const clientMsgId = `opt-${Date.now()}`;
    const optimisticMsg = {
      _id: clientMsgId,
      roomId: activeRoom._id,
      sender: currentUserId,
      senderName: user.name,
      senderPic: user.pic,
      text: textToSend,
      content: textToSend,
      media: selectedFile ? URL.createObjectURL(selectedFile) : audioBlob ? URL.createObjectURL(audioBlob) : null,
      isAudio: !!audioBlob,
      isPending: true,
      createdAt: new Date().toISOString(),
      unreadBy: activeRoom.members.
      map((member) => typeof member === "object" ? member._id : member).
      filter((id) => id?.toString() !== currentUserId?.toString()),
      seenBy: [currentUserId],
      replyTo: replyToMsg ? {
        _id: replyToMsg._id,
        senderName: replyToMsg.sender?.name || replyToMsg.senderName || "User",
        text: replyToMsg.text
      } : undefined
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      let mediaUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const uploadRes = await axios.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.url) mediaUrl = uploadRes.data.url;
        setSelectedFile(null);
      } else if (audioBlob) {
        const formData = new FormData();
        formData.append("image", audioBlob, "voice-message.webm");
        const uploadRes = await axios.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.url) mediaUrl = uploadRes.data.url;
        setAudioBlob(null);
      }

      const payload = { text: textToSend, clientMsgId };
      if (mediaUrl) payload.media = mediaUrl;
      if (replyToMsg) {
        payload.replyTo = {
          _id: replyToMsg._id,
          senderName:
          replyToMsg.sender?.name || replyToMsg.senderName || "User",
          text: replyToMsg.text
        };
      }

      const res = await axios.post(
      `/chat/room/${activeRoom._id}/message`,
      payload,
      { withCredentials: true }
      );
      if (res.data.success) {
        setMessages((prev) =>
        prev.map((m) =>
        m._id === clientMsgId ?
        {
          ...res.data.message,
          replyTo: res.data.message.replyTo || m.replyTo
        } :
        m
        )
        );
        setReplyToMsg(null);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== clientMsgId));
      showToast.error(err.response?.data?.message || "Error sending message");
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File exceeds 10MB limit.");
      return;
    }
    setSelectedFile(file);
    e.target.value = "";
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast.error("Voice messages aren't supported on this device.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      setTimeout(() => setAudioBlob(null), 100);
    }
  };

  const handleReaction = async (messageId, emoji) => {

    setMessages((prev) =>
    prev.map((m) => {
      if (m._id === messageId) {
        const existingReactions = m.reactions || [];
        return {
          ...m,
          reactions: [...existingReactions, { emoji, userId: currentUserId }]
        };
      }
      return m;
    })
    );
  };

  const handleOpenStory = async (dispatchId) => {
    try {
      const res = await axios.get(`/social/story/${dispatchId}`, {
        withCredentials: true
      });
      if (res.data.success && res.data.story) {
        const story = res.data.story;
        const group = {
          userId: story.userId._id,
          userName: story.userId.name || story.userName,
          userPic:
          story.userId.avatar ||
          story.userId.pic ||
          story.userId.img ||
          story.userPic,
          stories: [story]
        };
        setActiveStoryGroup(group);
        setActiveStoryIndex(0);
      }
    } catch (err) {
      showToast.error("Story is no longer available.");
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMessages || !hasMoreMessages || !activeRoom) return;

    try {
      setLoadingMessages(true);
      const nextPage = messagesPage + 1;
      const res = await axios.get(
      `/chat/room/${activeRoom._id}/messages?page=${nextPage}&limit=50`,
      { withCredentials: true }
      );

      if (res.data.success) {
        const newMsgs = res.data.messages || [];
        const container = chatContainerRef.current;
        const previousScrollHeight = container ? container.scrollHeight : 0;

        setMessages((prev) => [...newMsgs, ...prev]);
        setHasMoreMessages(res.data.hasMore);
        setMessagesPage(nextPage);

        if (container) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }, 0);
        }
      }
    } catch (err) {
      console.error(err);
      showToast.error("Failed to load older messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    if (scrollTop === 0 && hasMoreMessages && !loadingMessages) {
      loadMoreMessages();
    }

    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  const handleRequestAction = async (action) => {
    if (!activeRoom || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      toast.loading(`Processing...`, { id: "req" });
      const res = await axios.put(
      `/chat/room/${activeRoom._id}/${action}`,
      {},
      { withCredentials: true }
      );
      if (res.data.success) {
        const updatedStatus = res.data.room?.requestStatus || (action === "accept" ? "accepted" : "declined");
        showToast.success(action === "accept" ? "Chat request accepted!" : "Chat request declined!", { id: "req" });
        setActiveRoom((prev) => (prev ? {
          ...prev,
          requestStatus: updatedStatus
        } : null));
        setRooms((prev) =>
        prev.map((r) =>
        r._id === activeRoom._id ?
        { ...r, requestStatus: updatedStatus } :
        r
        )
        );
        if (action === "accept") setActiveTab("chats");else
        setActiveRoom(null);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || `Failed to ${action} request`, { id: "req" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAcceptFollow = async (requesterId, notificationId) => {
    if (!requesterId) return;
    const key = notificationId || requesterId;
    if (processingRequestIds.has(key)) return;
    setProcessingRequestIds((prev) => new Set(prev).add(key));

    try {
      const res = await axios.post(
      `/users/${requesterId}/follow-request/accept`,
      {},
      { withCredentials: true }
      );
      if (res.data?.success || res.status === 200) {
        setNotifications((prev) =>
        prev.filter(
        (n) => !(n.type === "follow_request" && (String(n.sender?._id || n.sender) === String(requesterId) || n._id === notificationId))
        )
        );
        showToast.success("Follow request accepted");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to accept request");
    } finally {
      setProcessingRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleRejectFollow = async (requesterId, notificationId) => {
    if (!requesterId) return;
    const key = notificationId || requesterId;
    if (processingRequestIds.has(key)) return;
    setProcessingRequestIds((prev) => new Set(prev).add(key));

    try {
      const res = await axios.post(
      `/users/${requesterId}/follow-request/reject`,
      {},
      { withCredentials: true }
      );
      if (res.data?.success || res.status === 200) {
        setNotifications((prev) =>
        prev.filter(
        (n) => !(n.type === "follow_request" && (String(n.sender?._id || n.sender) === String(requesterId) || n._id === notificationId))
        )
        );
        showToast.success("Follow request declined");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to decline request");
    } finally {
      setProcessingRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleDeleteForMe = async (messageId) => {
    try {
      const res = await axios.delete(
      `/chat/room/${activeRoom._id}/messages/${messageId}/delete-for-me`,
      { withCredentials: true }
      );
      if (res.data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error deleting message");
    }
  };

  const handleUnsend = async (messageId) => {
    try {
      const res = await axios.delete(
      `/chat/room/${activeRoom._id}/messages/${messageId}/unsend`,
      { withCredentials: true }
      );
      if (res.data.success) {
        setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, isUnsent: true } : m)
        );
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error unsending message");
    }
  };

  const handleReportUser = async () => {
    try {
      setShowHeaderOptions(false);
      const otherUser = activeRoom.members?.find(
      (member) =>
      (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;
      toast.loading("Reporting user...", { id: "report" });
      const res = await axios.post(
      `/users/report/${otherUser._id || otherUser}`,
      { reason: "Inappropriate behavior in chat" },
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success("User reported", { id: "report" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error reporting user", {
        id: "report"
      });
    }
  };

  const handleBlockUser = async () => {
    try {
      setShowHeaderOptions(false);
      const otherUser = activeRoom.members?.find(
      (member) =>
      (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;

      const otherUserId = (otherUser._id || otherUser)?.toString();
      const isBlocked = user?.blockedUsers?.some((id) => (id._id || id)?.toString() === otherUserId);

      if (!isBlocked) {
        setShowBlockModal(true);
        return;
      }

      toast.loading("Unblocking user...", { id: "block" });
      const res = await axios.post(
      `/users/unblock/${otherUserId}`,
      {},
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${currentUserId}`, {
          withCredentials: true
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers || freshSelf.data.user?.blockedUsers }
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed", {
        id: "block"
      });
    }
  };

  const confirmBlockUser = async () => {
    try {
      const otherUser = activeRoom.members?.find(
      (member) =>
      (member._id || member)?.toString() !== currentUserId?.toString()
      );
      if (!otherUser) return;

      const otherUserId = otherUser._id || otherUser;
      setShowBlockModal(false);
      toast.loading("Blocking user...", { id: "block" });
      const res = await axios.post(
      `/users/block/${otherUserId}`,
      {},
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${currentUserId}`, {
          withCredentials: true
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers || freshSelf.data.user?.blockedUsers }
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed", {
        id: "block"
      });
    }
  };

  const handleClearChat = async () => {
    try {
      setShowHeaderOptions(false);
      toast.loading("Clearing chat...", { id: "clear" });
      const res = await axios.delete(`/chat/room/${activeRoom._id}/clear`, {
        withCredentials: true
      });
      if (res.data.success) {
        setMessages([]);
        showToast.success("Chat cleared", { id: "clear" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error clearing chat", {
        id: "clear"
      });
    }
  };

  const handleDeleteChat = async (roomToDelete = activeRoom) => {
    if (!roomToDelete) return;
    const isJourneyGroup = !!roomToDelete.journeyId;
    let result;

    if (isJourneyGroup) {
      result = await Swal.fire({
        html: `
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-[#F3E8FF] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </div>
            <h2 class="text-slate-800 text-xl font-bold mb-2">Hide Journey Group?</h2>
            <p class="text-slate-500 font-medium text-[15px] leading-relaxed">
              <span class="font-semibold text-slate-700">${roomToDelete.name}</span> will be hidden from your chat list. You'll remain a member of the Journey. You can reopen the group from the Journey anytime, and it will automatically reappear when a new message arrives.
            </p>
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        buttonsStyling: false,
        width: "440px",
        padding: "1.75rem",
        customClass: {
          popup: "rounded-3xl shadow-lg border border-slate-200 bg-white",
          confirmButton: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          cancelButton: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          actions: "gap-3 flex w-full justify-center mt-6 flex-col-reverse sm:flex-row"
        },
        confirmButtonText: "Hide Group",
        cancelButtonText: "Cancel"
      });
    } else {
      result = await Swal.fire({
        html: `
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
            <h2 class="text-slate-800 text-xl font-bold mb-2">Delete chat?</h2>
            <p class="text-slate-500 font-medium text-[15px] leading-relaxed">
              Messages will be cleared and this chat will be removed.
            </p>
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        buttonsStyling: false,
        width: "440px",
        padding: "1.75rem",
        customClass: {
          popup: "rounded-3xl shadow-lg border border-slate-200 bg-white",
          confirmButton: "bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          cancelButton: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          actions: "gap-3 flex w-full justify-center mt-6 flex-col-reverse sm:flex-row"
        },
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel"
      });
    }

    if (!result.isConfirmed) return;

    try {
      setShowHeaderOptions(false);
      toast.loading(isJourneyGroup ? "Hiding chat..." : "Deleting chat...", { id: "delete-chat" });
      const res = await axios.delete(
      `/chat/room/${roomToDelete._id}/delete-chat`,
      { withCredentials: true }
      );
      if (res.data.success) {
        setRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
        if (activeRoom?._id === roomToDelete._id) {
          setActiveRoom(null);
          setMessages([]);
        }
        showToast.success(isJourneyGroup ? "Group hidden" : "Chat deleted", { id: "delete-chat" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || (isJourneyGroup ? "Error hiding group" : "Error deleting chat"), {
        id: "delete-chat"
      });
    }
  };

  const handleToggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) => {
      const roomToToggle = rooms.find((r) => r._id === roomId);
      if (!roomToToggle) return prev;

      const isJourneyGroup = !!roomToToggle.journeyId;

      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        if (next.size > 0) {
          const firstSelectedId = next.values().next().value;
          const firstSelectedRoom = rooms.find((r) => r._id === firstSelectedId);
          const firstIsJourneyGroup = !!firstSelectedRoom?.journeyId;

          if (isJourneyGroup !== firstIsJourneyGroup) {
            showToast.error("Cannot select Journey Groups and normal chats together", { id: "mix-selection" });
            return prev;
          }
        }
        next.add(roomId);
      }
      return next;
    });
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedRoomIds.size === 0) return;

    const selectedRooms = rooms.filter((r) => selectedRoomIds.has(r._id));
    const isOnlyJourneyGroups = selectedRooms.length > 0 && selectedRooms.every((r) => r.journeyId);
    const hasJourneyGroups = selectedRooms.some((r) => r.journeyId);

    let result;

    if (isOnlyJourneyGroups) {
      result = await Swal.fire({
        html: `
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-[#F3E8FF] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </div>
            <h2 class="text-slate-800 text-xl font-bold mb-2">Hide ${selectedRoomIds.size} Journey Group${selectedRoomIds.size > 1 ? "s" : ""}?</h2>
            <p class="text-slate-500 font-medium text-[15px] leading-relaxed">
              The selected groups will be hidden from your chat list. You'll remain a member of their Journeys. You can access the groups again from each Journey, and they will automatically reappear when new messages arrive.
            </p>
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        buttonsStyling: false,
        width: "440px",
        padding: "1.75rem",
        customClass: {
          popup: "rounded-3xl shadow-lg border border-slate-200 bg-white",
          confirmButton: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          cancelButton: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          actions: "gap-3 flex w-full justify-center mt-6 flex-col-reverse sm:flex-row"
        },
        confirmButtonText: `Hide ${selectedRoomIds.size} Group${selectedRoomIds.size > 1 ? "s" : ""}`,
        cancelButtonText: "Cancel"
      });
    } else {
      const title = hasJourneyGroups ?
      `Delete / Hide ${selectedRoomIds.size} chat${selectedRoomIds.size > 1 ? "s" : ""}?` :
      `Delete ${selectedRoomIds.size} chat${selectedRoomIds.size > 1 ? "s" : ""}?`;
      const text = hasJourneyGroups ?
      "Normal chats will be cleared. Journey groups will be hidden." :
      "Messages will be cleared and chats will be removed.";

      result = await Swal.fire({
        html: `
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
            <h2 class="text-slate-800 text-xl font-bold mb-2">${title}</h2>
            <p class="text-slate-500 font-medium text-[15px] leading-relaxed">
              ${text}
            </p>
          </div>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        buttonsStyling: false,
        width: "440px",
        padding: "1.75rem",
        customClass: {
          popup: "rounded-3xl shadow-lg border border-slate-200 bg-white",
          confirmButton: "bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          cancelButton: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 py-2.5 font-semibold transition duration-200 w-full sm:w-auto",
          actions: "gap-3 flex w-full justify-center mt-6 flex-col-reverse sm:flex-row"
        },
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel"
      });
    }

    if (!result.isConfirmed) return;

    try {
      toast.loading("Processing selected chats...", { id: "delete-selected-chats" });
      const deletePromises = Array.from(selectedRoomIds).map(async (roomId) => {
        try {
          const res = await axios.delete(`/chat/room/${roomId}/delete-chat`, { withCredentials: true });
          return { roomId, success: res.data?.success };
        } catch {
          return { roomId, success: false };
        }
      });

      const results = await Promise.allSettled(deletePromises);
      const successfulRoomIds = new Set();
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value?.success) {
          successfulRoomIds.add(res.value.roomId);
        }
      });

      if (successfulRoomIds.size > 0) {
        setRooms((prev) => prev.filter((r) => !successfulRoomIds.has(r._id)));
        if (activeRoom && successfulRoomIds.has(activeRoom._id)) {
          setActiveRoom(null);
          setMessages([]);
        }
        setIsDeleteSelectionMode(false);
        setSelectedRoomIds(new Set());
        showToast.success("Action completed", { id: "delete-selected-chats" });
      } else {
        showToast.error("Failed to process selected chats", { id: "delete-selected-chats" });
      }
    } catch (err) {
      showToast.error("Failed to process some chats", { id: "delete-selected-chats" });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadNewMessagesCount(0);
  };

  const prevMessagesLength = useRef(0);
  const prevActiveRoomId = useRef(null);
  const prevLastMessageId = useRef(null);

  useEffect(() => {
    if (!activeRoom) {
      prevMessagesLength.current = 0;
      prevActiveRoomId.current = null;
      prevLastMessageId.current = null;
      return;
    }

    const currentLength = messages.length;
    const currentRoomId = activeRoom._id;

    if (currentRoomId !== prevActiveRoomId.current) {

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
      setUnreadNewMessagesCount(0);
    } else if (
    currentLength > prevMessagesLength.current ||
    currentLength > 0 && messages[currentLength - 1]?._id !== prevLastMessageId.current)
    {
      const lastMsg = messages[currentLength - 1];
      const senderId = typeof lastMsg?.sender === "object" ? lastMsg.sender?._id || lastMsg.sender?.id : lastMsg?.sender;
      const isSelf = senderId?.toString() === currentUserId?.toString();


      if (isSelf || !showScrollBottom) {
        setTimeout(scrollToBottom, 50);
      }
    }

    prevMessagesLength.current = currentLength;
    prevActiveRoomId.current = currentRoomId;
    prevLastMessageId.current = currentLength > 0 ? messages[currentLength - 1]?._id : null;
  }, [messages, activeRoom, currentUserId, showScrollBottom]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
      headerOptionsRef.current &&
      !headerOptionsRef.current.contains(event.target))
      {
        setShowHeaderOptions(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowHeaderOptions(false);
      }
    };
    if (showHeaderOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showHeaderOptions]);

  const activeChats = rooms.filter(
  (r) =>
  r.type === "direct" && (
  r.requestStatus === "accepted" ||
  r.requestStatus === "pending" && isMyRequest(r))
  );
  const requestChats = rooms.filter(
  (r) =>
  r.type === "direct" && r.requestStatus === "pending" && !isMyRequest(r)
  );
  const followRequests = notifications.filter(
  (n) => n.type === "follow_request"
  );
  const groupChats = rooms.filter(
    (r) => r.type === "group" || r.type === "journey" || r.travelGroupId || r.journeyId
  );
  const displayedRooms =
    activeTab === "chats" ?
    activeChats :
    activeTab === "requests" ?
    requestChats :
    groupChats;
  const filteredRooms = displayedRooms.filter((r) =>
    (r.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (d) =>
  d ?
  new Date(d).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  }) :
  "";

  const formatDateLabel = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getAvatar = (objOrPic, name) => getAvatarUrl(objOrPic, null, name);

  return (
    <div className={`${isEmbedded ? "h-full" : "h-[100dvh]"} w-full flex bg-white overflow-hidden`}>
      <style>{`.cs::-webkit-scrollbar{width:4px}.cs::-webkit-scrollbar-track{background:transparent}.cs::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:8px}`}</style>

      {!isEmbedded &&
      <ChatSidebar
      isDeleteSelectionMode={isDeleteSelectionMode}
      selectedRoomIds={selectedRoomIds}
      setIsDeleteSelectionMode={setIsDeleteSelectionMode}
      setSelectedRoomIds={setSelectedRoomIds}
      handleDeleteSelectedChats={handleDeleteSelectedChats}
      socketConnected={socketConnected}
      showListMoreOptions={showListMoreOptions}
      setShowListMoreOptions={setShowListMoreOptions}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      requestChats={requestChats}
      followRequests={followRequests}
      loading={loading}
      filteredRooms={filteredRooms}
      activeRoom={activeRoom}
      handleSelectRoom={selectRoom}
      handleToggleRoomSelection={handleToggleRoomSelection}
      currentUserId={currentUserId}
      onlineUsers={onlineUsers}
      getAvatar={getAvatar}
      getLatestMessagePreview={getLatestMessagePreview}
      formatTime={formatTime}
      isSearchingGlobal={isSearchingGlobal}
      globalUsers={globalUsers}
      handleSelectGlobalUser={handleSelectGlobalUser}
      handleAcceptFollowRequest={handleAcceptFollow}
      handleDeclineFollowRequest={handleRejectFollow}
      processingRequestIds={processingRequestIds} />}



      {}
      <main
      className={`flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden ${
      isEmbedded || activeRoom ? "flex" : "hidden lg:flex"
      }`}>

        {activeRoom ?
        <>
                        <ChatHeader
          activeRoom={activeRoom}
          setActiveRoom={setActiveRoom}
          currentUserId={currentUserId}
          onlineUsers={onlineUsers}
          user={user}
          getAvatar={getAvatar}
          showHeaderOptions={showHeaderOptions}
          setShowHeaderOptions={setShowHeaderOptions}
          headerOptionsRef={headerOptionsRef}
          handleReportUser={handleReportUser}
          handleBlockUser={handleBlockUser}
          handleClearChat={handleClearChat}
          handleDeleteChat={handleDeleteChat} />

            
                        {}
            <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          user={user}
          activeRoom={activeRoom}
          chatContainerRef={chatContainerRef}
          handleScroll={handleScroll}
          formatDateLabel={formatDateLabel}
          formatTime={formatTime}
          getAvatar={getAvatar}
          handleDeleteForMe={handleDeleteForMe}
          handleUnsend={handleUnsend}
          setReplyToMsg={setReplyToMsg}
          handleReaction={handleReaction}
          handleOpenStory={handleOpenStory}
          activeMessageOptions={activeMessageOptions}
          setActiveMessageOptions={setActiveMessageOptions}
          typingUsers={typingUsers}
          messagesEndRef={messagesEndRef}
          loadingMessages={loadingMessages} />

            
            {}
            {activeRoom.type === "direct" &&
          activeRoom.requestStatus === "pending" ?
          activeRoom.requestedBy?.toString() === currentUserId?.toString() ?
          <div className="px-4 py-3 border-t border-slate-100 bg-white text-center">
                  <p className="text-xs font-medium text-slate-400">
                    Waiting for {activeRoom.name} to accept your request.
                  </p>
                </div> :

          <div className="px-4 py-4 border-t border-slate-100 bg-white">
                  <p className="text-sm font-semibold text-slate-600 mb-3 text-center">
                    {activeRoom.name} wants to connect with you.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
              onClick={() => handleRequestAction("accept")}
              disabled={isProcessingAction}
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs">

                      {isProcessingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                      Accept
                    </button>
                    <button
              onClick={() => handleRequestAction("decline")}
              disabled={isProcessingAction}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 rounded-full text-sm font-bold transition-all">

                      Decline
                    </button>
                  </div>
                </div> :

          activeRoom.type === "direct" &&
          (() => {
            const otherUser = activeRoom.members?.find(
              (member) => (member._id || member)?.toString() !== currentUserId?.toString()
            );
            const otherUserId = (otherUser?._id || otherUser)?.toString();
            const isBlockedByMe = Boolean(
              otherUserId &&
              user?.blockedUsers?.some((id) => (id._id || id)?.toString() === otherUserId)
            );
            const isBlocked = isBlockedByMe || activeRoom.requestStatus === "blocked";
            const isDeclined = activeRoom.requestStatus === "declined";

            if (isBlockedByMe) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    🔒 You blocked this user.{" "}
                    <button
                      onClick={handleBlockUser}
                      className="text-brand-600 font-bold ml-1 hover:underline hover:text-brand-700 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              );
            }

            if (isBlocked) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    🔒 This conversation is unavailable.
                  </div>
                </div>
              );
            }

            if (isDeclined) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    Message request was declined.
                  </div>
                </div>
              );
            }

            return null;
          })() ?
          (() => {
            const otherUser = activeRoom.members?.find(
              (member) => (member._id || member)?.toString() !== currentUserId?.toString()
            );
            const otherUserId = (otherUser?._id || otherUser)?.toString();
            const isBlockedByMe = Boolean(
              otherUserId &&
              user?.blockedUsers?.some((id) => (id._id || id)?.toString() === otherUserId)
            );
            const isBlocked = isBlockedByMe || activeRoom.requestStatus === "blocked";
            const isDeclined = activeRoom.requestStatus === "declined";

            if (isBlockedByMe) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    🔒 You blocked this user.{" "}
                    <button
                      onClick={handleBlockUser}
                      className="text-brand-600 font-bold ml-1 hover:underline hover:text-brand-700 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              );
            }

            if (isBlocked) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    🔒 This conversation is unavailable.
                  </div>
                </div>
              );
            }

            if (isDeclined) {
              return (
                <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                    Message request was declined.
                  </div>
                </div>
              );
            }

            return null;
          })() :

          <ChatInput
          activeRoom={activeRoom}
          user={user}
          showScrollBottom={showScrollBottom}
          scrollToBottom={scrollToBottom}
          unreadNewMessagesCount={unreadNewMessagesCount}
          replyToMsg={replyToMsg}
          setReplyToMsg={setReplyToMsg}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isRecording={isRecording}
          recordingTime={recordingTime}
          stopVoiceRecording={stopVoiceRecording}
          cancelVoiceRecording={cancelVoiceRecording}
          audioBlob={audioBlob}
          setAudioBlob={setAudioBlob}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleEmojiClick={handleEmojiClick}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          isSending={isSending}
          inputText={inputText}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
          startVoiceRecording={startVoiceRecording}
          handleSendMessage={handleSendMessage}
          textareaRef={textareaRef} />}


          </> :
        loading ?
        <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden animate-pulse">
            <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
                <div className="h-2.5 w-20 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-6 overflow-hidden">
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0"></div>
                <div className="h-10 w-48 bg-slate-200 rounded-2xl rounded-bl-sm"></div>
              </div>
              <div className="flex justify-end">
                <div className="h-10 w-56 bg-slate-200 rounded-2xl rounded-br-sm"></div>
              </div>
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0"></div>
                <div className="h-16 w-64 bg-slate-200 rounded-2xl rounded-bl-sm"></div>
              </div>
              <div className="flex justify-end">
                <div className="h-10 w-40 bg-slate-200 rounded-2xl rounded-br-sm"></div>
              </div>
            </div>
            <div className="bg-white p-4 border-t border-slate-100 shrink-0">
               <div className="h-12 w-full bg-slate-100 rounded-2xl"></div>
            </div>
          </div> :

        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <MessageSquare className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-600 mb-1.5">Select a conversation</h3>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-[240px]">
              Choose a traveler or group to start chatting.
            </p>
          </div>}

      </main>

      <AnimatePresence>
        {showBlockModal && activeRoom &&
        <div
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-0"
        onClick={() => setShowBlockModal(false)}>

            <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-white w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col items-center text-center p-6 mb-4 sm:mb-0"
          onClick={(e) => e.stopPropagation()}>

              {(() => {
              const otherUser = activeRoom.members?.find(
              (member) => (member._id || member)?.toString() !== currentUserId?.toString()
              );
              return (
                <>
                    <img
                  src={getAvatar(otherUser, otherUser?.name)}
                  alt=""
                  className="w-[72px] h-[72px] rounded-full object-cover shadow-sm mb-3 border border-slate-100" />

                    <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                      Block {otherUser?.name}?
                    </h3>
                    {otherUser?.username &&
                  <p className="text-[14px] font-medium text-slate-500 mb-5">
                        @{otherUser.username}
                      </p>}

                    {!otherUser?.username && <div className="h-5"></div>}

                    <div className="text-[13.5px] text-slate-600 mb-6 space-y-3 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>
                          You won't be able to send messages to each other.
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>
                          Existing chat history will remain available.
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>You can unblock them anytime.</span>
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <button
                    onClick={confirmBlockUser}
                    className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-[15px] shadow-sm hover:shadow-md transition-all active:scale-[0.98]">

                        Block User
                      </button>
                      <button
                    onClick={() => setShowBlockModal(false)}
                    className="w-full py-3.5 text-slate-700 bg-transparent rounded-2xl font-bold text-[15px] hover:bg-slate-100 transition-all active:scale-[0.98]">

                        Cancel
                      </button>
                    </div>
                  </>);

            })()}
            </motion.div>
          </div>}

      </AnimatePresence>

      <DispatchViewer
      activeStoryGroup={activeStoryGroup}
      activeStoryIndex={activeStoryIndex}
      setActiveStoryGroup={setActiveStoryGroup}
      setActiveStoryIndex={setActiveStoryIndex}
      myUserId={currentUserId}
      user={user}
      closeStoryViewer={() => setActiveStoryGroup(null)}
      nextStory={() => setActiveStoryGroup(null)}
      prevStory={() => setActiveStoryGroup(null)}
      isStoryPaused={false}
      setIsStoryPaused={() => {}}
      isStoryMuted={true}
      setIsStoryMuted={() => {}} />

    </div>);

};

export default ChatRoom;