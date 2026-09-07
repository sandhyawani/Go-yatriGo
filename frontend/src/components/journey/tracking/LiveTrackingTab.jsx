import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import {
  Navigation,
  ShieldCheck,
  MapPin,
  Compass,
  AlertTriangle,
  Clock,
  Radio,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle2,
  Lock,
  Users,
  Loader2,
  WifiOff,
  Square
} from "lucide-react";
import axiosInstance from "../../../api/axios";
import { AuthContext } from "../../../context/authContext";
import { SocketContext } from "../../../context/SocketContext";
import { showToast } from "../../../utils/showToast";
import { getJourneyLifecycle } from "../../../utils/journeyLifecycle";
import JourneyLiveMap from "./JourneyLiveMap";

// Haversine calculation for local client updates
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

const LiveTrackingTab = ({ journey, currentUserId, onRefreshJourney }) => {
  const { user } = useContext(AuthContext) || {};
  const socket = useContext(SocketContext);

  const [loading, setLoading] = useState(true);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isStartingGPS, setIsStartingGPS] = useState(false);
  const [permissionState, setPermissionState] = useState("unknown"); // 'granted', 'prompt', 'denied', 'unsupported'
  const [socketConnected, setSocketConnected] = useState(Boolean(socket && socket.connected));

  const [currentLocation, setCurrentLocation] = useState(null);
  const [recentTrail, setRecentTrail] = useState([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [otherTrackers, setOtherTrackers] = useState([]);

  const watchIdRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const trailingEmitTimeoutRef = useRef(null);
  const latestCoordsRef = useRef(null);
  const lifecycle = getJourneyLifecycle(journey);

  const isMember =
    (journey?.creator?._id || journey?.creator)?.toString() === currentUserId?.toString() ||
    journey?.members?.some(
      (m) => (m.user?._id || m.user)?.toString() === currentUserId?.toString()
    );

  // Monitor socket connection state
  useEffect(() => {
    if (!socket) return;
    setSocketConnected(Boolean(socket.connected));

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  // 1. Check Browser Geolocation Permission State
  const checkPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      return "unsupported";
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        setPermissionState(status.state);
        status.onchange = () => {
          setPermissionState(status.state);
        };
        return status.state;
      } catch (e) {
        setPermissionState("prompt");
        return "prompt";
      }
    } else {
      setPermissionState("prompt");
      return "prompt";
    }
  }, []);

  // 2. Fetch Initial Tracking Settings and Live State
  useEffect(() => {
    if (!journey?._id || !isMember) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    checkPermission();

    axiosInstance
      .get(`/journeys/${journey._id}/tracking/settings`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          setAutoTrackingEnabled(Boolean(res.data.settings?.autoTrackingEnabled));
          setIsLiveTracking(Boolean(res.data.settings?.isLive));
          setDistanceTraveled(res.data.settings?.distanceTraveled || 0);
          if (res.data.settings?.currentLocation?.latitude) {
            setCurrentLocation(res.data.settings.currentLocation);
          }
        }
      })
      .catch((err) => {
        console.warn("[LiveTrackingTab] Failed to fetch settings:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Fetch initial live trackers (other active members)
    axiosInstance
      .get(`/journeys/${journey._id}/tracking/live`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && Array.isArray(res.data.trackers)) {
          const currentUidStr = currentUserId?.toString();
          const others = res.data.trackers.filter(
            (t) => (t.userId?._id || t.userId)?.toString() !== currentUidStr
          );
          setOtherTrackers(others);

          const myDoc = res.data.trackers.find(
            (t) => (t.userId?._id || t.userId)?.toString() === currentUidStr
          );
          if (myDoc) {
            if (Array.isArray(myDoc.recentTrail) && myDoc.recentTrail.length > 0) {
              setRecentTrail(myDoc.recentTrail);
            }
            if (myDoc.distanceTraveled) {
              setDistanceTraveled(myDoc.distanceTraveled);
            }
          }
        }
      })
      .catch((err) => console.warn("[LiveTrackingTab] Failed to fetch live trackers:", err));

    return () => {
      isMounted = false;
    };
  }, [journey?._id, isMember, currentUserId, checkPermission]);

  // 3. Socket.IO Room Connection and Event Listeners
  useEffect(() => {
    if (!socket || !journey?._id || !isMember) return;

    // Join journey room for tracking
    socket.emit("join_room", journey._id);

    // Listen for member location broadcasts
    const handleMemberLocation = (data) => {
      if (data.journeyId?.toString() !== journey._id.toString()) return;
      const currentUidStr = currentUserId?.toString();
      const senderUidStr = data.userId?.toString();

      // If update is from another member
      if (senderUidStr && senderUidStr !== currentUidStr) {
        setOtherTrackers((prev) => {
          const index = prev.findIndex(
            (t) => (t.userId?._id || t.userId)?.toString() === senderUidStr
          );
          const newTracker = {
            userId: data.userId,
            name: data.userName,
            profilePic: data.userPic,
            isLive: true,
            currentLocation: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              heading: data.heading,
              speed: data.speed,
              timestamp: data.timestamp
            },
            distanceTraveled: data.distanceTraveled || 0,
            lastActive: new Date()
          };

          if (index !== -1) {
            const updated = [...prev];
            const existingTrail = updated[index].recentTrail || [];
            updated[index] = {
              ...newTracker,
              recentTrail: [
                ...existingTrail,
                { latitude: data.latitude, longitude: data.longitude, timestamp: new Date() }
              ].slice(-40)
            };
            return updated;
          } else {
            return [...prev, { ...newTracker, recentTrail: [{ latitude: data.latitude, longitude: data.longitude }] }];
          }
        });
      }
    };

    // Listen for tracking status changes (paused/resumed)
    const handleStatusChanged = (data) => {
      if (data.journeyId?.toString() !== journey._id.toString()) return;
      const currentUidStr = currentUserId?.toString();
      const senderUidStr = data.userId?.toString();

      if (senderUidStr && senderUidStr !== currentUidStr) {
        setOtherTrackers((prev) =>
          prev.map((t) =>
            (t.userId?._id || t.userId)?.toString() === senderUidStr
              ? { ...t, isLive: Boolean(data.isLive) }
              : t
          )
        );
      }
    };

    socket.on("journey_member_location", handleMemberLocation);
    socket.on("journey_tracking_status_changed", handleStatusChanged);

    return () => {
      socket.off("journey_member_location", handleMemberLocation);
      socket.off("journey_tracking_status_changed", handleStatusChanged);
    };
  }, [socket, journey?._id, isMember, currentUserId]);

  // 4. Start Active Geolocation Tracking
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      showToast.error("Geolocation is not supported by your browser");
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    setIsStartingGPS(true);

    const options = {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;

      setPermissionState("granted");
      setIsStartingGPS(false);
      setIsLiveTracking(true);

      setCurrentLocation((prevLoc) => {
        // Calculate distance increment
        if (prevLoc?.latitude && prevLoc?.longitude) {
          const dist = calculateHaversineKm(prevLoc.latitude, prevLoc.longitude, latitude, longitude);
          if (dist >= 0.005 && dist <= 2.0) {
            setDistanceTraveled((prevDist) => Math.round((prevDist + dist) * 100) / 100);
          }
        }

        // Append to recent visual trail preview
        setRecentTrail((prevTrail) => {
          const newTrail = [...prevTrail, { latitude, longitude, timestamp: new Date() }];
          return newTrail.slice(-50);
        });

        return {
          latitude,
          longitude,
          accuracy,
          heading,
          speed: speed ? Math.round(speed * 3.6) : null,
          timestamp: new Date()
        };
      });

      // Keep latest coordinates for trailing-edge emit
      latestCoordsRef.current = { latitude, longitude, accuracy, heading, speed };

      const emitToSocket = (coords) => {
        lastEmitTimeRef.current = Date.now();
        if (socket && journey?._id) {
          socket.emit("journey_location_update", {
            journeyId: journey._id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            heading: coords.heading,
            speed: coords.speed ? Math.round(coords.speed * 3.6) : null,
            timestamp: new Date().toISOString()
          });
        }
      };

      // Leading and trailing 3-second throttle to prevent rapid GPS updates from flooding socket/DB
      const now = Date.now();
      const timeSinceLastEmit = now - lastEmitTimeRef.current;

      if (timeSinceLastEmit >= 3000) {
        if (trailingEmitTimeoutRef.current) {
          clearTimeout(trailingEmitTimeoutRef.current);
          trailingEmitTimeoutRef.current = null;
        }
        emitToSocket({ latitude, longitude, accuracy, heading, speed });
      } else if (!trailingEmitTimeoutRef.current) {
        // Schedule trailing emit for when the 3-second cooldown expires
        trailingEmitTimeoutRef.current = setTimeout(() => {
          trailingEmitTimeoutRef.current = null;
          if (latestCoordsRef.current) {
            emitToSocket(latestCoordsRef.current);
          }
        }, 3000 - timeSinceLastEmit);
      }
    };

    const handleError = (err) => {
      console.warn("[Geolocation Error]", err.code, err.message);
      setIsStartingGPS(false);
      if (err.code === 1) {
        // PERMISSION_DENIED
        setPermissionState("denied");
        stopWatching();
        showToast.warning("Location permission was denied. Live tracking is paused.");
      }
    };

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = id;
  }, [socket, journey?._id]);

  // 5. Stop Active Geolocation Tracking
  const stopWatching = useCallback(() => {
    if (trailingEmitTimeoutRef.current) {
      clearTimeout(trailingEmitTimeoutRef.current);
      trailingEmitTimeoutRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsStartingGPS(false);
    setIsLiveTracking(false);

    if (socket && journey?._id) {
      socket.emit("journey_stop_tracking", { journeyId: journey._id });
    }
  }, [socket, journey?._id]);

  // 6. Automatic Start/Stop Semantics
  // Strictly: user opted in + permission ALREADY granted + journey is Ongoing
  useEffect(() => {
    if (lifecycle.isOngoing && autoTrackingEnabled && permissionState === "granted") {
      startWatching();
    } else if (!lifecycle.isOngoing) {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [lifecycle.isOngoing, autoTrackingEnabled, permissionState, startWatching, stopWatching]);

  // 7. Toggle Auto-Tracking Opt-In Setting
  const handleToggleAutoTracking = async () => {
    const nextState = !autoTrackingEnabled;
    try {
      setAutoTrackingEnabled(nextState);
      const res = await axiosInstance.put(`/journeys/${journey._id}/tracking/settings`, {
        autoTrackingEnabled: nextState
      });
      if (res.data?.success) {
        if (nextState) {
          showToast.success("Live location sharing enabled for this journey.");
          // If journey is active and permission is already granted, start tracking
          if (lifecycle.isOngoing && permissionState === "granted") {
            startWatching();
          }
        } else {
          stopWatching();
          showToast.info("Live location sharing turned off.");
        }
      }
    } catch (err) {
      console.error("Error updating tracking setting:", err);
      setAutoTrackingEnabled(!nextState); // revert
      showToast.error("Failed to update tracking setting");
    }
  };

  // 8. Explicit User Trigger: "Allow Location" / "Enable GPS"
  const handleRequestPermission = () => {
    if (!navigator.geolocation) {
      showToast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsStartingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissionState("granted");
        setIsStartingGPS(false);
        showToast.success("Location permission granted!");
        if (lifecycle.isOngoing) {
          startWatching();
        }
      },
      (err) => {
        setPermissionState("denied");
        setIsStartingGPS(false);
        showToast.error("Location permission was denied in browser settings.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 9. Manual Start / Stop Tracking Button
  const handleManualToggleTracking = () => {
    if (isLiveTracking) {
      stopWatching();
      showToast.info("Live tracking stopped.");
    } else {
      if (permissionState === "denied") {
        showToast.warning("Please enable location access in your browser settings to track live.");
        return;
      }
      if (permissionState !== "granted") {
        handleRequestPermission();
        return;
      }
      startWatching();
      showToast.success("Live tracking started!");
    }
  };

  if (!isMember) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-3 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-text-primary">Member-Only Feature</h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Live trip tracking is only visible to authorized travelers of this journey to protect member privacy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Explicit Status Banner / Opt-In Consent Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-text-primary m-0">Live Location Sharing</h3>

              {/* Explicit State Pill */}
              {isLiveTracking ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  SHARING LIVE
                </span>
              ) : isStartingGPS ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  ACQUIRING GPS
                </span>
              ) : autoTrackingEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  AUTO-START ON
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  NOT SHARING
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary font-medium leading-relaxed m-0">
              Automatically start live tracking when this journey begins. Only authorized journey members can see your live location.
            </p>
          </div>
        </div>

        {/* Action button based on state */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {isLiveTracking ? (
            <button
              onClick={stopWatching}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Sharing</span>
            </button>
          ) : (
            <button
              onClick={handleToggleAutoTracking}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                autoTrackingEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {autoTrackingEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Sharing ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Enable Live Location</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Socket Disconnected Warning if connection lost */}
      {!socketConnected && (
        <div className="bg-slate-100 border border-slate-300 p-3 rounded-2xl flex items-center gap-2.5 text-slate-700 text-xs font-semibold shadow-xs">
          <WifiOff className="w-4 h-4 text-slate-500 animate-pulse" />
          <span>Real-time connection re-establishing... updates will resume automatically.</span>
        </div>
      )}

      {/* 3. Location Permission Blocked Notice */}
      {permissionState === "denied" && (
        <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Location Permission Denied</h4>
              <p className="text-xs text-amber-800/90 m-0">
                Location access is blocked in your browser settings. To share your live route with trip members, please allow location access in your browser's site permissions.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-xs self-end sm:self-center"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* 4. Permission Needed Prompt (if opted in, active, but permission not yet asked) */}
      {permissionState === "prompt" && autoTrackingEnabled && lifecycle.isOngoing && !isLiveTracking && (
        <div className="bg-sky-50/90 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 shadow-xs">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Allow Location Access</h4>
              <p className="text-xs text-sky-800/90 m-0">
                Your journey is ongoing. Click below to grant GPS permission and start sharing your live position.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            disabled={isStartingGPS}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5 self-end sm:self-center disabled:opacity-50"
          >
            {isStartingGPS ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <span>Allow Location</span>
            )}
          </button>
        </div>
      )}

      {/* 5. Pre-Trip Standby Banner */}
      {!lifecycle.isOngoing && !lifecycle.isCompleted && (
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 text-slate-700 shadow-xs">
          <Compass className="w-5 h-5 text-brand shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-text-primary m-0">Pre-Trip Tracking Standby</h4>
            <p className="text-xs text-text-muted m-0">
              Live trip tracking will automatically activate once the journey starts on{" "}
              {journey.startDate
                ? new Date(journey.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "the scheduled start date"}
              . Your preferences are saved.
            </p>
          </div>
        </div>
      )}

      {/* 6. Journey Ended Notice */}
      {lifecycle.isCompleted && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center gap-3 text-purple-900 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-purple-950 m-0">Journey Completed — Tracking Stopped</h4>
            <p className="text-xs text-purple-800/90 m-0">
              Live tracking was automatically stopped when this journey ended. Total distance recorded:{" "}
              <strong className="text-purple-950 font-bold">{distanceTraveled.toFixed(1)} km</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 7. Ola/Uber Interactive Live Map */}
      <JourneyLiveMap
        journey={{ ...journey, currentUser: user }}
        currentLocation={currentLocation}
        recentTrail={recentTrail}
        otherTrackers={otherTrackers}
        distanceTraveled={distanceTraveled}
        isTracking={isLiveTracking}
        onToggleTracking={handleManualToggleTracking}
        isOngoing={lifecycle.isOngoing}
      />
    </div>
  );
};

export default LiveTrackingTab;
