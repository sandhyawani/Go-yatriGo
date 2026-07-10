import { getRoomIdString, mergeRoomsById } from "../../utils/chat/chatHelpers";

export const roomsReducer = (state, action) => {
  switch (action.type) {
    case "SET_ROOMS": {
      const mergedRooms = mergeRoomsById(state.rooms, action.payload);
      return {
        ...state,
        rooms: mergedRooms
      };
    }

    case "SET_ACTIVE_ROOM": {
      const room = action.payload;
      const roomIdStr = getRoomIdString(room?._id);

      const updatedRooms = state.rooms.map((r) => {
        if (getRoomIdString(r._id) === roomIdStr) {
          return { ...r, unreadCount: 0 };
        }
        return r;
      });

      return {
        ...state,
        activeRoom: room,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: false,
        rooms: updatedRooms
      };
    }

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload
      };

    case "REQUEST_STATUS_UPDATED": {
      const { roomId, requestStatus, room } = action.payload;
      const updatedRooms = state.rooms.map((r) =>
        r._id === roomId ? { ...r, ...room, requestStatus } : r
      );
      const updatedActiveRoom =
        state.activeRoom?._id === roomId
          ? { ...state.activeRoom, ...room, requestStatus }
          : state.activeRoom;

      return {
        ...state,
        rooms: updatedRooms,
        activeRoom: updatedActiveRoom
      };
    }

    case "ADD_OR_UPDATE_ROOM": {
      const room = action.payload;
      const existingRoom = state.rooms.find((r) => r._id === room._id);
      let updatedRooms;
      if (!existingRoom) {
        updatedRooms = [room, ...state.rooms];
      } else {
        updatedRooms = state.rooms.map((r) => (r._id === room._id ? { ...r, ...room } : r));
      }

      return {
        ...state,
        rooms: updatedRooms
      };
    }

    case "REMOVE_ROOM": {
      const roomId = action.payload;
      const isDeletedActive = state.activeRoom?._id === roomId;
      return {
        ...state,
        rooms: state.rooms.filter((r) => r._id !== roomId),
        activeRoom: isDeletedActive ? null : state.activeRoom,
        messages: isDeletedActive ? [] : state.messages
      };
    }

    default:
      return state;
  }
};
export default roomsReducer;

