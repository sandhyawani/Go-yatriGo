import { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";

const getUserId = (user) => {
  if (!user) return "";

  if (typeof user === "object") {
    return String(user._id || user.id || "");
  }

  return String(user);
};

const normalizeTripMates = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }

  const seen = new Set();

  return data.filter((user) => {
    const id = getUserId(user);

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

export const useTripMates = (userId) => {
  const [tripMates, setTripMates] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const fetchTripMates = useCallback(async () => {
    if (!userId) {
      setTripMates([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/trip-mates/${userId}`, {
        withCredentials: true,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to load Trip Mates"
        );
      }

      const users = normalizeTripMates(response.data.trip_mates);

      setTripMates(users);
    } catch (err) {
      console.error("Failed to fetch Trip Mates:", err);

      setError(err);
      setTripMates([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTripMates();
  }, [fetchTripMates]);

  const connectionStates = {};

  tripMates.forEach((tripMate) => {
    const id = getUserId(tripMate);

    if (id) {
      connectionStates[id] = "connected";
    }
  });

  return {
    tripMates,
    tripMatesCount: tripMates.length,
    connectionStates,
    loading,
    error,
    refetch: fetchTripMates,
  };
};

export default useTripMates;