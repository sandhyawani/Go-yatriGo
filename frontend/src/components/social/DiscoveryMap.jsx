import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { Navigation } from "lucide-react";


const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


const destinationCoordsMap = {
  "goa": [15.2993, 74.1240],
  "spiti": [32.2461, 78.0349],
  "spiti valley": [32.2461, 78.0349],
  "ladakh": [34.1526, 77.5771],
  "leh": [34.1526, 77.5771],
  "kerala": [10.8505, 76.2711],
  "manali": [32.2396, 77.1887],
  "mumbai": [19.0760, 72.8777],
  "delhi": [28.6139, 77.2090],
  "jaipur": [26.9124, 75.7873]
};





const DiscoveryMap = ({ trips }) => {
  const navigate = useNavigate();


  const plottableTrips = (trips || [])
  .map((trip) => {

    if (trip.destinationCoordinates?.lat && trip.destinationCoordinates?.lng) {
      return {
        ...trip,
        coords: [trip.destinationCoordinates.lat, trip.destinationCoordinates.lng]
      };
    }

    const destClean = trip.destination?.toLowerCase().trim();
    const matched = Object.keys(destinationCoordsMap).find((k) =>
    destClean.includes(k)
    );
    if (matched) {
      return {
        ...trip,
        coords: destinationCoordsMap[matched]
      };
    }
    return null;
  })
  .filter(Boolean);


  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 4.5;

  return (
    <div className="card p-5 bg-white border border-slate-100 relative overflow-hidden flex flex-col h-[360px] mb-6">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Expeditions Radar
            </h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              {plottableTrips.length} Active target pins plotted
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-50 text-brand-600 border border-brand-100">
          Interactive Map
        </span>
      </div>

      {}
      <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-100 relative z-10">
        <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={false}
        className="w-full h-full">

          <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />


          {plottableTrips.map((trip) =>
          <Marker key={trip._id} position={trip.coords} icon={markerIcon}>
              <Popup>
                <div className="p-2 text-center font-display text-[10px] min-w-[120px]">
                  <span className="font-black text-brand-600 uppercase tracking-widest block mb-1">
                    {trip.category || "Trip Group"}
                  </span>
                  <h4 className="font-extrabold text-slate-850 text-xs mb-2 leading-tight">
                    {trip.title}
                  </h4>
                  <button
                onClick={() => navigate(`/social/buddy/${trip._id}`)}
                className="w-full py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-colors shadow-xs">

                    Open Workspace
                  </button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>);

};

export default DiscoveryMap;