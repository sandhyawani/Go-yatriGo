import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Compass,
  MapPin,
  Users,
  LocateFixed,
  Maximize2,
  Activity,
  Radio,
  Gauge,
  Clock,
  ShieldCheck
} from "lucide-react";

// Custom pulsating marker for live traveler
const createTravelerIcon = (user, isCurrentUser = false, heading = null) => {
  const avatarUrl = user?.profilePic || user?.pic || user?.img || user?.avatar || "";
  const name = user?.name || (isCurrentUser ? "You" : "Traveler");
  const initial = name.charAt(0).toUpperCase();

  const pulseColor = isCurrentUser ? "bg-emerald-500" : "bg-sky-500";
  const ringColor = isCurrentUser ? "border-emerald-500" : "border-sky-500";
  const badgeBg = isCurrentUser ? "bg-emerald-600" : "bg-sky-600";

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group">
      <!-- Radar pulse ring -->
      <div class="absolute -inset-2 rounded-full ${pulseColor} opacity-30 animate-ping"></div>
      <div class="absolute -inset-1 rounded-full ${pulseColor} opacity-40 animate-pulse"></div>

      <!-- Center Avatar pin -->
      <div class="relative w-10 h-10 rounded-full border-2 ${ringColor} bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center z-10 transition-transform duration-300 hover:scale-110">
        ${
          avatarUrl
            ? `<img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div class="w-full h-full hidden items-center justify-center ${badgeBg} text-white font-black text-xs">${initial}</div>`
            : `<div class="w-full h-full flex items-center justify-center ${badgeBg} text-white font-black text-xs">${initial}</div>`
        }
      </div>

      <!-- Heading Indicator Arrow if available -->
      ${
        heading !== null && heading !== undefined
          ? `<div class="absolute -top-1.5 w-3 h-3 bg-white border border-slate-700 shadow-xs rotate-45 z-20" style="transform: rotate(${heading}deg) translateY(-8px);"></div>`
          : ""
      }

      <!-- Name label pill -->
      <div class="absolute top-11 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none border border-white/10 z-20">
        ${isCurrentUser ? "You" : name}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "traveler-marker-container",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Destination Pin Icon
const createDestinationIcon = (destinationTitle = "Destination") => {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full group">
      <div class="w-9 h-9 rounded-2xl bg-rose-600 text-white shadow-xl flex items-center justify-center border-2 border-white transition-transform duration-300 hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </div>
      <div class="absolute -bottom-1 w-2 h-2 bg-rose-600 rotate-45 border-r border-b border-white"></div>
      <div class="absolute top-10 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none border border-white/10">
        ${destinationTitle}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "destination-marker-container",
    iconSize: [36, 42],
    iconAnchor: [18, 42]
  });
};

