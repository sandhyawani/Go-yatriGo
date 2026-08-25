import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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





const TravelMapCard = ({ journey }) => {
  const status = journey?.status || "None";


  const originCoords = [28.6139, 77.2090];


  const hasCoordinates =
  journey?.destinationCoordinates?.lat &&
  journey?.destinationCoordinates?.lng;
  const destinationCoords = [
  hasCoordinates ? journey.destinationCoordinates.lat : 32.2461,
  hasCoordinates ? journey.destinationCoordinates.lng : 78.0349];



  const routePath = [originCoords, destinationCoords];


  const getMapSettings = () => {
    switch (status) {
      case "Planning":
        return {
          center: destinationCoords,
          zoom: 8,
          description: `Destination Preview: ${journey?.destination || "Spiti Valley"}`
        };
      case "Upcoming":
        return {
          center: [
          (originCoords[0] + destinationCoords[0]) / 2,
          (originCoords[1] + destinationCoords[1]) / 2],

          zoom: 5,
          description: `Confirmed route: Origin ➔ ${journey?.destination || "Spiti"}`
        };
      case "Ongoing":
        return {
          center: destinationCoords,
          zoom: 7,
          description: `Active Transit: Approaching destination`
        };
      case "Completed":
        return {
          center: [
          (originCoords[0] + destinationCoords[0]) / 2,
          (originCoords[1] + destinationCoords[1]) / 2],

          zoom: 5,
          description: `Expedition complete: Path vector logged`
        };
      default:
        return {
          center: [20.5937, 78.9629],
          zoom: 4,
          description: "Global Explorer Radar"
        };
    }
  };

  const { center, zoom, description } = getMapSettings();

  return (
    <div className="card p-5 bg-white border border-slate-100 relative overflow-hidden flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Radar Footprint
            </h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              {description}
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
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full">

          <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />


          {}
          {status !== "None" ?
          <>
              {}
              {status !== "Planning" &&
            <Marker position={originCoords} icon={markerIcon}>
                  <Popup>
                    <div className="p-1 text-center font-display text-[10px]">
                      <span className="font-black text-slate-400 uppercase tracking-widest block">
                        Start Point
                      </span>
                      <span className="font-bold text-slate-700">Delhi, India</span>
                    </div>
                  </Popup>
                </Marker>}


              {}
              <Marker position={destinationCoords} icon={markerIcon}>
                <Popup>
                  <div className="p-1 text-center font-display text-[10px]">
                    <span className="font-black text-brand-600 uppercase tracking-widest block">
                      {status === "Ongoing" ? "Current target" : "Destination"}
                    </span>
                    <span className="font-bold text-slate-700">
                      {journey?.destination || "Spiti Valley, India"}
                    </span>
                  </div>
                </Popup>
              </Marker>

              {}
              {status !== "Planning" &&
            <Polyline
            positions={routePath}
            color="#7c3aed"
            weight={3}
            dashArray={status === "Upcoming" ? "5, 5" : undefined} />}


            </> :


          <Marker position={center} icon={markerIcon}>
              <Popup>
                <div className="p-1 text-center font-display text-[10px]">
                  <span className="font-black text-brand-600 uppercase tracking-widest block">
                    Explorer Center
                  </span>
                  <span className="font-bold text-slate-700">Go YatriGo Radar</span>
                </div>
              </Popup>
            </Marker>}

        </MapContainer>
      </div>
    </div>);

};

export default TravelMapCard;