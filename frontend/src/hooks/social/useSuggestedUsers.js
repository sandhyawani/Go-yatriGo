import { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";

export const useSuggestedUsers = () => {
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  const handleFollowToggle = async (targetUser, currentUserId, callback) => {
    const isFollowing = targetUser.followers?.includes(currentUserId);
    setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: true }));
    try {
      if (isFollowing) {
        await axios.post(`/users/${targetUser._id}/unfollow`, {}, { withCredentials: true });
        showToast.success(`Removed ${targetUser.name} from My Journey Mates`);
      } else {
        await axios.post(`/users/${targetUser._id}/follow`, {}, { withCredentials: true });
        showToast.success(`Added ${targetUser.name} as Journey Mate`);
      }
      if (callback) callback();
    } catch (err) {
      showToast.error("Failed to update Journey Mate status");
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  };

  return {
    followLoadingMap,
    handleFollowToggle
  };
};
export default useSuggestedUsers;