const JourneyLiveMap = ({
  journey,
  currentLocation,
  recentTrail = [],
  otherTrackers = [],
  distanceTraveled = 0,
  isTracking = false,
  onToggleTracking,
  isOngoing = true
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const polylineGroupRef = useRef(null);

  const [selectedTrackerId, setSelectedTrackerId] = useState("me");
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  // Time elapsed since last coordinate update
  useEffect(() => {
    setLastUpdatedSec(0);
    const interval = setInterval(() => {
      setLastUpdatedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Destination coordinates from journey
  const destCoords = useMemo(() => {
    if (journey?.destinationCoordinates?.lat && journey?.destinationCoordinates?.lng) {
      return [journey.destinationCoordinates.lat, journey.destinationCoordinates.lng];
    }
    return null;
  }, [journey?.destinationCoordinates]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: current location, or destination, or India centroid [20.5937, 78.9629]
    const initialLat = currentLocation?.latitude || destCoords?.[0] || 20.5937;
    const initialLng = currentLocation?.longitude || destCoords?.[1] || 78.9629;
    const initialZoom = currentLocation?.latitude ? 15 : 6;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Clean modern OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    // Zoom control in bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const polylineGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;
    polylineGroupRef.current = polylineGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const polylineGroup = polylineGroupRef.current;
    if (!map || !markersGroup || !polylineGroup) return;

    markersGroup.clearLayers();
    polylineGroup.clearLayers();

    const boundsPoints = [];

    // 1. Current User Marker
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const userPos = [currentLocation.latitude, currentLocation.longitude];
      boundsPoints.push(userPos);

      const currentUserIcon = createTravelerIcon(
        journey?.currentUser || { name: "You" },
        true,
        currentLocation.heading
      );
      const userMarker = L.marker(userPos, { icon: currentUserIcon });
      markersGroup.addLayer(userMarker);
    }

    // 2. Travelled Route Polyline
    const validTrailPoints = recentTrail
      .filter((p) => p && typeof p.latitude === "number" && typeof p.longitude === "number")
      .map((p) => [p.latitude, p.longitude]);

    // Include current position in trail if available
    if (currentLocation?.latitude && currentLocation?.longitude) {
      validTrailPoints.push([currentLocation.latitude, currentLocation.longitude]);
    }

    if (validTrailPoints.length > 1) {
      const polyline = L.polyline(validTrailPoints, {
        color: "#0ea5e9",
        weight: 5,
        opacity: 0.85,
        lineJoin: "round",
        lineCap: "round",
        dashArray: isTracking ? undefined : "6, 8"
      });
      polylineGroup.addLayer(polyline);
    }

    // 3. Other Group Trackers
    otherTrackers.forEach((tracker) => {
      const loc = tracker.currentLocation;
      if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
        const trackerPos = [loc.latitude, loc.longitude];
        boundsPoints.push(trackerPos);

        const trackerIcon = createTravelerIcon(tracker, false, loc.heading);
        const marker = L.marker(trackerPos, { icon: trackerIcon });
        markersGroup.addLayer(marker);

        // Recent trail of this member
        if (Array.isArray(tracker.recentTrail) && tracker.recentTrail.length > 1) {
          const mTrail = tracker.recentTrail
            .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
            .map((p) => [p.latitude, p.longitude]);
          mTrail.push(trackerPos);

          const mPolyline = L.polyline(mTrail, {
            color: "#6366f1",
            weight: 4,
            opacity: 0.7,
            lineJoin: "round",
            lineCap: "round"
          });
          polylineGroup.addLayer(mPolyline);
        }
      }
    });

    // 4. Destination Marker
    if (destCoords) {
      boundsPoints.push(destCoords);
      const destIcon = createDestinationIcon(journey?.destination || "Destination");
      const destMarker = L.marker(destCoords, { icon: destIcon });
      markersGroup.addLayer(destMarker);
    }

    // If focused on a specific traveler
    if (selectedTrackerId === "me" && currentLocation?.latitude) {
      map.panTo([currentLocation.latitude, currentLocation.longitude], { animate: true });
    } else if (selectedTrackerId !== "me" && selectedTrackerId !== "all") {
      const target = otherTrackers.find((t) => (t.userId?._id || t.userId)?.toString() === selectedTrackerId);
      if (target?.currentLocation?.latitude) {
        map.panTo([target.currentLocation.latitude, target.currentLocation.longitude], { animate: true });
      }
    }
  }, [currentLocation, recentTrail, otherTrackers, destCoords, selectedTrackerId]);

  // Recenter Handler
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentLocation?.latitude && currentLocation?.longitude) {
      setSelectedTrackerId("me");
      map.flyTo([currentLocation.latitude, currentLocation.longitude], 16, {
        animate: true,
        duration: 0.8
      });
    } else if (destCoords) {
      map.flyTo(destCoords, 14, { animate: true, duration: 0.8 });
    }
  };

  // Fit All Bounds Handler
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setSelectedTrackerId("all");
    const points = [];
    if (currentLocation?.latitude) points.push([currentLocation.latitude, currentLocation.longitude]);
    otherTrackers.forEach((t) => {
      if (t.currentLocation?.latitude) points.push([t.currentLocation.latitude, t.currentLocation.longitude]);
    });
    if (destCoords) points.push(destCoords);

    if (points.length > 0) {
      map.flyToBounds(L.latLngBounds(points), { padding: [50, 50], animate: true, duration: 0.8 });
    }
  };

  // Format last updated text
  const formatLastUpdated = () => {
    if (lastUpdatedSec === 0) return "Just now";
    if (lastUpdatedSec < 60) return `${lastUpdatedSec}s ago`;
    const mins = Math.floor(lastUpdatedSec / 60);
    return `${mins}m ago`;
  };

  // Speed and Accuracy
  const currentSpeed = currentLocation?.speed ? Math.round(currentLocation.speed) : 0;
  const currentAccuracy = currentLocation?.accuracy ? Math.round(currentLocation.accuracy) : null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900 flex flex-col min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]">
      {/* 1. Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top HUD Bar - Ola/Uber style glass overlay */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pointer-events-none">
        {/* Live Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white shadow-xl max-w-fit">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isTracking && isOngoing ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
              )}
            </span>
            <span className="text-xs font-black uppercase tracking-wider">
              {isTracking && isOngoing ? "Live GPS Active" : isOngoing ? "Tracking Paused" : "Pre-Trip Map"}
            </span>
          </div>

          <div className="h-3 w-px bg-white/20 mx-0.5" />

          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{currentLocation?.latitude ? formatLastUpdated() : "Waiting for GPS..."}</span>
          </div>
        </div>

        {/* Multi-member roster pills */}
        {otherTrackers.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={handleRecenter}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedTrackerId === "me"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              You
            </button>

            {otherTrackers.map((t) => {
              const uId = (t.userId?._id || t.userId)?.toString();
              const isSelected = selectedTrackerId === uId;
              return (
                <button
                  key={uId}
                  onClick={() => setSelectedTrackerId(uId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span className="truncate max-w-[80px]">{t.name || "Member"}</span>
                </button>
              );
            })}

            <button
              onClick={handleFitAll}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedTrackerId === "all"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title="Fit all travelers on map"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Floating Map Controls */}
      <div className="absolute right-3.5 bottom-24 sm:bottom-28 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 group"
          title="Recenter on My Location"
        >
          <LocateFixed className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={handleFitAll}
          className="w-11 h-11 rounded-2xl bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 flex items-center justify-center transition-all active:scale-95"
          title="Fit Route on Map"
        >
          <Maximize2 className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* 4. Bottom Trip Stats HUD Dashboard (Ola/Uber Experience) */}
      <div className="relative z-10 mt-auto p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-3xl p-3.5 sm:p-4 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            {/* Distance Travelled */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-emerald-400" /> Distance
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black font-heading text-white">
                  {distanceTraveled > 0 ? distanceTraveled.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs font-bold text-emerald-400">km</span>
              </div>
            </div>

            {/* Current Speed */}
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-sky-400" /> Speed
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black font-heading text-white">
                  {currentSpeed}
                </span>
                <span className="text-xs font-bold text-sky-400">km/h</span>
              </div>
            </div>

            {/* GPS Accuracy */}
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-400" /> GPS Signal
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-slate-200">
                  {currentAccuracy !== null
                    ? currentAccuracy <= 15
                      ? "High"
                      : currentAccuracy <= 40
                      ? "Good"
                      : "Fair"
                    : "Calibrating"}
                </span>
                {currentAccuracy !== null && (
                  <span className="text-[10px] text-slate-400">±{currentAccuracy}m</span>
                )}
              </div>
            </div>
          </div>

          {/* Manual Stop / Pause Button */}
          {isOngoing && onToggleTracking && (
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <button
                onClick={onToggleTracking}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  isTracking
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isTracking ? "Stop Live Tracking" : "Start Live Tracking"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyLiveMap;
