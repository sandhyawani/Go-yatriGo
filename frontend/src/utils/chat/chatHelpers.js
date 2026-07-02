import { getAvatarUrl } from "../avatar"; // we saw getAvatarUrl is imported from "../../utils/avatar" in ChatRoom.jsx. So here it is "../avatar"

export const getRoomIdString = (roomField) => {
  if (!roomField) return "";
  if (typeof roomField === "object") {
    return (roomField._id || roomField.id || roomField).toString();
  }
  return roomField.toString();
};

export const getMediaTypeLabel = (mediaUrl) => {
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

export const getLatestMessagePreview = (msg, currentUserId) => {
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

export const mergeMessagesById = (prevMessages, incomingMessages) => {
  const incomingIds = new Set(incomingMessages.map((m) => m._id));
  const stillPending = prevMessages.filter(
    (m) => m.isPending && !incomingIds.has(m._id),
  );
  const merged = [...incomingMessages, ...stillPending];
  merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return merged;
};

export const mergeRoomsById = (prevRooms, incomingRooms) => {
  const incomingIds = new Set(incomingRooms.map((r) => r._id));
  const localOnly = prevRooms.filter((r) => !incomingIds.has(r._id));
  return [...incomingRooms, ...localOnly];
};

export const formatTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export const formatDateLabel = (d) => {
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

export const getAvatar = (objOrPic, name) => getAvatarUrl(objOrPic, null, name);
