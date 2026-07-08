import { SOCKET_EVENTS } from "../constants/socketEvents";

export const handleSocketEvent = (dispatch, eventType, payload, currentUserId) => {
  
  switch (eventType) {
    case SOCKET_EVENTS.RECEIVE_CHAT_MESSAGE:
      dispatch({
        type: "RECEIVE_MESSAGE",
        payload: { message: payload, currentUserId }
      });
      break;

    case SOCKET_EVENTS.MESSAGE_SENT:
      dispatch({
        type: "MESSAGE_SENT_ACK",
        payload: {
          roomId: payload.roomId,
          messageId: payload.messageId,
          clientMsgId: payload.clientMsgId,
          message: payload.message
        }
      });
      break;

    case SOCKET_EVENTS.MESSAGE_DELIVERED:
    case SOCKET_EVENTS.MESSAGE_DELIVERED_UPDATE:
      dispatch({
        type: "MESSAGE_DELIVERED",
        payload: {
          roomId: payload.roomId,
          messageId: payload.messageId,
          userId: payload.userId
        }
      });
      break;

    case SOCKET_EVENTS.MESSAGES_SEEN:
      dispatch({
        type: "MESSAGES_SEEN",
        payload: {
          roomId: payload.roomId,
          userId: payload.userId
        }
      });
      break;

    case SOCKET_EVENTS.MESSAGES_READ: {
      const targetUserId = payload.userId || payload.readByUserId;
      if (targetUserId) {
        dispatch({
          type: "MESSAGES_SEEN",
          payload: {
            roomId: payload.roomId,
            userId: targetUserId
          }
        });
      }
      break;
    }

    case SOCKET_EVENTS.STORY_REACTION_MESSAGE_UPDATED:
      dispatch({
        type: "STORY_REACTION_UPDATED",
        payload: payload
      });
      break;

    case SOCKET_EVENTS.MESSAGE_UNSENT:
      dispatch({
        type: "MESSAGE_UNSENT",
        payload: {
          roomId: payload.roomId,
          messageId: payload.messageId
        }
      });
      break;

    case SOCKET_EVENTS.IS_TYPING:
      dispatch({
        type: "SET_TYPING",
        payload: {
          roomId: payload.roomId,
          userName: payload.userName
        }
      });
      break;

    case SOCKET_EVENTS.NOT_TYPING:
      dispatch({
        type: "CLEAR_TYPING",
        payload: payload.roomId
      });
      break;

    case SOCKET_EVENTS.REQUEST_STATUS_UPDATED:
      dispatch({
        type: "REQUEST_STATUS_UPDATED",
        payload: {
          roomId: payload.roomId,
          requestStatus: payload.requestStatus,
          room: payload.room
        }
      });
      break;

    case SOCKET_EVENTS.INITIAL_ONLINE_USERS:
      dispatch({
        type: "SET_ONLINE_USERS",
        payload: payload
      });
      break;

    case SOCKET_EVENTS.USER_PRESENCE:
      dispatch({
        type: "UPDATE_USER_PRESENCE",
        payload: {
          userId: payload.userId,
          status: payload.status
        }
      });
      break;

    default:
      console.warn(`[SOCKET DISPATCHER] unhandled event type: ${eventType}`);
  }
};
export default handleSocketEvent;
