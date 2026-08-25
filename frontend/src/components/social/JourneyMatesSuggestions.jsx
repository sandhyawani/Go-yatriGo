import React, { useCallback, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Users, RotateCw } from "lucide-react";
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
  const [pageIndex, setPageIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

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

  const pageSize = 3;
  const maxPages = Math.max(1, Math.ceil(discoveryCandidates.length / pageSize));
  const currentSafePage = pageIndex % maxPages;
  const startIdx = currentSafePage * pageSize;
  const displayTravelers = discoveryCandidates.slice(startIdx, startIdx + pageSize);

  const handleShuffle = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);
    setPageIndex((prev) => (prev + 1) % maxPages);
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex justify-center items-center py-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (discoveryCandidates.length === 0) {
    return (
      <Card variant="default" padding="sm" className="space-y-3 !p-4 border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-1.5 font-sans">
            <Compass className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
            Travelers For You
          </h3>
        </div>
        <div className="py-4 text-center space-y-2">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">No travelers to discover right now</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Explore travelers around the world</p>
          </div>
          <button
            onClick={() => navigate("/social/explore")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors border border-brand-200"
          >
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            Explore travelers
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div
      className="space-y-3 p-4 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] flex items-center gap-1.5 font-sans">
              Travelers For You
            </h3>
            {userCity && (
              <p className="text-[9.5px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping mr-0.5" />
                Suggested near {userCity}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {discoveryCandidates.length > pageSize && (
            <button
              onClick={handleShuffle}
              title="Show more nearby travelers"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-purple-50 hover:text-[#7C3AED] border border-slate-200/60 transition-all cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 ${isRotating ? "animate-spin text-[#7C3AED]" : ""}`} />
              <span>Shuffle</span>
            </button>
          )}

          <button
            onClick={() => navigate("/social/explore")}
            className="text-[10.5px] font-extrabold text-[#7C3AED] hover:text-[#6D28D9] transition-colors uppercase tracking-[0.08em] cursor-pointer"
          >
            See All
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
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