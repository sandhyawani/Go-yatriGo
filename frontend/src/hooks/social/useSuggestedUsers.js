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
        showToast.success(`Unfollowed ${targetUser.name}`);
      } else {
        await axios.post(`/users/${targetUser._id}/follow`, {}, { withCredentials: true });
        showToast.success(`Followed ${targetUser.name}`);
      }
      if (callback) callback();
    } catch (err) {
      showToast.error("Failed to update follow status");
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
