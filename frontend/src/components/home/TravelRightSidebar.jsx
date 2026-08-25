import React, { useState, useEffect } from "react";
import SafetyWidget from "./SafetyWidget";
import {
CloudSun,
Calendar,
Phone,
FileText,
Save,
Clock } from
"lucide-react";
import { showToast } from "../../utils/showToast";





const TravelRightSidebar = ({ journey, user, onUserUpdate, onJourneyUpdate }) => {
  const [note, setNote] = useState("");


  useEffect(() => {
    if (journey?._id) {
      const savedNote = localStorage.getItem(`trip_note_${journey._id}`);
      if (savedNote) setNote(savedNote);
    }
  }, [journey?._id]);

  const handleSaveNote = () => {
    if (journey?._id) {
      localStorage.setItem(`trip_note_${journey._id}`, note);
      showToast.success("Trip notes saved!");
    }
  };

  const getMockWeather = (destination) => {
    const dest = destination?.toLowerCase() || "";
    if (dest.includes("goa")) return { temp: "29°C", cond: "Tropical Humid", icon: "🌦️" };
    if (dest.includes("spiti") || dest.includes("kaza")) return { temp: "8°C", cond: "Dry Alpine Cold", icon: "❄️" };
    if (dest.includes("ladakh") || dest.includes("leh")) return { temp: "5°C", cond: "Clear Mountain Sky", icon: "🏔️" };
    if (dest.includes("kerala")) return { temp: "27°C", cond: "Warm Rain Showers", icon: "🌧️" };
    return { temp: "22°C", cond: "Clear Forecast", icon: "☀️" };
  };

  const weather = getMockWeather(journey?.destination);
  const isUpcoming = journey?.status === "Upcoming";
  const daysLeft = Math.ceil((new Date(journey?.startDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="w-full lg:w-[320px] space-y-6 shrink-0 select-none">
      
      {}
      <SafetyWidget
      journey={journey}
      user={user}
      onUserUpdate={onUserUpdate}
      onJourneyUpdate={onJourneyUpdate} />


      {}
      <div className="card p-5 bg-white border border-slate-100 rounded-[20px]">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
          <CloudSun className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Local Weather
          </h4>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-850 block">{weather.temp}</span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wide">
              {journey?.destination || "Destination"} Forecast
            </span>
            <span className="text-[11px] font-bold text-slate-650 mt-1 block">
              {weather.cond}
            </span>
          </div>
          <span className="text-4xl">{weather.icon}</span>
        </div>
      </div>

      {}
      {isUpcoming && daysLeft > 0 &&
      <div className="card p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[20px] shadow-md border-none">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-widest">
              Meetup Reminder
            </h4>
          </div>
          <p className="text-[11px] font-bold text-white/90 leading-relaxed mb-3">
            Your trip starts in <span className="font-extrabold text-white text-xs">{daysLeft} days</span>! Verify your checklist and coordinate with buddies.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Pre-trip check active</span>
          </div>
        </div>}


      {}
      <div className="card p-5 bg-white border border-slate-100 rounded-[20px]">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
          <Phone className="w-4 h-4 text-rose-500" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Emergency Contacts
          </h4>
        </div>
        
        {user?.emergencyContacts?.length > 0 ?
        <div className="space-y-3">
            {user.emergencyContacts.slice(0, 3).map((contact, idx) =>
          <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-slate-800 block">{contact.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    {contact.relation} {contact.isPrimary && "• Primary"}
                  </span>
                </div>
                <a
            href={`tel:${contact.phone}`}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors">

                  <Phone className="w-3 h-3" />
                </a>
              </div>
          )}
          </div> :

        <p className="text-[10px] text-slate-400 font-bold leading-normal">
            No emergency contacts registered. Please add contacts in the Safety Center.
          </p>}

      </div>

      {}
      <div className="card p-5 bg-white border border-slate-100 rounded-[20px] flex flex-col h-[200px]">
        <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Quick Notes
            </h4>
          </div>
          <button
          onClick={handleSaveNote}
          className="p-1 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-400 rounded-lg transition-all"
          title="Save trip notes">

            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Jot down permit info, stay address, or crew numbers..."
        className="w-full flex-1 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-150 focus:border-brand-500 focus:outline-none rounded-xl p-3 text-[11px] font-bold text-slate-650 resize-none leading-relaxed transition-all" />

      </div>

    </div>);

};

export default TravelRightSidebar;