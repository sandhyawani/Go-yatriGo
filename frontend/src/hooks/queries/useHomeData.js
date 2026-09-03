import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import moment from 'moment';

export const useRecentMemoriesQuery = (limit = 5) => {
  return useQuery({
    queryKey: ['recentMemories', limit],
    queryFn: async () => {
      const res = await axios.get(`/social/memory?page=1&limit=${limit}`, {
        withCredentials: true,
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useInfiniteMemoriesQuery = () => {
  return useInfiniteQuery({
    queryKey: ['memories'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(`/social/memory?page=${pageParam}&limit=10`, {
        withCredentials: true,
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore && lastPage.pagination) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useHomeSideDataQuery = (myUserId) => {
  return useQuery({
    queryKey: ['homeSideData', myUserId],
    queryFn: async () => {
      const results = await Promise.allSettled([
        axios.get("/social/story", { withCredentials: true }),
        axios.get("/users/suggestions", { withCredentials: true }),
        axios.get("/social/buddy", { withCredentials: true }),
        axios.get("/social/memory/save?idsOnly=true", { withCredentials: true }),
        axios.get("/journeys/my", { withCredentials: true })
      ]);

      let stories = [];
      let suggestions = [];
      let nearbyTrips = [];
      let savedPostIds = [];
      let activeJourneys = [];

      if (results[0].status === "fulfilled" && results[0].value.data.success) {
        stories = results[0].value.data.stories;
      }

      if (results[1].status === "fulfilled" && results[1].value.data.success) {
        suggestions = (results[1].value.data.suggestions || []).filter(
          (s) => s._id?.toString() !== myUserId
        );
      }

      let buddyActives = [];
      if (results[2].status === "fulfilled" && results[2].value.data?.success) {
        const trips = results[2].value.data.trips || [];
        nearbyTrips = trips;
        const todayBuddy = new Date();
        todayBuddy.setHours(0, 0, 0, 0);
        buddyActives = trips
          .filter((trip) => {
            const isJoined =
              trip.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
              (trip.userId?._id || trip.userId || trip.host?._id || trip.host)?.toString() === myUserId;
            if (!isJoined || trip.status === "cancelled") return false;

            if (trip.endDate && new Date(trip.endDate) < todayBuddy) return false;
            return true;
          })
          .map((trip) => ({
            ...trip,
            isBuddyTrip: true,
            status:
              trip.status === "active" || trip.status === "active now"
                ? "Ongoing"
                : trip.status === "upcoming"
                ? "Upcoming"
                : "Planning"
          }));
      }

      if (results[3].status === "fulfilled" && results[3].value.data?.success) {
        savedPostIds = (results[3].value.data.posts || []).map((p) =>
            (p._id || p.postId?._id)?.toString()
        );
      }

      let userJourneys = [];
      if (results[4].status === "fulfilled" && results[4].value.data?.success) {
        userJourneys = results[4].value.data.journeys || [];
      }

      const todayJourney = new Date();
      todayJourney.setHours(0, 0, 0, 0);
      const actives = userJourneys.filter((j) => {
        const s = String(j.status || "").trim().toLowerCase();
        if (["completed", "cancelled", "canceled", "scrapbook"].includes(s) || j.isCancelled) return false;
        if (j.endDate && new Date(j.endDate) < todayJourney) return false;
        return s === "ongoing" || s === "planning" || s === "upcoming" || s === "active" || s === "active now" || s === "pending";
      });

      const activeIds = new Set(actives.map((j) => (j._id || j.id)?.toString()));
      const activeSourceIds = new Set(
        actives
          .filter((j) => j.sourceType === "explore" && j.sourceId)
          .map((j) => j.sourceId.toString())
      );

      const filteredBuddyActives = buddyActives.filter((trip) => {
        const tripId = (trip._id || trip.id)?.toString();
        return !activeSourceIds.has(tripId) && !activeIds.has(tripId);
      });

      const combinedActives = [...actives, ...filteredBuddyActives];

      const now = moment();
      combinedActives.sort((a, b) => {
        const aHappening =
          a.startDate &&
          moment(a.startDate).isSameOrBefore(now, "day") &&
          (!a.endDate || moment(a.endDate).isSameOrAfter(now, "day"));
        const bHappening =
          b.startDate &&
          moment(b.startDate).isSameOrBefore(now, "day") &&
          (!b.endDate || moment(b.endDate).isSameOrAfter(now, "day"));

        if (aHappening && !bHappening) return -1;
        if (!aHappening && bHappening) return 1;

        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      });

      activeJourneys = combinedActives;

      return {
        stories,
        suggestions,
        nearbyTrips,
        savedPostIds, 
        activeJourneys
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!myUserId, 
  });
};
