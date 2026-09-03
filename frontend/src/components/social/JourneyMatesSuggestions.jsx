import React, { useCallback, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Users } from "lucide-react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/authContext";
import { useSuggestedUsers } from "../../hooks/social/useSuggestedUsers";
import TravelerSuggestionCard from "../home/cards/TravelerSuggestionCard";
import Card from "../common/Card";
import { resolveRelationship } from "../../utils/relationshipResolver";
import { useTripMates } from "../../hooks/useTripMates";

const JourneyMatesSuggestions = ({
  currentUser: currentUserProp,
  currentUserId: currentUserIdProp,
  groupId = null,
  trip = null,
  initialSuggestions = null,
  handleFollowToggle: handleFollowToggleProp,
  followLoadingMap: followLoadingMapProp,
  tripMateStates: tripMateStatesProp,
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const currentUser = currentUserProp || authUser || (currentUserIdProp ? { _id: currentUserIdProp } : null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fallbackHook = useSuggestedUsers();
  const followLoadingMap = followLoadingMapProp || fallbackHook.followLoadingMap;
  const handleFollowToggle = handleFollowToggleProp || fallbackHook.handleFollowToggle;

  const currentUserId = currentUser?._id || currentUser?.id || currentUserIdProp;
  const userCity = currentUser?.city || authUser?.city || "";

  const { connectionStates } = useTripMates(currentUserId);
  const effectiveTripMateStates = tripMateStatesProp || connectionStates || {};

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);

    try {
      let url = "/users/suggestions";
      const params = [];

      if (groupId) {
        params.push(`groupId=${groupId}`);
      }

      if (trip) {
        if (trip.destination) {
          params.push(
            `destination=${encodeURIComponent(trip.destination)}`
          );
        }

        if (trip.startDate) {
          params.push(
            `startDate=${encodeURIComponent(trip.startDate)}`
          );
        }

        if (trip.endDate) {
          params.push(
            `endDate=${encodeURIComponent(trip.endDate)}`
          );
        }

        if (trip.from) {
          params.push(`from=${encodeURIComponent(trip.from)}`);
        }
      }

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axios.get(url, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to fetch traveler suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, trip]);

  useEffect(() => {
    if (initialSuggestions && initialSuggestions.length > 0) {
      setSuggestions(initialSuggestions);
    } else {
      fetchSuggestions();
    }
  }, [initialSuggestions, fetchSuggestions]);

  const uniqueMap = new Map();

  suggestions.forEach((suggestion) => {
    const id = String(suggestion?._id || suggestion?.id || "");

    if (id && id !== String(currentUserId)) {
      uniqueMap.set(id, suggestion);
    }
  });

  const localMates = Array.from(uniqueMap.values());

  const discoveryCandidates = localMates.filter((traveler) => {
    const travelerId = String(traveler._id || traveler.id);
    const tripMateStatus =
      effectiveTripMateStates[travelerId] || "not_connected";
    return tripMateStatus !== "connected" && !traveler.isTripMate;
  });

  const displayTravelers = discoveryCandidates.slice(0, 30);

  if (loading && suggestions.length === 0) {
    return (
      <div className="h-[276px] flex justify-center items-center bg-surface rounded-2xl border border-border shadow-xs">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (discoveryCandidates.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xs">
              <Compass className="w-3.5 h-3.5 text-white shrink-0" />
            </div>
            <h3 className="text-[13px] font-bold text-text-primary leading-tight">
              Travelers For You
            </h3>
          </div>
        </div>
        <div className="h-[224px] flex flex-col items-center justify-center py-4 text-center space-y-2 px-4">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center mx-auto text-text-muted">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary">No travelers to discover right now</p>
            <p className="text-[11px] text-text-muted mt-0.5">Explore travelers around the world</p>
          </div>
          <button
            onClick={() => navigate("/social/explore")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200"
          >
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            Explore travelers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
      {/* Header — clean, matching reference */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xs">
            <Compass className="w-3.5 h-3.5 text-white shrink-0" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-text-primary leading-tight">
              Travelers For You
            </h3>
            {userCity && (
              <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Near {userCity}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate("/social/explore")}
          className="text-[12px] font-bold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* Traveler rows with internal scrolling for ~3 visible items */}
      <div className="px-5 py-2 h-[252px] overflow-y-auto overscroll-contain scrollbar-thin space-y-1.5">
        {displayTravelers.map((traveler) => {
          const travelerId = String(traveler._id || traveler.id);

          const tripMateStatus =
            effectiveTripMateStates[travelerId] || "not_connected";

          const relationship = resolveRelationship(
            currentUser,
            traveler,
            tripMateStatus
          );

          return (
            <TravelerSuggestionCard
              key={travelerId}
              user={traveler}
              currentUserId={currentUserId}
              relationship={relationship}
              followLoading={followLoadingMap[travelerId]}
              onFollowToggle={() =>
                handleFollowToggle(
                  traveler,
                  currentUser,
                  fetchSuggestions,
                  tripMateStatus
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default JourneyMatesSuggestions;