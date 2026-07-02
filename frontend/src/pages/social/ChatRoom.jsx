import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "../../api/axios";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";
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
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const ChatRoom = () => {
  const { user, dispatch } = useContext(AuthContext);
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
    const myId = user._id || user.id;
    return reqId?.toString() === myId?.toString();
  };

  useEffect(() => {
    fetchChannels();
    const handleRefresh = () => fetchChannels();
    const handleMessageSent = (e) => {
      if (e.detail && e.detail.roomId === roomId) {
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

  useEffect(() => {
    if (!socket) return;
    setSocketConnected(socket.connected);

    const onConnect = () => {
      setSocketConnected(true);
      if (user) socket.emit("go_online", user._id);
      if (activeRoomRef.current) syncRoomMessages(activeRoomRef.current);
    };

    const onDisconnect = () => setSocketConnected(false);

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
      setMessages((prev) => {
        // If this is a reaction message, replace any existing one for the same storyId+sender
        const isReaction =
          (message.text || "").startsWith("Reacted to your story:") ||
          (message.content || "").startsWith("Reacted to your story:");

        if (isReaction && message.storyId) {
          const storyRef =
            typeof message.storyId === "object"
              ? message.storyId._id
              : message.storyId;
          const existingIdx = prev.findIndex(
            (m) =>
              (m.sender === message.sender ||
                m.sender?._id === message.sender) &&
              ((typeof m.storyId === "object"
                ? m.storyId?._id
                : m.storyId)?.toString() === storyRef?.toString()) &&
              ((m.text || "").startsWith("Reacted to your story:") ||
                (m.content || "").startsWith("Reacted to your story:"))
          );
          if (existingIdx !== -1) {
            // Replace the existing reaction message in-place
            const updated = [...prev];
            updated[existingIdx] = message;
            return updated;
          }
        }

        // Deduplicate by _id
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
      setRooms((prev) =>
        prev.map((r) => {
          if (r._id === message.roomId) {
            return {
              ...r,
              latestMessage: message,
              updatedAt: new Date().toISOString(),
              unreadCount:
                r._id !== activeRoomRef.current?._id && message.sender !== user?._id
                  ? (r.unreadCount || 0) + 1
                  : r.unreadCount,
            };
          }
          return r;
        }),
      );
      if (socketConnected && socket && message.sender !== (user._id || user.id)) {
        socket.emit("message_delivered", {
          roomId: message.roomId,
          messageId: message._id,
          userId: user._id || user.id,
        });
      }
    };

    const onMessageDelivered = ({ roomId, messageId, userId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            const deliveredTo = [...(m.deliveredTo || [])];
            if (!deliveredTo.includes(userId)) deliveredTo.push(userId);
            return { ...m, deliveredTo };
          }
          return m;
        }),
      );
    };

    // Dedicated handler for reaction updates emitted by the backend
    const onStoryReactionMessageUpdated = (message) => {
      setMessages((prev) => {
        const storyRef =
          typeof message.storyId === "object"
            ? message.storyId?._id
            : message.storyId;
        const idx = prev.findIndex(
          (m) =>
            m._id === message._id ||
            ((m.sender === message.sender ||
              m.sender?._id === message.sender) &&
              (typeof m.storyId === "object"
                ? m.storyId?._id
                : m.storyId
              )?.toString() === storyRef?.toString() &&
              (m.text || "").startsWith("Reacted to your story:"))
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
        // If not found, append as new
        return [...prev, message];
      });
    };

    const onMessagesRead = ({ roomId, readByUserId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.unreadBy?.includes(readByUserId)) {
            return {
              ...m,
              unreadBy: m.unreadBy.filter((id) => id !== readByUserId),
            };
          }
          return m;
        }),
      );
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
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isUnsent: true } : m)),
      );
    };

    const onRequestStatusUpdated = ({
      roomId,
      requestStatus,
      room,
      updatedBy,
    }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId ? { ...r, ...room, requestStatus } : r,
        ),
      );
      setActiveRoom((prev) =>
        prev?._id === roomId ? { ...prev, ...room, requestStatus } : prev,
      );
      if (
        updatedBy &&
        user &&
        updatedBy !== user._id &&
        requestStatus === "accepted"
      ) {
        showToast.success("Your message request was accepted!");
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("user_presence", onUserPresence);
    socket.on("initial_online_users", onInitialOnlineUsers);
    socket.on("receive_chat_message", onReceiveChatMessage);
    socket.on("message_delivered_update", onMessageDelivered);
    socket.on("story_reaction_message_updated", onStoryReactionMessageUpdated);
    socket.on("messages_read", onMessagesRead);
    socket.on("is_typing", onIsTyping);
    socket.on("not_typing", onNotTyping);
    socket.on("message:unsent", onMessageUnsent);
    socket.on("request_status_updated", onRequestStatusUpdated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("user_presence", onUserPresence);
      socket.off("initial_online_users", onInitialOnlineUsers);
      socket.off("receive_chat_message", onReceiveChatMessage);
      socket.off("message_delivered_update", onMessageDelivered);
      socket.off("story_reaction_message_updated", onStoryReactionMessageUpdated);
      socket.off("messages_read", onMessagesRead);
      socket.off("is_typing", onIsTyping);
      socket.off("not_typing", onNotTyping);
      socket.off("message:unsent", onMessageUnsent);
      socket.off("request_status_updated", onRequestStatusUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user]);

  useEffect(() => {
    if (activeRoom && user && socketConnected && socket) {
      const unread = messages.filter((m) => m.unreadBy?.includes(user._id));
      if (unread.length > 0) {
        socket.emit("mark_messages_read", {
          roomId: activeRoom._id,
          userId: user._id,
        });
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            unreadBy: m.unreadBy?.filter((id) => id !== user._id),
          })),
        );
        setRooms((prev) =>
          prev.map((r) =>
            r._id === activeRoom._id ? { ...r, unreadCount: 0 } : r,
          ),
        );
      }
    }
  }, [messages, activeRoom, user, socketConnected, socket]);

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
        if (socket && res.data.rooms) {
          res.data.rooms.forEach((r) => socket.emit("join_room", r._id));
        }
        if (targetUserId && roomRes?.data?.room) {
          if (socket) socket.emit("join_room", roomRes.data.room._id);
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
      socket.emit("join_room", room._id);
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
          if (socket) socket.emit("join_room", newRoom._id);
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
      socket.emit("typing", { roomId: activeRoom._id, userName: user?.name });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { roomId: activeRoom._id });
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

    if (socketConnected) socket.emit("stop_typing", { roomId: activeRoom._id });

    const clientMsgId = `opt-${Date.now()}`;
    const optimisticMsg = {
      _id: clientMsgId,
      roomId: activeRoom._id,
      sender: user._id || user.id,
      senderName: user.name,
      senderPic: user.pic,
      text: textToSend,
      content: textToSend,
      media: selectedFile ? URL.createObjectURL(selectedFile) : (audioBlob ? URL.createObjectURL(audioBlob) : null),
      isAudio: !!audioBlob,
      isPending: true,
      createdAt: new Date().toISOString(),
      unreadBy: activeRoom.members.filter(m => m !== (user._id || user.id)),
      seenBy: [user._id || user.id],
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

      const payload = { text: textToSend };
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
          prev.map((m) => (m._id === clientMsgId ? res.data.message : m))
        );
        if (socketConnected && socket) {
          socket.emit("send_chat_message", res.data.message);
        }
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
            reactions: [...existingReactions, { emoji, userId: user?._id }],
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
      const otherUser = activeRoom.members?.find((m) => m._id !== user?._id);
      if (!otherUser) return;
      toast.loading("Reporting user...", { id: "report" });
      const res = await axios.post(
        `/users/report/${otherUser._id}`,
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
      const otherUser = activeRoom.members?.find((m) => m._id !== user?._id);
      if (!otherUser) return;

      const isBlocked = user?.blockedUsers?.includes(otherUser._id);

      if (!isBlocked) {
        setShowBlockModal(true);
        return;
      }

      toast.loading("Unblocking user...", { id: "block" });
      const res = await axios.post(
        `/users/unblock/${otherUser._id}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${user._id}`, {
          withCredentials: true,
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers },
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
      const otherUser = activeRoom.members?.find((m) => m._id !== user?._id);
      if (!otherUser) return;

      setShowBlockModal(false);
      toast.loading("Blocking user...", { id: "block" });
      const res = await axios.post(
        `/users/block/${otherUser._id}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(res.data.message, { id: "block" });
        const freshSelf = await axios.get(`/users/${user._id}`, {
          withCredentials: true,
        });
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...user, blockedUsers: freshSelf.data.blockedUsers },
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

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      {/* LEFT PANE */}
      <aside
        className={`w-full lg:w-[300px] border-r border-slate-100 bg-white flex flex-col shrink-0 h-full ${
          activeRoom ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
          {isDeleteSelectionMode ? (
            <div className="flex items-center justify-between h-8">
              <span className="text-[13px] font-bold text-slate-900">
                {selectedRoomIds.size} Selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDeleteSelectionMode(false);
                    setSelectedRoomIds(new Set());
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelectedChats}
                  disabled={selectedRoomIds.size === 0}
                  className={`px-2.5 py-1 text-[11px] font-bold text-white rounded-lg transition-all flex items-center gap-1 ${
                    selectedRoomIds.size === 0
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 active:scale-[0.98]"
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="p-1.5 text-slate-500 hover:text-[#6C4DF6] rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                  title="Back to Home"
                >
                  <Home className="w-4 h-4" />
                </Link>
                <h2 className="text-[15px] font-bold text-slate-900">Messages</h2>
              </div>
              <div className="flex items-center gap-2 relative">
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    socketConnected
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      socketConnected
                        ? "bg-emerald-500"
                        : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  {socketConnected ? "Online" : "Connecting"}
                </span>
                <button
                  onClick={() => setShowListMoreOptions((prev) => !prev)}
                  className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showListMoreOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-[999]"
                      onClick={() => setShowListMoreOptions(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-[1000] bg-white shadow-xl rounded-xl border border-slate-100 w-36 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          setIsDeleteSelectionMode(true);
                          setShowListMoreOptions(false);
                          setSelectedRoomIds(new Set());
                        }}
                        className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                        Delete Chats
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-[13px] pl-8 pr-8 py-2 rounded-lg outline-none border border-slate-200 focus:border-[#6C4DF6]/40 focus:ring-2 focus:ring-[#6C4DF6]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border-b border-transparent">
            {["chats", "requests", "groups"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[11px] font-semibold capitalize rounded-md transition-all ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-[#534AB7] border-b-2 border-[#534AB7]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
                {tab === "requests" &&
                  requestChats.length + followRequests.length > 0 && (
                    <span className="ml-1 bg-[#FF5A7A] text-white px-1 py-0.5 rounded-full text-[9px]">
                      {requestChats.length + followRequests.length}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        {/* Room List */}
        <div
          role="listbox"
          className="flex-1 overflow-y-auto cs p-1.5 space-y-0.5"
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  <div className="h-2.5 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : filteredRooms.length === 0 &&
            (activeTab !== "requests" ||
              followRequests.filter(
                (n) =>
                  !searchQuery ||
                  n.sender?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              ).length === 0) &&
            (!searchQuery ||
              (globalUsers.filter(
                (u) =>
                  !filteredRooms.some(
                    (r) =>
                      r.type === "direct" &&
                      r.members?.some((m) => m._id === u._id),
                  ),
              ).length === 0 &&
                !isSearchingGlobal)) ? (
            <div className="text-center py-10 px-4 select-none">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-400">
                {searchQuery ? (
                  "No users or conversations found"
                ) : (
                  <>
                    {activeTab === "chats" && "No conversations yet"}
                    {activeTab === "requests" && "No pending requests"}
                    {activeTab === "groups" && "No group chats yet"}
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              {searchQuery &&
                (filteredRooms.length > 0 || globalUsers.length > 0) && (
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Existing Chats
                  </div>
                )}
              {filteredRooms.map((room) => {
                const isSelected = activeRoom?._id === room._id;
                const otherMember = room.members?.find(
                  (m) => m._id !== user?._id,
                );
                const isOnline =
                  otherMember && onlineUsers.has(otherMember._id);
                const isTyping = typingUsers[room._id];
                const isBlockedByMe =
                  otherMember && user?.blockedUsers?.includes(otherMember._id);

                return (
                  <div
                    key={room._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isDeleteSelectionMode) {
                        handleToggleRoomSelection(room._id);
                      } else {
                        selectRoom(room);
                      }
                    }}
                    className={`group relative w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-[#EEEDFE] shadow-sm border border-purple-100/50"
                        : "hover:bg-purple-50/50 hover:-translate-y-[1px] hover:shadow-sm border border-transparent"
                    }`}
                  >
                    {isDeleteSelectionMode && (
                      <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.has(room._id)}
                          onChange={() => handleToggleRoomSelection(room._id)}
                          className="w-4 h-4 text-[#6C4DF6] border-slate-300 rounded focus:ring-[#6C4DF6] cursor-pointer"
                        />
                      </div>
                    )}
                    <div className="relative shrink-0">
                      {room.type === "group" ? (
                        <div className="w-10 h-10 rounded-xl bg-[#6C4DF6]/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#6C4DF6]" />
                        </div>
                      ) : (
                        <img
                          src={getAvatar(room, room.name)}
                          alt={room.name}
                          className={`w-10 h-10 rounded-full object-cover ${isBlockedByMe ? "opacity-50 grayscale" : ""}`}
                        />
                      )}
                      {isOnline && room.type === "direct" && !isBlockedByMe && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-[13px] truncate ${
                              room.unreadCount > 0
                                ? "font-bold text-slate-900"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {room.name}
                          </span>
                          {isBlockedByMe && (
                            <span className="bg-slate-100 text-slate-500 text-[10px] rounded-full px-2 py-0.5 shrink-0">
                              🔒 Blocked
                            </span>
                          )}
                        </div>
                        {room.latestMessage && (
                          <span
                            className={`text-[10px] whitespace-nowrap ml-2 ${
                              room.unreadCount > 0
                                ? "font-bold text-[#6C4DF6]"
                                : "text-slate-400"
                            }`}
                          >
                            {formatTime(room.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p
                          className={`text-[12px] truncate pr-2 ${
                            room.unreadCount > 0
                              ? "font-medium text-[#2C2C2A]"
                              : "font-normal text-[#888780]"
                          }`}
                        >
                          {isTyping ? (
                            <span className="text-[#6C4DF6] italic">
                              {isTyping} typing...
                            </span>
                          ) : room.latestMessage ? (
                            room.latestMessage.storyId
                              ? room.latestMessage.text?.startsWith("Reacted")
                                ? room.latestMessage.text
                                : `💬 Story reply: ${room.latestMessage.text}`
                              : room.latestMessage.text
                          ) : (
                            "Start chatting"
                          )}
                        </p>
                        {room.unreadCount > 0 && !isSelected && (
                          <span className="bg-[#6C4DF6] text-white min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeTab === "requests" &&
                followRequests
                  .filter(
                    (n) =>
                      !searchQuery ||
                      n.sender?.name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  )
                  .map((n) => (
                    <div
                      key={n._id}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-purple-50/50 border border-transparent`}
                    >
                      <div
                        className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/profile/${n.sender?._id}`)}
                      >
                        <img
                          src={getAvatar(n.sender, n.sender?.name)}
                          alt={n.sender?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-0.5">
                          <div
                            className="flex items-center gap-1.5 truncate cursor-pointer hover:opacity-80"
                            onClick={() =>
                              navigate(`/profile/${n.sender?._id}`)
                            }
                          >
                            <span className="text-[13px] truncate font-medium text-slate-700 hover:underline">
                              {n.sender?.name}
                            </span>
                            <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                              Follow
                            </span>
                          </div>
                          <span className="text-[10px] whitespace-nowrap ml-2 text-slate-400">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={(e) =>
                                handleAcceptFollow(e, n.sender?._id)
                              }
                              className="flex-1 py-1 bg-[#6C4DF6] text-white text-[11px] font-bold rounded hover:bg-[#5b3ee0] transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) =>
                                handleRejectFollow(e, n.sender?._id)
                              }
                              className="flex-1 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded hover:bg-slate-200 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

              {searchQuery && (
                <>
                  <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    People
                  </div>
                  {isSearchingGlobal ? (
                    <div className="p-3 text-center text-xs text-slate-400 animate-pulse">
                      Searching...
                    </div>
                  ) : globalUsers.filter(
                      (u) =>
                        !filteredRooms.some(
                          (r) =>
                            r.type === "direct" &&
                            r.members?.some((m) => m._id === u._id),
                        ),
                    ).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No new people found
                    </div>
                  ) : (
                    globalUsers
                      .filter(
                        (u) =>
                          !filteredRooms.some(
                            (r) =>
                              r.type === "direct" &&
                              r.members?.some((m) => m._id === u._id),
                          ),
                      )
                      .map((u) => (
                        <button
                          key={u._id}
                          onClick={() => handleSelectGlobalUser(u)}
                          className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex gap-3 hover:bg-purple-50/50 hover:-translate-y-[1px] hover:shadow-sm border border-transparent"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={getAvatar(u, u.name)}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {onlineUsers.has(u._id) && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[13px] truncate font-medium text-slate-700">
                                {u.name}
                              </span>
                            </div>
                            <p className="text-[12px] truncate pr-2 font-normal text-[#888780]">
                              {u.role || u.type || "Traveler"}
                            </p>
                          </div>
                        </button>
                      ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT PANE */}
      <main
        className={`flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden ${
          activeRoom ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-5 bg-white/90 backdrop-blur-md border-b border-slate-100 flex justify-between items-center shrink-0 z-50 sticky top-0 shadow-[0_2px_10px_-5px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveRoom(null)}
                  className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg transition-colors lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  {activeRoom.type === "group" ? (
                    <div className="w-9 h-9 rounded-xl bg-[#6C4DF6]/10 flex items-center justify-center">
                      <Users className="w-4.5 h-4.5 text-[#6C4DF6]" />
                    </div>
                  ) : (
                    <img
                      src={getAvatar(activeRoom, activeRoom.name)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  )}
                  {activeRoom.type === "direct" &&
                    onlineUsers.has(
                      activeRoom.members?.find((m) => m._id !== user?._id)?._id,
                    ) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
                    {activeRoom.name}
                    {activeRoom.type === "group" && (
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                        Group
                      </span>
                    )}
                  </h3>
                  <div
                    className={`text-[11px] font-medium mt-0.5 ${
                      activeRoom.type === "group"
                        ? "text-slate-400"
                        : onlineUsers.has(
                              activeRoom.members?.find(
                                (m) => m._id !== user?._id,
                              )?._id,
                            )
                          ? "text-emerald-500"
                          : "text-slate-400"
                    }`}
                  >
                    {activeRoom.type === "direct" &&
                    user?.blockedUsers?.includes(
                      activeRoom.members?.find((m) => m._id !== user?._id)?._id,
                    ) ? (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[11px] inline-block">
                        🔒 Blocked
                      </span>
                    ) : activeRoom.type === "group" ? (
                      `${activeRoom.members?.length || 0} members`
                    ) : onlineUsers.has(
                        activeRoom.members?.find((m) => m._id !== user?._id)
                          ?._id,
                      ) ? (
                      "Online"
                    ) : (
                      "Offline"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeRoom.travelGroupId && (
                  <Link
                    to={`/social/buddy/${activeRoom.travelGroupId._id || activeRoom.travelGroupId}`}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[12px] font-semibold transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" /> Trip
                  </Link>
                )}
                <button
                  aria-label="Start voice call"
                  className="p-2 text-slate-400 hover:text-[#6C4DF6] hover:bg-slate-50 rounded-lg transition-all hidden sm:flex"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  aria-label="Start video call"
                  className="p-2 text-slate-400 hover:text-[#6C4DF6] hover:bg-slate-50 rounded-lg transition-all hidden sm:flex"
                >
                  <Video className="w-4 h-4" />
                </button>
                <div ref={headerOptionsRef}>
                  <button
                    onClick={() => setShowHeaderOptions(!showHeaderOptions)}
                    aria-label="More options"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showHeaderOptions && (
                    <div className="absolute right-4 top-14 z-[9999] w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-100 overflow-hidden py-1 flex flex-col">
                      {activeRoom.type === "direct" &&
                        (() => {
                          const otherUser = activeRoom.members?.find(
                            (m) => m._id !== user?._id,
                          );
                          const isBlocked =
                            otherUser &&
                            user?.blockedUsers?.includes(otherUser._id);
                          return (
                            <>
                              <button
                                onClick={handleReportUser}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
                              >
                                Report User
                              </button>
                              <button
                                onClick={handleBlockUser}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
                              >
                                {isBlocked ? "Unblock User" : "Block User"}
                              </button>
                              <div className="border-t border-slate-100"></div>
                            </>
                          );
                        })()}
                      <button
                        onClick={handleClearChat}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-purple-50 transition-colors"
                      >
                        Clear Chat
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(activeRoom, e)}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto cs px-5 sm:px-8 py-6 space-y-3 bg-gradient-to-b from-white to-purple-50/30 relative"
              aria-live="polite"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                  <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 shadow-sm border border-purple-100/50">
                    <MessageSquare className="w-8 h-8 text-purple-400" />
                  </div>
                  {activeRoom.type === "direct" &&
                  activeRoom.requestStatus === "pending" &&
                  activeRoom.requestedBy !== user?._id ? (
                    <>
                      <h4 className="text-sm font-bold text-slate-600">
                        Message Request
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Accept the request below to reply.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-base font-bold text-slate-700">
                        Start your travel conversation ✈️
                      </h4>
                      <p className="text-[13px] text-slate-400 mt-1.5 max-w-[250px] leading-relaxed">
                        Say hello and start planning your next great adventure!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isSelf =
                    msg.sender === user?._id || msg.sender?._id === user?._id;
                  const showDate =
                    index === 0 ||
                    new Date(msg.createdAt).toDateString() !==
                      new Date(messages[index - 1].createdAt).toDateString();
                  const showAvatar =
                    !isSelf &&
                    (index === 0 ||
                      messages[index - 1].sender !== msg.sender ||
                      showDate);

                  // Instagram-style: hide duplicate story preview for consecutive
                  // messages referencing the same story (show it only on the first one)
                  const currentStoryRef = msg.storyId
                    ? typeof msg.storyId === "object"
                      ? msg.storyId._id
                      : msg.storyId
                    : null;
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const prevStoryRef = prevMsg?.storyId
                    ? typeof prevMsg.storyId === "object"
                      ? prevMsg.storyId._id
                      : prevMsg.storyId
                    : null;
                  const hideStoryPreview =
                    !!currentStoryRef &&
                    !!prevStoryRef &&
                    currentStoryRef?.toString() === prevStoryRef?.toString() &&
                    !showDate;

                  return (
                    <div key={msg._id || index}>
                      {showDate && (
                        <div className="flex items-center justify-center my-3">
                          <span className="bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1 rounded-full text-[12px] font-medium">
                            {formatDateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <ChatBubble
                        msg={msg}
                        isSelf={isSelf}
                        showAvatar={showAvatar}
                        senderPic={getAvatar(msg.senderPic, msg.senderName)}
                        senderName={msg.senderName}
                        currentUserName={user?.name}
                        activeRoomType={activeRoom.type}
                        onDelete={handleDeleteForMe}
                        onUnsend={handleUnsend}
                        onReply={setReplyToMsg}
                        onReaction={handleReaction}
                        onStoryClick={handleOpenStory}
                        formatTime={formatTime}
                        activeMessageOptions={activeMessageOptions}
                        setActiveMessageOptions={setActiveMessageOptions}
                        hideStoryPreview={hideStoryPreview}
                      />
                    </div>
                  );
                })
              )}

              {typingUsers[activeRoom._id] && (
                <div className="flex items-end gap-2 justify-start">
                  {activeRoom.type === "group" && (
                    <div className="w-7 shrink-0" />
                  )}
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input / Request Area */}
            {activeRoom.type === "direct" &&
            activeRoom.requestStatus === "pending" ? (
              activeRoom.requestedBy === user?._id ||
              activeRoom.requestedBy?.toString() === user?._id?.toString() ? (
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
                  (m) => m._id !== user?._id,
                );
                const isBlockedByMe =
                  otherUser && user?.blockedUsers?.includes(otherUser._id);
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
                    className="absolute -top-12 right-6 p-2 bg-[#7F77DD] text-white rounded-full shadow-lg hover:bg-[#6b62d6] transition-all z-20"
                  >
                    <ChevronDown className="w-5 h-5" />
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
                  (m) => m._id !== user?._id,
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
        myUserId={user?._id}
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