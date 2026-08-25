import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Navigation,
  ShieldCheck
} from "lucide-react";

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const JourneyReplay = ({ journey }) => {
  const [activeStopIdx, setActiveStopIdx] = useState(0);

  const realStops = Array.isArray(journey?.stops) && journey.stops.length > 0
    ? journey.stops
    : Array.isArray(journey?.routeStops) && journey.routeStops.length > 0
    ? journey.routeStops
    : [];

  if (realStops.length === 0) {
    return (
      <div className="max-w-3xl mx-auto my-8 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Navigation className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 font-heading">
            Journey Replay
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            No route stops were recorded for this journey.
          </p>
          {journey?.destination && (
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Destination: {journey.destination}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentStop = realStops[activeStopIdx] || realStops[0];
  const hasValidCoords = Array.isArray(currentStop?.coords) && currentStop.coords.length === 2;

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto px-4 font-sans antialiased">
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shrink-0">
        <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Route Replay
            </h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              Recorded Waypoints & Route Stops
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
            {realStops.length} {realStops.length === 1 ? "Stop" : "Stops"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {hasValidCoords && (
          <div className="card p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold truncate">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="truncate">{currentStop.title || "Current Stop"}</span>
              </div>
              {currentStop.day && (
                <span className="text-[9px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 px-2 py-0.5 rounded-md shrink-0">
                  {currentStop.day}
                </span>
              )}
            </div>

            <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-10">
              <MapContainer
                key={activeStopIdx}
                center={currentStop.coords}
                zoom={11}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={currentStop.coords} icon={markerIcon}>
                  <Popup>
                    <div className="p-1 text-center font-display text-[9px]">
                      {currentStop.day && (
                        <span className="font-black text-primary-600 uppercase tracking-widest block mb-0.5">
                          {currentStop.day} stop
                        </span>
                      )}
                      <span className="font-bold text-slate-700">{currentStop.title || "Stop"}</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

        <div className="space-y-4 flex-1">
          {realStops.map((stop, sIdx) => {
            const isOpen = activeStopIdx === sIdx;
            return (
              <div
                key={sIdx}
                className={`card bg-white dark:bg-slate-900 border rounded-[22px] transition-all duration-300 ${
                  isOpen
                    ? "border-primary-200 dark:border-primary-800/80 shadow-soft"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveStopIdx(sIdx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors shrink-0 ${
                        isOpen
                          ? "bg-primary-600 text-white"
                          : "bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-slate-500"
                      }`}
                    >
                      {sIdx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2 truncate">
                        <span className="truncate">{stop.title || `Stop ${sIdx + 1}`}</span>
                        {stop.day && (
                          <span className="text-[9px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full lowercase tracking-normal shrink-0">
                            {stop.day}
                          </span>
                        )}
                      </h4>
                      {stop.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                          {stop.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-primary-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-50 dark:border-slate-800 pt-4 space-y-4">
                    {stop.checkIn && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Verified: {stop.checkIn}</span>
                      </div>
                    )}

                    {Array.isArray(stop.photos) && stop.photos.length > 0 && (
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-2">
                          Stop Photos
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {stop.photos.map((pic, pIdx) => (
                            <div key={pIdx} className="rounded-xl overflow-hidden h-28 border border-slate-100 dark:border-slate-800">
                              <img
                                src={pic}
                                className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                                alt={`Stop ${sIdx + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JourneyReplay;