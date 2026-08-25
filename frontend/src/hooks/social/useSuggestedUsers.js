import { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { resolveRelationship } from "../../utils/relationshipResolver";

export const useSuggestedUsers = () => {
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  const handleFollowToggle = async (targetUser, currentUser, callback, tripMateStatus = "not_connected") => {
    const targetId = String(targetUser._id || targetUser.id || "");
    if (!targetId || followLoadingMap[targetId]) return;

    const rel = resolveRelationship(currentUser, targetUser, tripMateStatus);
    if (rel.isSelf || rel.socialState === "self") {
      return;
    }
    setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    try {
      const isCurrentlyFollowing = rel.socialState === "following" || rel.socialState === "mutual" || Boolean(targetUser.isFollowing);
      const isCurrentlyRequested = rel.socialState === "requested" || Boolean(targetUser.isRequested);

      const endpoint = isCurrentlyFollowing
        ? `/users/${targetId}/unfollow`
        : isCurrentlyRequested
        ? `/users/follow-requests/${targetId}`
        : `/users/${targetId}/follow`;

      const method = isCurrentlyRequested ? 'delete' : 'post';
      const res = await axios[method](endpoint, {}, { withCredentials: true });
      
      if (res.data?.success) {
        showToast.success(res.data.message || (isCurrentlyFollowing ? "Unfollowed" : "Following"));
      }
      
      if (callback) callback();
    } catch (err) {
      const errMsg = err.response?.data?.message || "";
      if (errMsg.includes("already follow") || errMsg.includes("already following")) {
        showToast.success(`Following ${targetUser.name || "traveler"}`);
        if (callback) callback();
      } else if (errMsg.includes("already sent")) {
        showToast.success("Follow request pending");
        if (callback) callback();
      } else {
        showToast.error(errMsg || "Failed to update relationship");
      }
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  return {
    followLoadingMap,
    handleFollowToggle
  };
};
export default useSuggestedUsers;