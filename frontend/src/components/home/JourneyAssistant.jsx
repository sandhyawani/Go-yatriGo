import React, { useState, useEffect } from "react";
import SafetyWidget from "./SafetyWidget";
import { CloudSun, Phone, FileText, Save, ShieldCheck, Compass } from "lucide-react";
import { showToast } from "../../utils/showToast";

const JourneyAssistant = ({ journey, user, onUserUpdate, onJourneyUpdate }) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    const key = journey?._id ? `trip_note_${journey._id}` : "general_travel_notes";
    const savedNote = localStorage.getItem(key);
    if (savedNote) {
      setNote(savedNote);
    } else {
      setNote("");
    }
  }, [journey?._id]);

  const handleSaveNote = () => {
    const key = journey?._id ? `trip_note_${journey._id}` : "general_travel_notes";
    localStorage.setItem(key, note);
    showToast.success("Travel notes saved!");
  };

  const getMockWeather = (destination) => {
    const dest = destination?.toLowerCase() || "";
    if (dest.includes("goa")) return { temp: "29°C", cond: "Tropical Humid", icon: "🌦️" };
    if (dest.includes("spiti") || dest.includes("kaza")) return { temp: "8°C", cond: "Dry Alpine Cold", icon: "❄️" };
    if (dest.includes("ladakh") || dest.includes("leh")) return { temp: "5°C", cond: "Clear Mountain Sky", icon: "🏔️" };
    if (dest.includes("kerala")) return { temp: "27°C", cond: "Warm Rain Showers", icon: "🌧️" };
    return { temp: "22°C", cond: "Pleasant & Clear", icon: "☀️" };
  };

  const weather = getMockWeather(journey?.destination);
  const isUpcoming = journey?.status === "Upcoming" || journey?.status === "Planning";
  const daysLeft = journey?.startDate ?
  Math.ceil((new Date(journey.startDate) - new Date()) / (1000 * 60 * 60 * 24)) :
  0;


  const getReminders = () => {
    if (!journey) {
      return [
      { text: "Update travel style preferences in profile.", type: "system" },
      { text: "Verify emergency contacts are correct.", type: "safety" },
      { text: "Discover and save matching journeys.", type: "explore" }];

    }
    if (journey.status === "Planning") {
      return [
      { text: "Finalize budget limits with travel group.", type: "budget" },
      { text: "Complete gear packing checklist.", type: "checklist" },
      { text: "Send hello message in workspace chat.", type: "chat" }];

    }
    if (journey.status === "Ongoing") {
      return [
      { text: "Mark safe check-in at destination.", type: "safety" },
      { text: "Track split expenses during travel.", type: "budget" },
      { text: "Keep local guides phone numbers handy.", type: "emergency" }];

    }
    return [
    { text: "Review and rate your journey buddies.", type: "feedback" },
    { text: "Share travel memories and safety logs.", type: "explore" }];

  };

  const reminders = getReminders();


  if (!journey) {
    return (
      <div className="w-full lg:w-[320px] space-y-6 shrink-0 select-none animate-fade-in">
        {}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-[24px] shadow-md relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
            <Compass className="w-32 h-32 text-white" />
          </div>
          <span className="text-[9px] text-brand-300 font-bold uppercase tracking-widest block">Travel Inspiration</span>
          <h3 className="text-base font-extrabold mt-1 text-white">Adventure Awaits</h3>
          <p className="text-[11px] text-slate-350 font-medium mt-2 leading-relaxed">
            "Jobs fill your pockets, but adventures fill your soul." Join a travel group or create a new expedition to start planning.
          </p>
        </div>

        {}
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
            <Compass className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Trending Now</h4>
          </div>
          <div className="space-y-3">
            {[
            { name: "Spiti Valley", region: "Himachal Pradesh", squads: "12 Travel Groups active" },
            { name: "Gokarna Beaches", region: "Karnataka", squads: "8 Travel Groups active" },
            { name: "Leh Ladakh Pass", region: "Jammu & Kashmir", squads: "15 Travel Groups active" }]
            .map((item, idx) =>
            <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-slate-850 block">{item.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{item.region}</span>
                </div>
                <span className="text-[9px] bg-brand-50 border border-brand-100 text-brand-700 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                  {item.squads}
                </span>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
            <FileText className="w-4 h-4 text-amber-500 animate-pulse" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pro Travel Tip</h4>
          </div>
          <p className="text-xs font-semibold text-slate-655 leading-relaxed">
            Always upload a copy of your entry permits, maps, and photo ID to your online Go YatriGo **Passport** before launching into remote zones with zero connectivity.
          </p>
        </div>
      </div>);

  }

  return (
    <div className="w-full lg:w-[320px] space-y-6 shrink-0 select-none animate-fade-in">
      
      {}
      <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">🛡 Safety Center</h4>
        </div>

        {}
        <SafetyWidget
        journey={journey}
        user={user}
        onUserUpdate={onUserUpdate}
        onJourneyUpdate={onJourneyUpdate} />


        {}
        <div className="pt-2 border-t border-slate-50">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-2">Emergency Contacts</span>
          {user?.emergencyContacts?.length > 0 ?
          <div className="space-y-3">
              {user.emergencyContacts.slice(0, 2).map((contact, idx) =>
            <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block">{contact.name}</span>
                    <span className="text-[9px] text-slate-450 font-semibold block">{contact.relation}</span>
                  </div>
                  <a
              href={`tel:${contact.phone}`}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors">

                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
            )}
            </div> :

          <p className="text-[9px] text-slate-400 font-bold leading-normal">
              No emergency contacts registered. Please add contacts in your profile.
            </p>}

        </div>
      </div>

      {}
      <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <CloudSun className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">🌤 Travel Assistant</h4>
        </div>

        {}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-850 block">{weather.temp}</span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wide">
              {journey.destination} Forecast
            </span>
            <span className="text-[11px] font-bold text-brand-655 mt-1 block">
              {weather.cond}
            </span>
          </div>
          <span className="text-4xl">{weather.icon}</span>
        </div>

        {}
        {isUpcoming && daysLeft > 0 &&
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-2xl shadow-xs relative overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-widest block text-brand-200">Countdown</span>
            <span className="text-sm font-extrabold block mt-1">{daysLeft} Days to Departure</span>
          </div>}


        {}
        <div className="pt-2 border-t border-slate-50 flex flex-col h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Notepad</span>
            <button
            onClick={handleSaveNote}
            className="p-1 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-400 rounded-lg transition-all"
            title="Save travel notes">

              <Save className="w-3 h-3" />
            </button>
          </div>
          <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Jot down permit details, checkpoints, flight notes..."
          className="w-full flex-1 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-150 focus:border-brand-400 focus:outline-none rounded-xl p-2.5 text-[11px] font-bold text-slate-650 resize-none leading-relaxed transition-all" />

        </div>
      </div>

      {}
      <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <FileText className="w-4 h-4 text-amber-500 animate-pulse" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">📋 Planner</h4>
        </div>

        <div className="space-y-3">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Today's Reminders</span>
          {reminders.map((rem, idx) =>
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
              <span className="font-semibold leading-tight">{rem.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>);

};

export default JourneyAssistant;