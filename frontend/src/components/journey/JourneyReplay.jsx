import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
Camera,
MessageSquare,
DollarSign,
ShieldCheck,
CloudSun,
MapPin,
ChevronRight,
ChevronDown } from
"lucide-react";


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


  const stops = [
  {
    title: "Delhi Base Camp",
    coords: [28.6139, 77.2090],
    day: "Day 1",
    weather: { temp: "34°C", cond: "Warm & Dry" },
    expenses: [
    { label: "Pre-trip Grocery Stock", amt: "₹2,500", by: "Rahul" },
    { label: "Cab to Assembly Point", amt: "₹1,200", by: "Aditi" }],

    chat: [
    { user: "Rahul", text: "Got the permissions! Assembly at Delhi Central at 8:00 AM." },
    { user: "Aditi", text: "Permits are printed. Loaded inside folder." }],

    checkIn: "Started Journey - Base Camp cleared safely",
    photos: [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300"]

  },
  {
    title: "Manali Checkpoint",
    coords: [32.2396, 77.1887],
    day: "Day 2-3",
    weather: { temp: "14°C", cond: "Chilly Alpine Winds" },
    expenses: [
    { label: "Hotel Mountain View Stay", amt: "₹4,800", by: "Sneha" },
    { label: "Monastery Guided Permits", amt: "₹800", by: "Rahul" }],

    chat: [
    { user: "Sneha", text: "Reached hotel, temp is falling. Wear thermals!" },
    { user: "Guest Explorer", text: "Checked in safely. Oxygen levels are stable." }],

    checkIn: "Reached Destination - Safe check-in verified",
    photos: [
    "https://images.unsplash.com/photo-1544085311-11a028465b03?w=300",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300"]

  },
  {
    title: "Kaza Stopover",
    coords: [32.2276, 78.0773],
    day: "Day 4-5",
    weather: { temp: "8°C", cond: "Clear High Cold Desert" },
    expenses: [
    { label: "Local Homestay Split", amt: "₹3,500", by: "Amit" },
    { label: "Cab Fuel Refill", amt: "₹2,200", by: "Rahul" }],

    chat: [
    { user: "Rahul", text: "Refilled cab fuel. The roads ahead to Key are rocky but clear." },
    { user: "Amit", text: "Homestay has hot tea. Come inside." }],

    checkIn: "Reached Accommodation - Safe check-in logged",
    photos: [
    "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=300",
    "https://images.unsplash.com/photo-1548013146-72479768bada?w=300"]

  },
  {
    title: "Key Monastery Destination",
    coords: [32.2982, 78.0124],
    day: "Day 6",
    weather: { temp: "4°C", cond: "Alpine Snow Season" },
    expenses: [
    { label: "Monastery donation cap", amt: "₹1,000", by: "Guest Explorer" },
    { label: "Return Souvenirs", amt: "₹1,500", by: "Aditi" }],

    chat: [
    { user: "Guest Explorer", text: "We reached Key! The monastery looks absolutely majestic." },
    { user: "Sneha", text: "Setting up tripod for the sunset valley shoot." }],

    checkIn: "Reached Destination - Target objective complete",
    photos: [
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=300",
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=300"]

  }];


  const currentStop = stops[activeStopIdx] || stops[0];

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto px-4 font-sans antialiased">
      
      {}
      <div className="card p-5 bg-white border border-slate-100 rounded-3xl shrink-0">
        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Expedition Stepper
            </h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              Timeline playback controls
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-50 text-brand-600 border border-brand-100 animate-pulse">
            Active Replay
          </span>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        
        {}
        <div className="card p-4 bg-white border border-slate-100 rounded-3xl h-[360px] flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
              <MapPin className="w-4 h-4 text-brand-600 animate-bounce" />
              <span>Current Node: {currentStop.title}</span>
            </div>
            <span className="text-[9px] font-black uppercase bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
              {currentStop.day}
            </span>
          </div>
          
          <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-100 relative z-10">
            <MapContainer
            key={activeStopIdx}
            center={currentStop.coords}
            zoom={11}
            scrollWheelZoom={false}
            className="w-full h-full">

              <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <Marker position={currentStop.coords} icon={markerIcon}>
                <Popup>
                  <div className="p-1 text-center font-display text-[9px]">
                    <span className="font-black text-brand-600 uppercase tracking-widest block mb-0.5">
                      {currentStop.day} stop
                    </span>
                    <span className="font-bold text-slate-700">{currentStop.title}</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {}
        <div className="space-y-4">
          {stops.map((stop, sIdx) => {
            const isOpen = activeStopIdx === sIdx;
            return (
              <div
              key={sIdx}
              className={`card bg-white border rounded-[22px] transition-all duration-300 ${
              isOpen ?
              "border-brand-100 shadow-[0_8px_30px_-15px_rgba(139,92,246,0.15)]" :
              "border-slate-100 hover:border-slate-200"
              }`}>

                {}
                <button
                type="button"
                onClick={() => setActiveStopIdx(sIdx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between">

                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                    isOpen ?
                    "bg-brand-600 text-white" :
                    "bg-slate-50 border border-slate-150 text-slate-500"
                    }`}>
                      {sIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        {stop.title}
                        <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full lowercase tracking-normal">
                          {stop.day}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                        {stop.weather.temp} • {stop.weather.cond}
                      </p>
                    </div>
                  </div>
                  {isOpen ?
                  <ChevronDown className="w-5 h-5 text-brand-500" /> :

                  <ChevronRight className="w-5 h-5 text-slate-400" />}

                </button>

                {}
                {isOpen &&
                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-4">
                    
                    {}
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100/50 rounded-xl text-xs font-bold text-emerald-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Safety Lock: {stop.checkIn}</span>
                    </div>

                    {}
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-2">
                        📷 Expedition Photos
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {stop.photos.map((pic, pIdx) =>
                      <div key={pIdx} className="rounded-xl overflow-hidden h-28 border border-slate-100">
                            <img src={pic} className="w-full h-full object-cover hover:scale-102 transition-transform duration-300" alt="Expedition Log" />
                          </div>
                      )}
                      </div>
                    </div>

                    {}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {}
                      <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col h-[140px]">
                        <div className="flex items-center gap-1 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-wide">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Stop Expenses</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {stop.expenses.map((exp, eIdx) =>
                        <div key={eIdx} className="flex justify-between items-center text-[10px] font-bold text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-slate-800 block leading-tight">{exp.label}</span>
                                <span className="text-[8px] text-slate-400 block mt-0.5">Paid by {exp.by}</span>
                              </div>
                              <span className="font-black text-emerald-600 shrink-0">{exp.amt}</span>
                            </div>
                        )}
                        </div>
                      </div>

                      {}
                      <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-2xl flex flex-col h-[140px]">
                        <div className="flex items-center gap-1 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-wide">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                          <span>Squad Coordination</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {stop.chat.map((msg, cIdx) =>
                        <div key={cIdx} className="p-2 bg-white rounded-xl border border-slate-100 text-[9px] font-bold text-slate-600 leading-normal">
                              <span className="font-black text-slate-800 block mb-0.5">{msg.user}</span>
                              <span>{msg.text}</span>
                            </div>
                        )}
                        </div>
                      </div>

                    </div>

                  </div>}

              </div>);

          })}
        </div>

      </div>
    </div>);

};

export default JourneyReplay;