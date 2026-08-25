import { useState, useCallback } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";
import { resolveRelationship } from "../../utils/relationshipResolver";
import axios from "../../api/axios";

export const useFollowSuggestions = (user) => {
  const [suggestions, setSuggestions] = useState([]);
  const [nearbyTrips, setNearbyTrips] = useState([]);
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  const fetchSideData = useCallback(async () => {
    try {
      const [suggestionsRes, buddyRes] = await Promise.all([
        homeService.fetchSuggestions(),
        homeService.fetchTrips(),
      ]);

      if (suggestionsRes.data.success) {
        setSuggestions(suggestionsRes.data.users || []);
      }
      if (buddyRes.data.success) {
        setNearbyTrips(buddyRes.data.trips || []);
      }
    } catch (err) {
      console.error("fetchSideData error:", err);
    }
  }, []);

  const handleFollowToggle = useCallback(async (targetUser) => {
    const targetId = targetUser._id;
    if (followLoadingMap[targetId]) return;

    const rel = resolveRelationship(user, targetUser, "not_connected");
    if (rel.isSelf || rel.socialState === "self") {
      return;
    }

    setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    const myId = (user?._id || user?.id)?.toString();

    try {
      if (rel.socialState === "following" || rel.socialState === "mutual") {
        const res = await homeService.unfollowUser(targetId);
        if (res.data.success || res.status === 200) {
          showToast.success(res.data.message || "Unfollowed successfully");
          setSuggestions((prev) =>
            prev.map((s) => {
              if (s._id !== targetId) return s;
              const followers = [...(s.followers || [])];
              return {
                ...s,
                followers: followers.filter((id) => String(id?._id || id) !== myId),
              };
            })
          );
        }
      } else if (rel.socialState === "requested") {
        const res = await axios.delete(`/users/follow-requests/${targetId}`, { withCredentials: true });
        if (res.data.success || res.status === 200) {
          showToast.success(res.data.message || "Follow request cancelled");
          setSuggestions((prev) =>
            prev.map((s) => {
              if (s._id !== targetId) return s;
              const followRequests = [...(s.followRequests || [])];
              return {
                ...s,
                followRequests: followRequests.filter((id) => String(id?._id || id) !== myId),
              };
            })
          );
        }
      } else {
        const res = await homeService.followUser(targetId);
        if (res.data.success || res.status === 200) {
          showToast.success(res.data.message || "Status updated!");
          setSuggestions((prev) =>
            prev.map((s) => {
              if (s._id !== targetId) return s;
              if (res.data.status === "requested" || s.privateAccount) {
                const requests = [...(s.followRequests || [])];
                if (!requests.some(id => String(id?._id || id) === myId)) requests.push(myId);
                return { ...s, followRequests: requests };
              } else {
                const followers = [...(s.followers || [])];
                if (!followers.some(id => String(id?._id || id) === myId)) followers.push(myId);
                return { ...s, followers };
              }
            })
          );
        }
      }
    } catch (err) {
      showToast.error("Failed to update follow status");
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  }, [user, followLoadingMap]);

  return {
    suggestions,
    setSuggestions,
    nearbyTrips,
    setNearbyTrips,
    followLoadingMap,
    setFollowLoadingMap,
    fetchSideData,
    handleFollowToggle,
  };
};

export default useFollowSuggestions;
