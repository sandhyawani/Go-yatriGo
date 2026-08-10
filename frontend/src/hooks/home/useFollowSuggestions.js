import { useState, useCallback } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";

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
    setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));

    try {
      const myId = (user?._id || user?.id)?.toString();
      const isFollowing = targetUser.followers?.some(
        (id) => id?.toString() === myId
      );
      const isRequested = targetUser.followRequests?.some(
        (id) => id?.toString() === myId
      );
      const endpoint =
        isFollowing || isRequested
          ? `/users/${targetId}/unfollow`
          : `/users/${targetId}/follow`;

      const res = await homeService.followUser(targetId); // Wait, followToggle / followUser is the same
      if (res.data.success || res.status === 200) {
        showToast.success(res.data.message || "Status updated!");
        setSuggestions((prev) =>
          prev.map((s) => {
            if (s._id !== targetId) return s;
            const followers = [...(s.followers || [])];
            if (isFollowing) {
              return {
                ...s,
                followers: followers.filter((id) => id?.toString() !== myId),
              };
            } else {
              if (s.privateAccount) {
                const requests = [...(s.followRequests || [])];
                if (!requests.includes(myId)) requests.push(myId);
                return { ...s, followRequests: requests };
              } else {
                if (!followers.includes(myId)) followers.push(myId);
                return { ...s, followers };
              }
            }
          })
        );
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
