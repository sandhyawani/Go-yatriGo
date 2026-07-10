import { useContext, useState } from "react";
import { ChatContext } from "../../context/chat/ChatContext";
import { chatService } from "../../services/chatService";
import { notificationService } from "../../services/notificationService";
import { showToast } from "../../utils/showToast";
import Swal from "sweetalert2";
import { toast } from "sonner";
import useRoomSearch from "./useRoomSearch";

export const useChatRooms = (currentUserId, locationState, roomIdFromParams) => {
  const { state, dispatch } = useContext(ChatContext);
  const { rooms, activeRoom, loading } = state;

  const [activeTab, setActiveTab] = useState("chats");
  const [isDeleteSelectionMode, setIsDeleteSelectionMode] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState(new Set());
  const [showListMoreOptions, setShowListMoreOptions] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Helper to check if a pending room request was initiated by me
  const isMyRequest = (r) => {
    if (!r || !r.requestedBy) return false;
    const reqId = typeof r.requestedBy === "object" ? r.requestedBy._id : r.requestedBy;
    return reqId?.toString() === currentUserId?.toString();
  };

  const {
    searchQuery,
    setSearchQuery,
    globalUsers,
    setGlobalUsers,
    isSearchingGlobal,
    filteredRooms,
    followRequests,
    requestChats
  } = useRoomSearch({
    rooms,
    notifications,
    activeTab,
    currentUserId,
    isMyRequest
  });

  const fetchRooms = async (targetUserId, targetGroupId) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      let roomRes;

      if (targetUserId) {
        roomRes = await chatService.getDirectRoom(targetUserId);
        window.history.replaceState({}, document.title);
      }

      const res = await chatService.getRooms();
      const notifRes = await notificationService.getNotifications();

      if (res.success) {
        dispatch({ type: "SET_ROOMS", payload: res.rooms || [] });

        if (targetUserId && roomRes?.room) {
          const matched = res.rooms.find((r) => r._id === roomRes.room._id);
          if (matched) selectRoom(matched);
        } else if (targetGroupId) {
          window.history.replaceState({}, document.title);
          const matched = res.rooms.find((r) => {
            const rGroupId = typeof r.travelGroupId === "object" ? r.travelGroupId?._id : r.travelGroupId;
            const rGroupIdStr = rGroupId ? rGroupId.toString() : "";
            const roomIdStr = r._id ? r._id.toString() : "";
            const targetGroupIdStr = targetGroupId ? targetGroupId.toString() : "";
            return rGroupIdStr === targetGroupIdStr || roomIdStr === targetGroupIdStr;
          });
          if (matched) selectRoom(matched);
        }
      }

      if (notifRes.success) {
        setNotifications(notifRes.notifications || []);
      }
    } catch (err) {
      showToast.error("Failed to load chat channels");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const selectRoom = (room) => {
    dispatch({ type: "SET_ACTIVE_ROOM", payload: room });
    if (room.type === "direct") {
      setActiveTab(
        room.requestStatus === "pending" && !isMyRequest(room)
          ? "requests"
          : "chats"
      );
    } else {
      setActiveTab("groups");
    }
  };

  const handleSelectGlobalUser = async (targetUser) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await chatService.getDirectRoom(targetUser._id);
      if (res.success) {
        const newRoom = res.room;
        dispatch({ type: "ADD_OR_UPDATE_ROOM", payload: newRoom });
        setSearchQuery("");
        setGlobalUsers([]);
        selectRoom(newRoom);
      }
    } catch (err) {
      showToast.error("Failed to start conversation");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleRequestAction = async (action) => {
    if (!activeRoom) return;
    try {
      toast.loading(`Processing...`, { id: "req" });
      const res = await chatService.handleRequestAction(activeRoom._id, action);
      if (res.success) {
        showToast.success(`Request ${action}ed!`, { id: "req" });
        dispatch({
          type: "REQUEST_STATUS_UPDATED",
          payload: { roomId: activeRoom._id, requestStatus: res.room.requestStatus, room: res.room }
        });
        if (action === "accept") {
          setActiveTab("chats");
        } else {
          dispatch({ type: "SET_ACTIVE_ROOM", payload: null });
        }
      }
    } catch (err) {
      showToast.error(`Error: ${err.message}`, { id: "req" });
    }
  };

  const handleDeleteChat = async (roomToDelete = activeRoom, e) => {
    if (e) e.stopPropagation();
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
      toast.loading("Deleting chat...", { id: "delete-chat" });
      const res = await chatService.deleteChat(roomToDelete._id);
      if (res.success) {
        dispatch({ type: "REMOVE_ROOM", payload: roomToDelete._id });
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
        chatService.deleteChat(roomId)
      );

      await Promise.all(deletePromises);

      Array.from(selectedRoomIds).forEach((id) => {
        dispatch({ type: "REMOVE_ROOM", payload: id });
      });

      setIsDeleteSelectionMode(false);
      setSelectedRoomIds(new Set());
      showToast.success("Selected chats deleted", { id: "delete-selected-chats" });
    } catch (err) {
      showToast.error("Failed to delete some chats", { id: "delete-selected-chats" });
    }
  };

  const handleAcceptFollow = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await notificationService.acceptFollowRequest(requesterId);
      setNotifications((prev) =>
        prev.filter((n) => !(n.type === "follow_request" && n.sender._id === requesterId))
      );
      showToast.success("Follow request accepted");
    } catch (err) {
      showToast.error("Failed to accept request");
    }
  };

  const handleRejectFollow = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await notificationService.rejectFollowRequest(requesterId);
      setNotifications((prev) =>
        prev.filter((n) => !(n.type === "follow_request" && n.sender._id === requesterId))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return {
    rooms,
    activeRoom,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    globalUsers,
    isSearchingGlobal,
    isDeleteSelectionMode,
    setIsDeleteSelectionMode,
    selectedRoomIds,
    setSelectedRoomIds,
    showListMoreOptions,
    setShowListMoreOptions,
    notifications,
    setNotifications,
    fetchRooms,
    selectRoom,
    handleSelectGlobalUser,
    handleRequestAction,
    handleDeleteChat,
    handleToggleRoomSelection,
    handleDeleteSelectedChats,
    handleAcceptFollow,
    handleRejectFollow,
    isMyRequest,
    filteredRooms,
    requestChats,
    followRequests
  };
};
export default useChatRooms;

