const Journey = require("../models/Journey");
const JourneyLiveTracking = require("../models/JourneyLiveTracking");
const User = require("../models/User");

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function registerJourneyTrackingHandlers(io, socket) {
  const userId = socket.userId;

  socket.on("journey_location_update", async (data) => {
    try {
      if (!userId) return;
      const { journeyId, latitude, longitude, accuracy, heading, speed, timestamp } = data || {};

      if (!journeyId || typeof latitude !== "number" || typeof longitude !== "number") {
        return;
      }

      const journey = await Journey.findById(journeyId).select("status members creator");
      if (!journey) return;

      const status = String(journey.status || "").trim().toLowerCase();
      if (status !== "ongoing" && status !== "active") {
        return;
      }

      const uid = userId.toString();
      const isCreator = (journey.creator?._id || journey.creator)?.toString() === uid;
      const isMember = isCreator || (Array.isArray(journey.members) && journey.members.some((m) => {
        const mId = (m.user?._id || m.user || m._id || m)?.toString();
        const mStatus = m.status || "active";
        return mId === uid && mStatus === "active";
      }));

      if (!isMember) {
        console.warn(`[SOCKET TRACKING] Unauthorized location update for journey ${journeyId} from user ${userId}`);
        return;
      }

      let trackingDoc = await JourneyLiveTracking.findOne({ journeyId, userId });
      if (!trackingDoc) {
        trackingDoc = new JourneyLiveTracking({
          journeyId,
          userId,
          autoTrackingEnabled: true,
          isLive: true
        });
      }

      let distanceIncrementKm = 0;
      if (
        trackingDoc.currentLocation &&
        typeof trackingDoc.currentLocation.latitude === "number" &&
        typeof trackingDoc.currentLocation.longitude === "number"
      ) {
        const dist = calculateHaversineKm(
          trackingDoc.currentLocation.latitude,
          trackingDoc.currentLocation.longitude,
          latitude,
          longitude
        );
        if (dist >= 0.005 && dist <= 2.0) {
          distanceIncrementKm = dist;
        }
      }

      const newDistance = (trackingDoc.distanceTraveled || 0) + distanceIncrementKm;

      trackingDoc.currentLocation = {
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        heading: typeof heading === "number" ? heading : null,
        speed: typeof speed === "number" ? speed : null,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };
      trackingDoc.distanceTraveled = Math.round(newDistance * 100) / 100;
      trackingDoc.isLive = true;
      trackingDoc.lastActive = new Date();

      if (distanceIncrementKm >= 0.01 || trackingDoc.recentTrail.length === 0) {
        trackingDoc.recentTrail.push({
          latitude,
          longitude,
          timestamp: new Date()
        });
        if (trackingDoc.recentTrail.length > 50) {
          trackingDoc.recentTrail = trackingDoc.recentTrail.slice(-50);
        }
      }

      await trackingDoc.save();

      const user = await User.findById(userId).select("name profilePic").lean();

      const payload = {
        journeyId,
        userId: uid, // Derived strictly from verified socket.userId, never from client payload
        userName: user?.name || "Traveler",
        userPic: user?.profilePic || "",
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp: trackingDoc.currentLocation.timestamp,
        distanceTraveled: trackingDoc.distanceTraveled
      };

      socket.to(journeyId).emit("journey_member_location", payload);
    } catch (err) {
      console.error("[SOCKET TRACKING] Error handling location update:", err.message);
    }
  });

  socket.on("journey_tracking_status", async (data) => {
    try {
      if (!userId) return;
      const { journeyId, isLive } = data || {};
      if (!journeyId) return;

      const journey = await Journey.findById(journeyId).select("status members creator");
      if (!journey) return;

      const status = String(journey.status || "").trim().toLowerCase();
      if (status !== "ongoing" && status !== "active") return;

      const uid = userId.toString();
      const isCreator = (journey.creator?._id || journey.creator)?.toString() === uid;
      const isMember = isCreator || (Array.isArray(journey.members) && journey.members.some((m) => {
        const mId = (m.user?._id || m.user || m._id || m)?.toString();
        const mStatus = m.status || "active";
        return mId === uid && mStatus === "active";
      }));

      if (!isMember) return;

      await JourneyLiveTracking.findOneAndUpdate(
        { journeyId, userId: uid },
        {
          $set: {
            isLive: Boolean(isLive),
            lastActive: Boolean(isLive) ? new Date() : undefined
          }
        },
        { upsert: true }
      );

      const user = await User.findById(uid).select("name profilePic").lean();

      socket.to(journeyId).emit("journey_tracking_status_changed", {
        journeyId,
        userId: uid,
        userName: user?.name || "Traveler",
        userPic: user?.profilePic || "",
        isLive: Boolean(isLive)
      });
    } catch (err) {
      console.error("[SOCKET TRACKING] Error handling status change:", err.message);
    }
  });

  socket.on("journey_stop_tracking", async (data) => {
    try {
      if (!userId) return;
      const { journeyId } = data || {};
      if (!journeyId) return;

      const uid = userId.toString();

      await JourneyLiveTracking.findOneAndUpdate(
        { journeyId, userId: uid },
        { $set: { isLive: false } }
      );

      socket.to(journeyId).emit("journey_tracking_status_changed", {
        journeyId,
        userId: uid,
        isLive: false
      });
    } catch (err) {
      console.error("[SOCKET TRACKING] Error stopping tracking:", err.message);
    }
  });
}

module.exports = {
  registerJourneyTrackingHandlers
};
