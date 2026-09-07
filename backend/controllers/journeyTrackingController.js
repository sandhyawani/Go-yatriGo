const mongoose = require("mongoose");
const Journey = require("../models/Journey");
const JourneyLiveTracking = require("../models/JourneyLiveTracking");

// Helper to verify if user is authorized member/creator of a journey
const checkJourneyMembership = (journey, userId) => {
  if (!journey || !userId) return false;
  const uid = userId.toString();
  const creatorId = (journey.creator?._id || journey.creator)?.toString();
  if (creatorId === uid) return true;

  return Array.isArray(journey.members) && journey.members.some((m) => {
    const mId = (m.user?._id || m.user || m._id || m)?.toString();
    const status = m.status || "active";
    return mId === uid && status === "active";
  });
};

// GET /api/journeys/:id/tracking/settings
exports.getTrackingSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).select("status members creator destination destinationCoordinates");
    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    if (!checkJourneyMembership(journey, userId)) {
      return res.status(403).json({ success: false, message: "Only journey members can view tracking settings" });
    }

    let trackingDoc = await JourneyLiveTracking.findOne({ journeyId: id, userId });
    if (!trackingDoc) {
      trackingDoc = await JourneyLiveTracking.create({
        journeyId: id,
        userId,
        autoTrackingEnabled: false,
        isLive: false
      });
    }

    // Retrieve other active members currently sharing location
    const activeTrackers = await JourneyLiveTracking.find({
      journeyId: id,
      isLive: true
    }).populate("userId", "name profilePic");

    return res.json({
      success: true,
      settings: {
        autoTrackingEnabled: Boolean(trackingDoc.autoTrackingEnabled),
        isLive: Boolean(trackingDoc.isLive),
        distanceTraveled: trackingDoc.distanceTraveled || 0,
        lastActive: trackingDoc.lastActive,
        currentLocation: trackingDoc.currentLocation
      },
      activeMembersCount: activeTrackers.length,
      activeMembers: activeTrackers.map((t) => ({
        userId: t.userId?._id || t.userId,
        name: t.userId?.name || "Traveler",
        profilePic: t.userId?.profilePic || "",
        isLive: t.isLive,
        lastActive: t.lastActive
      }))
    });
  } catch (error) {
    console.error("[getTrackingSettings] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load tracking settings" });
  }
};

// PUT /api/journeys/:id/tracking/settings
exports.updateTrackingSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const { autoTrackingEnabled } = req.body;

    const journey = await Journey.findById(id).select("status members creator");
    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    if (!checkJourneyMembership(journey, userId)) {
      return res.status(403).json({ success: false, message: "Only journey members can update tracking settings" });
    }

    const updateFields = {};
    if (autoTrackingEnabled !== undefined) {
      const enabled = Boolean(autoTrackingEnabled);
      updateFields.autoTrackingEnabled = enabled;
      // If user turns off auto-tracking, immediately stop any active live tracking
      if (!enabled) {
        updateFields.isLive = false;
      }
    }

    const trackingDoc = await JourneyLiveTracking.findOneAndUpdate(
      { journeyId: id, userId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // If auto-tracking was disabled and user was live, notify room of stop
    const io = req.app.get("io");
    if (io && autoTrackingEnabled === false) {
      io.to(id.toString()).emit("journey_tracking_status_changed", {
        journeyId: id.toString(),
        userId: userId.toString(),
        isLive: false,
        userName: req.user.name || "Traveler",
        userPic: req.user.profilePic || ""
      });
    }

    return res.json({
      success: true,
      message: "Tracking settings updated successfully",
      settings: {
        autoTrackingEnabled: Boolean(trackingDoc.autoTrackingEnabled),
        isLive: Boolean(trackingDoc.isLive),
        distanceTraveled: trackingDoc.distanceTraveled || 0,
        lastActive: trackingDoc.lastActive
      }
    });
  } catch (error) {
    console.error("[updateTrackingSettings] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update tracking settings" });
  }
};

// GET /api/journeys/:id/tracking/live
// Initial state fetch for live tracking map
exports.getJourneyLiveTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const journey = await Journey.findById(id).select("status members creator destination destinationCoordinates");
    if (!journey) {
      return res.status(404).json({ success: false, message: "Journey not found" });
    }

    if (!checkJourneyMembership(journey, userId)) {
      return res.status(403).json({ success: false, message: "Access denied. Only journey members can view live tracking." });
    }

    // Only return live tracking data if member opted in or is live
    const liveTrackers = await JourneyLiveTracking.find({
      journeyId: id,
      $or: [{ isLive: true }, { "currentLocation.latitude": { $ne: null } }]
    }).populate("userId", "name profilePic");

    const trackersData = liveTrackers.map((t) => ({
      userId: t.userId?._id || t.userId,
      name: t.userId?.name || "Traveler",
      profilePic: t.userId?.profilePic || "",
      isLive: Boolean(t.isLive),
      currentLocation: t.currentLocation || null,
      recentTrail: Array.isArray(t.recentTrail) ? t.recentTrail.slice(-30) : [],
      distanceTraveled: t.distanceTraveled || 0,
      lastActive: t.lastActive
    }));

    return res.json({
      success: true,
      journeyId: id,
      destination: journey.destination,
      destinationCoordinates: journey.destinationCoordinates || null,
      trackers: trackersData
    });
  } catch (error) {
    console.error("[getJourneyLiveTracking] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch live tracking data" });
  }
};
