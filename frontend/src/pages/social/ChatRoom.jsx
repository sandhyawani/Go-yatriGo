import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "../../api/axios";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
import { SOCKET_EVENTS } from "../../constants/socketEvents";
import {
  MessageSquare,
  Send,
  Users,
  Compass,
  ArrowLeft,
  Search,
  Smile,
  MoreVertical,
  Paperclip,
  Phone,
  Video,
  Mic,
  X,
  ChevronDown,
  Square,
  Trash2,
  Home,
} from "lucide-react";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import EmojiPicker from "emoji-picker-react";
import ChatBubble from "../../components/chat/ChatBubble";
import StoryViewer from "../../components/story/StoryViewer";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatMessages from "../../components/chat/ChatMessages";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

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

  // Story Viewer States
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
      console.log("CUSTOM EVENT message_sent received:", e.detail);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, location.state]);

  const showScrollBottomRef = useRef(showScrollBottom);
  useEffect(() => {
    showScrollBottomRef.current = showScrollBottom;
  }, [showScrollBottom]);

  useEffect(() => {
    if (!socket) return;
    setSocketConnected(socket.connected);

    // Capture userId at effect registration time using the stable primitive ID
    const userId = currentUserId;

    const onConnect = () => {
      // [SOCKET RECEIVED] ChatRoom — connect or reconnect
      // NOTE: go_online is NOT emitted here — SocketContext already does it.
      console.log("[SOCKET RECEIVED] ChatRoom — connect", {
        socketId: socket.id,
        userId,
        isReconnect: socket.recovered ?? false,
        time: Date.now(),
      });
      setSocketConnected(true);
      const activeId = getRoomIdString(activeRoomRef.current?._id);
      if (activeId) {
        console.log("[SOCKET RECEIVED] ChatRoom — rejoining room on reconnect:", activeId);
        socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, activeId);
        syncRoomMessages(activeRoomRef.current);
      }
    };

    const onDisconnect = (reason) => {
      console.log("[SOCKET RECEIVED] ChatRoom — disconnect", {
        socketId: socket.id,
        userId,
        reason,
        time: Date.now(),
      });
      setSocketConnected(false);
    };

    if (socket.connected) onConnect();

    const onUserPresence = ({ userId, status }) => {
      console.log("[SOCKET RECEIVED] ChatRoom — user_presence:", { userId, status });
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        status === "online" ? s.add(userId) : s.delete(userId);
        return s;
      });
    };

    const onInitialOnlineUsers = (userIds) => {
      console.log("[SOCKET RECEIVED] ChatRoom — initial_online_users, count:", userIds.length);
      setOnlineUsers(new Set(userIds));
    };

    console.log("[SOCKET REGISTER] ChatRoom — REGISTER receive_chat_message listener", { userId, socketId: socket.id, time: Date.now() });

    const onReceiveChatMessage = (message) => {
      console.log("[SOCKET RECEIVED] ChatRoom — receive_chat_message", {
        id: message._id,
        roomId: message.roomId,
        time: Date.now(),
      });

      const msgSenderId = typeof message.sender === "object" ? (message.sender?._id || message.sender?.id) : message.sender;
      const isSelf = msgSenderId?.toString() === currentUserId?.toString();

      // Normalize both sides to strings to prevent ObjectId vs string type mismatch
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);
      // Normalize the incoming message _id to a string
      const incomingMsgId = message._id?.toString?.() ?? message._id;

      console.log("[SOCKET RECEIVED] ChatRoom — room guard", {
        incomingRoomId,
        activeRoomId,
        matched: incomingRoomId === activeRoomId,
      });

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        if (showScrollBottomRef.current && !isSelf) {
          setUnreadNewMessagesCount((prev) => prev + 1);
        }

        console.log("[SOCKET RECEIVED] ChatRoom — updating messages");

        setMessages((prev) => {
          console.log("[SOCKET RECEIVED] ChatRoom — setMessages updater — previous count", prev.length);
          let updatedMessages = [...prev];

          // 1. Reconcile optimistic message
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

          // 2. Reaction message mapping
          const isReaction =
            (message.text || "").startsWith("Reacted to your story:") ||
            (message.content || "").startsWith("Reacted to your story:");

          if (isReaction && message.storyId) {
            const storyRef = getRoomIdString(message.storyId);
            const existingIdx = prev.findIndex((m) => {
              const mSenderId = typeof m.sender === "object" ? (m.sender?._id || m.sender?.id) : m.sender;
              const mStoryId = getRoomIdString(m.storyId);
              return mSenderId?.toString() === msgSenderId?.toString() &&
                mStoryId === storyRef &&
                ((m.text || "").startsWith("Reacted to your story:") ||
                  (m.content || "").startsWith("Reacted to your story:"));
            });
            if (existingIdx !== -1) {
              updatedMessages.splice(existingIdx, 1);
              updatedMessages.push({ ...message, _id: incomingMsgId });
              return updatedMessages;
            }
          }

          // 3. Deduplicate by database _id — normalize to string on both sides
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
      } else {
        console.warn("[SOCKET RECEIVED] ChatRoom — room guard REJECTED", {
          incomingRoomId,
          activeRoomId,
          messageId: incomingMsgId,
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
                getRoomIdString(r._id) !== activeRoomId && !isSelf
                  ? (r.unreadCount || 0) + 1
                  : r.unreadCount,
            };
          }
          return r;
        });

        // Reorder conversations list to push room with latest message to top
        return [...updatedRooms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      // Receipt acknowledgment — emitted once here; the standalone mark_messages_read
      // useEffect that was firing on every message render has been removed.
      if (socket && socket.connected && !isSelf) {
        if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
          console.log("[SOCKET RECEIVED] ChatRoom — emitting mark_messages_read for room:", incomingRoomId);
          socket.emit(SOCKET_EVENTS.EMIT_MARK_MESSAGES_READ, {
            roomId: message.roomId,
            userId: currentUserId,
          });
        } else {
          console.log("[SOCKET RECEIVED] ChatRoom — emitting message_delivered for:", message._id);
          socket.emit(SOCKET_EVENTS.EMIT_MESSAGE_DELIVERED, {
            roomId: message.roomId,
            messageId: message._id,
            userId: currentUserId,
          });
        }
      }
    };

    const onMessageSent = ({ roomId, messageId, clientMsgId, message }) => {
      console.log("[SOCKET RECEIVED] ChatRoom — message_sent", { roomId, messageId, clientMsgId });
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
      console.log("[SOCKET RECEIVED] ChatRoom — message_delivered", { roomId, messageId, userId });
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
      console.log("[SOCKET RECEIVED] ChatRoom — messages_seen", { roomId, userId });
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
      console.log("[SOCKET RECEIVED] ChatRoom — messages_read", { roomId, userId, readByUserId });
      const targetUserId = userId || readByUserId;
      if (!targetUserId) return;
      onMessagesSeen({ roomId, userId: targetUserId });
    };

    const onStoryReactionMessageUpdated = (message) => {
      console.log("[SOCKET RECEIVED] ChatRoom — story_reaction_message_updated", message);
      const incomingRoomId = getRoomIdString(message.roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) => {
          const storyRef = getRoomIdString(message.storyId);
          const idx = prev.findIndex((m) => {
            const mSenderId = typeof m.sender === "object" ? (m.sender?._id || m.sender?.id) : m.sender;
            const msgSenderId = typeof message.sender === "object" ? (message.sender?._id || message.sender?.id) : message.sender;
            const mStoryId = getRoomIdString(m.storyId);
            return m._id === message._id ||
              (mSenderId?.toString() === msgSenderId?.toString() &&
               mStoryId === storyRef &&
               (m.text || "").startsWith("Reacted to your story:"));
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
      console.log("[SOCKET RECEIVED] ChatRoom — is_typing:", { roomId, userName });
      setTypingUsers((prev) => ({ ...prev, [roomId]: userName }));
    };

    const onNotTyping = ({ roomId }) => {
      console.log("[SOCKET RECEIVED] ChatRoom — not_typing:", roomId);
      setTypingUsers((prev) => {
        const s = { ...prev };
        delete s[roomId];
        return s;
      });
    };

    const onMessageUnsent = ({ roomId, messageId }) => {
      console.log("[SOCKET RECEIVED] ChatRoom — message:unsent:", { roomId, messageId });
      const incomingRoomId = getRoomIdString(roomId);
      const activeRoomId = getRoomIdString(activeRoomRef.current?._id);

      if (incomingRoomId && activeRoomId && incomingRoomId === activeRoomId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isUnsent: true } : m))
        );
      }
    };

    const onRequestStatusUpdated = ({
      roomId,
      requestStatus,
      room,
      updatedBy,
    }) => {
      console.log("[SOCKET RECEIVED] ChatRoom — request_status_updated:", { roomId, requestStatus, updatedBy });
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
        requestStatus === "accepted"
      ) {
        showToast.success("Your message request was accepted!");
      }
    };

    // --- Register all listeners with SOCKET_EVENTS constants ---
    console.log("[SOCKET REGISTER] ChatRoom — registering all chat listeners", { socketId: socket.id, time: Date.now() });
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
      console.log("[SOCKET CLEANUP] ChatRoom — removing all chat listeners", { socketId: socket.id, time: Date.now() });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUserId]);

  // REMOVED: The standalone mark_messages_read useEffect that previously fired
  // on every messages/activeRoom change was removed because:
  // 1. It caused duplicate mark_messages_read emits (also emitted inside onReceiveChatMessage)
  // 2. It re-ran on every new message, producing redundant server calls
  // Marking as read is now handled solely inside onReceiveChatMessage above.
  // The unreadBy state is updated locally to keep the UI in sync without extra emits.

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const targetUserId = location.state?.targetUserId;
      const targetGroupId = location.state?.groupId || roomId;
      let roomRes;

      if (targetUserId) {
        roomRes = await axios.post(
          `/chat/room/direct/${targetUserId}`,
          {},
          { withCredentials: true },
        );
        window.history.replaceState({}, document.title);
      }

      const res = await axios.get("/chat/rooms", { withCredentials: true });
      const notifRes = await axios.get("/notifications", {
        withCredentials: true,
      });
      if (res.data.success) {
        setRooms(res.data.rooms);
        // Phase 4 fix: Only join the active/target room, NOT every room.
        // Joining every room on load creates N redundant server-side socket room memberships.
        // The server already handles routing messages to the correct user via their personal room.
        // We join the active room explicitly in selectRoom() and on reconnect in onConnect().
        if (targetUserId && roomRes?.data?.room) {
          if (socket) socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, roomRes.data.room._id);
          const matched = res.data.rooms.find(
            (r) => r._id === roomRes.data.room._id,
          );
          if (matched) selectRoom(matched);
        } else if (targetGroupId) {
          window.history.replaceState({}, document.title);
          const matched = res.data.rooms.find((r) => {
            const rGroupId =
              typeof r.travelGroupId === "object"
                ? r.travelGroupId?._id
                : r.travelGroupId;
            const rGroupIdStr = rGroupId ? rGroupId.toString() : "";
            const roomIdStr = r._id ? r._id.toString() : "";
            const targetGroupIdStr = targetGroupId ? targetGroupId.toString() : "";
            return rGroupIdStr === targetGroupIdStr || roomIdStr === targetGroupIdStr;
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
        withCredentials: true,
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
    setActiveRoom(room);
    setMessages([]);
    setInputText("");
    setMessagesPage(1);
    setHasMoreMessages(false);
    if (room.type === "direct") {
      setActiveTab(
        room.requestStatus === "pending" && !isMyRequest(room)
          ? "requests"
          : "chats",
      );
    } else {
      setActiveTab("groups");
    }
    try {
      socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, room._id);
      setLoadingMessages(true);
      const res = await axios.get(`/chat/room/${room._id}/messages?page=1&limit=50`, {
        withCredentials: true,
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
      const res = await axios.post(
        `/chat/room/direct/${targetUser._id}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        const newRoom = res.data.room;
        const existingRoom = rooms.find((r) => r._id === newRoom._id);
        if (!existingRoom) {
          setRooms((prev) => [newRoom, ...prev]);
          if (socket) socket.emit(SOCKET_EVENTS.EMIT_JOIN_CHAT_ROOM, newRoom._id);
        }
        setSearchQuery("");
        setGlobalUsers([]);
        selectRoom(existingRoom || newRoom);
      }
    } catch (err) {
      showToast.error("Failed to start conversation");
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
          withCredentials: true,
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
      media: selectedFile ? URL.createObjectURL(selectedFile) : (audioBlob ? URL.createObjectURL(audioBlob) : null),
      isAudio: !!audioBlob,
      isPending: true,
      createdAt: new Date().toISOString(),
      unreadBy: activeRoom.members
        .map(member => typeof member === "object" ? member._id : member)
        .filter(id => id?.toString() !== currentUserId?.toString()),
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
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadRes.data.url) mediaUrl = uploadRes.data.url;
        setSelectedFile(null);
      } else if (audioBlob) {
        const formData = new FormData();
        formData.append("image", audioBlob, "voice-message.webm");
        const uploadRes = await axios.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
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
          text: replyToMsg.text,
        };
      }

      const res = await axios.post(
        `/chat/room/${activeRoom._id}/message`,
        payload,
        { withCredentials: true },
      );
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === clientMsgId
              ? {
                  ...res.data.message,
                  replyTo: res.data.message.replyTo || m.replyTo
                }
              : m
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
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id === messageId) {
          const existingReactions = m.reactions || [];
          return {
            ...m,
            reactions: [...existingReactions, { emoji, userId: currentUserId }],
          };
        }
        return m;
      }),
    );
  };

  const handleOpenStory = async (storyId) => {
    try {
      const res = await axios.get(`/social/story/${storyId}`, {
        withCredentials: true,
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
          stories: [story],
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
    try {
      toast.loading(`Processing...`, { id: "req" });
      const res = await axios.put(
        `/chat/room/${activeRoom._id}/${action}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(`Request ${action}ed!`, { id: "req" });
        setActiveRoom((prev) => ({
          ...prev,
          requestStatus: res.data.room.requestStatus,
        }));
        setRooms((prev) =>
          prev.map((r) =>
            r._id === activeRoom._id
              ? { ...r, requestStatus: res.data.room.requestStatus }
              : r,
          ),
        );
        if (action === "accept") setActiveTab("chats");
        else setActiveRoom(null);
      }
    } catch (err) {
      showToast.error(`Error: ${err.message}`, { id: "req" });
    }
  };

  const handleAcceptFollow = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/users/${requesterId}/follow-request/accept`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.filter(
          (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
        ),
      );
      showToast.success("Follow request accepted");
    } catch (err) {
      showToast.error("Failed to accept request");
    }
  };

  const handleRejectFollow = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/users/${requesterId}/follow-request/reject`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.filter(
          (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteForMe = async (messageId) => {
    try {
      const res = await axios.delete(
        `/chat/room/${activeRoom._id}/messages/${messageId}/delete-for-me`,
        { withCredentials: true },
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
        { withCredentials: true },
      );
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isUnsent: true } : m)),
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
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("User reported", { id: "report" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error reporting user", {
        id: "report",
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

      const otherUserId = otherUser._id || otherUser;
      const isBlocked = user?.blockedUsers?.includes(otherUserId);

      if (!isBlocked) {
        setShowBlockModal(true);
        return;
      }

      toast.loading("Unblocking user...", { id: "block" });
      const res = await axios.post(
        `/users/unblock/${otherUserId}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${currentUserId}`, {
          withCredentials: true,
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers || freshSelf.data.user?.blockedUsers },
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
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${currentUserId}`, {
          withCredentials: true,
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers || freshSelf.data.user?.blockedUsers },
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed", {
        id: "block",
      });
    }
  };

  const handleClearChat = async () => {
    try {
      setShowHeaderOptions(false);
      toast.loading("Clearing chat...", { id: "clear" });
      const res = await axios.delete(`/chat/room/${activeRoom._id}/clear`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMessages([]);
        showToast.success("Chat cleared", { id: "clear" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error clearing chat", {
        id: "clear",
      });
    }
  };

  const handleDeleteChat = async (roomToDelete = activeRoom, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!roomToDelete) return;

    const result = await Swal.fire({
      title: "Delete chat?",
      text: "Messages will be cleared and this conversation will be removed from your chat list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      setShowHeaderOptions(false);
      toast.loading("Deleting chat...", { id: "delete-chat" });
      const res = await axios.delete(
        `/chat/room/${roomToDelete._id}/delete-chat`,
        { withCredentials: true },
      );
      if (res.data.success) {
        setRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
        if (activeRoom?._id === roomToDelete._id) {
          setActiveRoom(null);
          setMessages([]);
        }
        showToast.success("Chat deleted", { id: "delete-chat" });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Error deleting chat", {
        id: "delete-chat",
      });
    }
  };

  const handleToggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedRoomIds.size === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedRoomIds.size} chat${selectedRoomIds.size > 1 ? "s" : ""}?`,
      text: "Messages will be cleared and selected conversations will be removed from your chat list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      toast.loading("Deleting selected chats...", { id: "delete-selected-chats" });
      const deletePromises = Array.from(selectedRoomIds).map((roomId) =>
        axios.delete(`/chat/room/${roomId}/delete-chat`, { withCredentials: true })
      );
      
      await Promise.all(deletePromises);

      setRooms((prev) => prev.filter((r) => !selectedRoomIds.has(r._id)));
      
      if (activeRoom && selectedRoomIds.has(activeRoom._id)) {
        setActiveRoom(null);
        setMessages([]);
      }

      setIsDeleteSelectionMode(false);
      setSelectedRoomIds(new Set());
      showToast.success("Selected chats deleted", { id: "delete-selected-chats" });
    } catch (err) {
      showToast.error("Failed to delete some chats", { id: "delete-selected-chats" });
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
      // Room changed: instant scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
      setUnreadNewMessagesCount(0);
    } else if (
      currentLength > prevMessagesLength.current ||
      (currentLength > 0 && messages[currentLength - 1]?._id !== prevLastMessageId.current)
    ) {
      const lastMsg = messages[currentLength - 1];
      const senderId = typeof lastMsg?.sender === "object" ? (lastMsg.sender?._id || lastMsg.sender?.id) : lastMsg?.sender;
      const isSelf = senderId?.toString() === currentUserId?.toString();

      // If user sent it, or already at the bottom, scroll to bottom smoothly
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
        !headerOptionsRef.current.contains(event.target)
      ) {
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
      r.type === "direct" &&
      (r.requestStatus === "accepted" ||
        (r.requestStatus === "pending" && isMyRequest(r))),
  );
  const requestChats = rooms.filter(
    (r) =>
      r.type === "direct" && r.requestStatus === "pending" && !isMyRequest(r),
  );
  const followRequests = notifications.filter(
    (n) => n.type === "follow_request",
  );
  const groupChats = rooms.filter((r) => r.type === "group" || r.travelGroupId);
  const displayedRooms =
    activeTab === "chats"
      ? activeChats
      : activeTab === "requests"
        ? requestChats
        : groupChats;
  const filteredRooms = displayedRooms.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : "";

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
      year: "numeric",
    });
  };

  const getAvatar = (objOrPic, name) => getAvatarUrl(objOrPic, null, name);

  return (
    <div className="h-[100dvh] w-full flex bg-white overflow-hidden">
      <style>{`.cs::-webkit-scrollbar{width:4px}.cs::-webkit-scrollbar-track{background:transparent}.cs::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:8px}`}</style>

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
      />

      {/* RIGHT PANE */}
      <main
        className={`flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden ${
          activeRoom ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeRoom ? (
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
              handleDeleteChat={handleDeleteChat}
            />
            
                        {/* Messages */}
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
            />
            
            {/* Input / Request Area */}
            {activeRoom.type === "direct" &&
            activeRoom.requestStatus === "pending" ? (
              activeRoom.requestedBy?.toString() === currentUserId?.toString() ? (
                <div className="px-4 py-3 border-t border-slate-100 bg-white text-center">
                  <p className="text-xs font-medium text-slate-400">
                    Waiting for {activeRoom.name} to accept your request.
                  </p>
                </div>
              ) : (
                <div className="px-4 py-4 border-t border-slate-100 bg-white">
                  <p className="text-sm font-semibold text-slate-600 mb-3 text-center">
                    {activeRoom.name} wants to connect with you.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleRequestAction("accept")}
                      className="px-5 py-2 bg-[#6C4DF6] text-white rounded-full text-sm font-bold hover:bg-[#5b3ee0] transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequestAction("decline")}
                      className="px-5 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )
            ) : activeRoom.type === "direct" &&
              (() => {
                const otherUser = activeRoom.members?.find(
                  (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                );
                const isBlockedByMe =
                  otherUser && user?.blockedUsers?.includes(otherUser._id || otherUser);
                return (
                  isBlockedByMe ||
                  activeRoom.requestStatus === "declined" ||
                  activeRoom.requestStatus === "blocked"
                );
              })() ? (
              <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center justify-center text-center shrink-0">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[13px] text-slate-500 font-medium">
                  🔒 You blocked this user.{" "}
                  <button
                    onClick={handleBlockUser}
                    className="text-[#6C4DF6] font-bold ml-1 hover:underline"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white border-t border-slate-100 shrink-0 relative flex flex-col">
                {/* Scroll to bottom button */}
                {showScrollBottom && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute -top-12 right-6 bg-[#7F77DD] text-white shadow-lg hover:bg-[#6b62d6] transition-all z-20 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                  >
                    <ChevronDown className="w-4 h-4" />
                    {unreadNewMessagesCount > 0 && (
                      <span>New Messages ({unreadNewMessagesCount})</span>
                    )}
                  </button>
                )}

                {/* Reply Preview Box */}
                {replyToMsg && (
                  <div className="mb-2 p-2 bg-slate-50 border-l-4 border-[#7F77DD] rounded-r-lg flex items-center justify-between shadow-sm mx-2 mt-1">
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[11px] font-bold text-[#7F77DD]">
                        Replying to{" "}
                        {replyToMsg.sender?.name === user?.name ||
                        replyToMsg.senderName === user?.name ||
                        replyToMsg.sender?.username === user?.username ||
                        replyToMsg.senderName === "You"
                          ? "You"
                          : replyToMsg.sender?.name ||
                            replyToMsg.senderName ||
                            "User"}
                      </div>
                      <div className="text-[12px] text-slate-600 truncate">
                        {replyToMsg.text || "Media"}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyToMsg(null)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* File Preview Chip */}
                {selectedFile && (
                  <div className="mb-2 self-start flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full mx-2 text-[12px] font-medium text-slate-700">
                    <Paperclip className="w-3.5 h-3.5 text-[#7F77DD]" />
                    <span className="max-w-[150px] truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-slate-400">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Audio Recording UI */}
                {isRecording && (
                  <div className="mb-2 self-start flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-full mx-2 border border-rose-100 shadow-sm animate-pulse w-full max-w-sm justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-rose-600 font-bold text-sm">
                        {Math.floor(recordingTime / 60)}:
                        {(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={stopVoiceRecording}
                        className="p-1.5 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelVoiceRecording}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Audio Preview Chip */}
                {audioBlob && !isRecording && (
                  <div className="mb-2 self-start flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mx-2 text-[12px] font-medium text-emerald-700 border border-emerald-100">
                    <Mic className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Voice Message</span>
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="ml-1 text-emerald-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden border border-slate-100">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="light"
                    />
                  </div>
                )}
                <div className="flex items-end gap-2 bg-white rounded-2xl px-2 py-1.5 shadow-sm border border-slate-200 focus-within:border-[#7F77DD] focus-within:ring-2 focus-within:ring-[#7F77DD]/20 transition-all mx-2 mb-1">
                  <button
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Open emoji picker"
                    className="p-2 text-slate-400 hover:text-[#7F77DD] rounded-lg transition-colors shrink-0"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*,video/*,.heic,.heif"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    aria-label="Attach file"
                    className={`p-2 rounded-lg transition-colors shrink-0 hidden sm:block ${isSending ? "text-slate-300" : "text-slate-400 hover:text-[#7F77DD]"}`}
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    rows={1}
                    className="flex-1 max-h-[120px] bg-transparent text-[14px] text-slate-800 px-1 py-2 resize-none outline-none placeholder-slate-400 cs min-h-[36px]"
                  />
                  {!isRecording &&
                    !inputText.trim() &&
                    !audioBlob &&
                    !selectedFile && (
                      <button
                        onClick={startVoiceRecording}
                        disabled={isSending}
                        aria-label="Record voice message"
                        className={`p-2 rounded-lg transition-colors shrink-0 hidden sm:block ${isSending ? "text-slate-300" : "text-slate-400 hover:text-[#7F77DD]"}`}
                      >
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                    )}
                  <div className="flex flex-col justify-end h-full mb-0.5">
                    <div className="text-center text-[9px] text-slate-300 -mt-3 mb-1 w-full hidden sm:block pointer-events-none opacity-60">
                      Enter to send · Shift+Enter for new line
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        isSending ||
                        (!inputText.trim() && !selectedFile && !audioBlob)
                      }
                      aria-disabled={
                        isSending ||
                        (!inputText.trim() && !selectedFile && !audioBlob)
                          ? "true"
                          : "false"
                      }
                      aria-label="Send message"
                      className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        inputText.trim() || selectedFile || audioBlob
                          ? "bg-[#7F77DD] text-white hover:bg-[#6b62d6] shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                          : "bg-slate-100 text-[#7F77DD] opacity-35 pointer-events-none"
                      }`}
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            {/* Empty state removed - now shows blank space until a conversation is selected */}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showBlockModal && activeRoom && (
          <div
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-0"
            onClick={() => setShowBlockModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col items-center text-center p-6 mb-4 sm:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const otherUser = activeRoom.members?.find(
                  (member) => (member._id || member)?.toString() !== currentUserId?.toString()
                );
                return (
                  <>
                    <img
                      src={getAvatar(otherUser, otherUser?.name)}
                      alt=""
                      className="w-[72px] h-[72px] rounded-full object-cover shadow-sm mb-3 border border-slate-100"
                    />
                    <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                      Block {otherUser?.name}?
                    </h3>
                    {otherUser?.username && (
                      <p className="text-[14px] font-medium text-slate-500 mb-5">
                        @{otherUser.username}
                      </p>
                    )}
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
                        className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-bold text-[15px] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        Block User
                      </button>
                      <button
                        onClick={() => setShowBlockModal(false)}
                        className="w-full py-3.5 text-slate-700 bg-transparent rounded-2xl font-bold text-[15px] hover:bg-slate-100 transition-all active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StoryViewer
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
        setIsStoryMuted={() => {}}
      />
    </div>
  );
};

export default ChatRoom;