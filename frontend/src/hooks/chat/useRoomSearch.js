import { useState, useEffect } from "react";
import { chatService } from "../../services/chatService";

export const useRoomSearch = ({
  rooms,
  notifications,
  activeTab,
  currentUserId,
  isMyRequest
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Debounced global user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setGlobalUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingGlobal(true);
        const res = await chatService.searchUsersGlobal(searchQuery);
        if (res.success) {
          setGlobalUsers(res.users || []);
        }
      } catch (err) {
        console.error("Error searching global users", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived lists
  const activeChats = rooms.filter(
    (r) =>
      r.type === "direct" &&
      (r.requestStatus === "accepted" || (r.requestStatus === "pending" && isMyRequest(r)))
  );
  const requestChats = rooms.filter(
    (r) => r.type === "direct" && r.requestStatus === "pending" && !isMyRequest(r)
  );
  const groupChats = rooms.filter((r) => r.type === "group" || r.travelGroupId);

  const displayedRooms =
    activeTab === "chats"
      ? activeChats
      : activeTab === "requests"
      ? requestChats
      : groupChats;

  const filteredRooms = displayedRooms.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const followRequests = notifications.filter(
    (n) => n.type === "follow_request"
  );

  return {
    searchQuery,
    setSearchQuery,
    globalUsers,
    setGlobalUsers,
    isSearchingGlobal,
    filteredRooms,
    followRequests,
    requestChats
  };
};
export default useRoomSearch;

