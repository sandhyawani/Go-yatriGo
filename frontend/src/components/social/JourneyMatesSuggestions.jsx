import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import axios from "../../api/axios";
import { useSuggestedUsers } from "../../hooks/social/useSuggestedUsers";
import TravelerSuggestionCard from "../home/cards/TravelerSuggestionCard";
import Card from "../common/Card";

const JourneyMatesSuggestions = ({
  currentUserId,
  groupId = null,
  trip = null,
  initialSuggestions = null
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { followLoadingMap, handleFollowToggle } = useSuggestedUsers();

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      let url = "/users/suggestions";
      const params = [];
      if (groupId) params.push(`groupId=${groupId}`);
      if (trip) {
        if (trip.destination) params.push(`destination=${encodeURIComponent(trip.destination)}`);
        if (trip.startDate) params.push(`startDate=${encodeURIComponent(trip.startDate)}`);
        if (trip.endDate) params.push(`endDate=${encodeURIComponent(trip.endDate)}`);
        if (trip.from) params.push(`from=${encodeURIComponent(trip.from)}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      const response = await axios.get(url, { withCredentials: true });
      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to fetch traveler suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSuggestions) {
      setSuggestions(initialSuggestions);
    } else {
      fetchSuggestions();
    }
  }, [initialSuggestions, groupId, trip]);

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>);

  }

  if (suggestions.length === 0) {
    return null;
  }

  const localMates = suggestions.filter((s) => s.isSameCity);
  const localTitle = "Travelers in your city";

  return (
    <Card variant="default" padding="md" className="space-y-4">
      {localMates.length > 0 ?
      <>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
              {localTitle}
            </h3>
          </div>
          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-2 pb-2">
            {localMates.map((s) =>
          <TravelerSuggestionCard
          key={s._id}
          user={s}
          currentUserId={currentUserId}
          isFollowing={s.followers?.some((id) => id?.toString() === currentUserId)}
          isRequested={s.followRequests?.some((id) => id?.toString() === currentUserId)}
          followLoading={followLoadingMap[s._id]}
          onFollowToggle={() => handleFollowToggle(s, currentUserId, fetchSuggestions)} />

          )}
          </div>
        </> :

      <Card variant="outlined" padding="lg" className="text-center bg-[#FCFBF7]">
          <MapPin className="w-6 h-6 text-[#7C3AED]/40 mx-auto mb-2" />
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">No travelers from your city yet.</p>
        </Card>}

    </Card>);

};

export default JourneyMatesSuggestions;