export const SOCKET_EVENTS = {
  // Lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Chat — incoming
  RECEIVE_CHAT_MESSAGE: "receive_chat_message",
  MESSAGE_SENT: "message_sent",
  MESSAGE_DELIVERED: "message_delivered",
  MESSAGE_DELIVERED_UPDATE: "message_delivered_update",
  MESSAGES_SEEN: "messages_seen",
  MESSAGES_READ: "messages_read",
  IS_TYPING: "is_typing",
  NOT_TYPING: "not_typing",
  MESSAGE_UNSENT: "message:unsent",
  STORY_REACTION_MESSAGE_UPDATED: "story_reaction_message_updated",
  REQUEST_STATUS_UPDATED: "request_status_updated",

  // Presence — incoming
  USER_PRESENCE: "user_presence",
  INITIAL_ONLINE_USERS: "initial_online_users",

  // Notifications — incoming
  NEW_NOTIFICATION: "new_notification",

  // Social/Follow — incoming
  FOLLOWERS_UPDATED: "followers_updated",
  FOLLOWING_UPDATED: "following_updated",
  FOLLOW_REQUEST_RECEIVED: "follow_request_received",
  FOLLOW_REQUEST_ACCEPTED: "follow_request_accepted",
  FOLLOW_REQUEST_REJECTED: "follow_request_rejected",

  // Story — incoming
  STORY_VIEWER_UPDATE: "story_viewer_update",
  STORY_REACTION_UPDATE: "story_reaction_update",

  // Emitted events (client → server)
  EMIT_GO_ONLINE: "go_online",
  EMIT_JOIN_CHAT_ROOM: "join_chat_room",
  EMIT_LEAVE_CHAT_ROOM: "leave_chat_room",
  EMIT_MARK_MESSAGES_READ: "mark_messages_read",
  EMIT_MESSAGE_DELIVERED: "message_delivered",
  EMIT_TYPING: "typing",
  EMIT_STOP_TYPING: "stop_typing",
};

