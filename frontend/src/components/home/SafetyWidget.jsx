import React, { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import {
Shield,
ShieldAlert,
Users,
CheckCircle,
Clock,
AlertTriangle,
ChevronDown } from
"lucide-react";
import Swal from "sweetalert2";





const SafetyWidget = ({ journey, user, onUserUpdate, onJourneyUpdate }) => {
  const [sosLoading, setSosLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInType, setCheckInType] = useState("Reached Destination");
  const [locationStr, setLocationStr] = useState("");
  const [showCheckInDropdown, setShowCheckInDropdown] = useState(false);

  const checkInOptions = [
  "Started Journey",
  "Reached Destination",
  "Reached Accommodation",
  "Returning Home",
  "Reached Home Safely"];



  const handleToggleSOS = async () => {
    const isActivating = !user?.sosActive;

    const confirmResult = await Swal.fire({
      title: isActivating ? "⚠️ TRIGGER EMERGENCY SOS?" : "Cancel Emergency SOS?",
      text: isActivating ?
      "This will broadcast an emergency alert to all registered emergency contacts immediately." :
      "Confirm that you are safe and want to cancel the emergency broadcast.",
      icon: isActivating ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: isActivating ? "#ef4444" : "#7c3aed",
      confirmButtonText: isActivating ? "YES, TRIGGER SOS" : "Yes, I am safe",
      cancelButtonText: "Cancel",
      customClass: { popup: "rounded-[1.5rem]" }
    });

    if (!confirmResult.isConfirmed) return;

    setSosLoading(true);
    try {
      const res = await axios.post("/emergency/sos");
      if (res.data.success) {
        showToast.success(
        isActivating ?
        "SOS Alert Broadcasted! Emergency contacts notified." :
        "SOS Cancelled. Status updated to Safe."
        );
        if (onUserUpdate) {
          onUserUpdate({ ...user, sosActive: res.data.sosActive });
        }
      }
    } catch (err) {
      showToast.error("Failed to update SOS status.");
    } finally {
      setSosLoading(false);
    }
  };


  const handleSafeCheckIn = async () => {
    if (!journey) {
      showToast.error("No active journey available for check-in.");
      return;
    }

    setCheckInLoading(true);
    try {
      const res = await axios.post(`/journeys/${journey._id}/checkin`, {
        checkInType,
        location: locationStr || journey.destination,
        message: "Status verified safe via explorer dashboard."
      });

      if (res.data.success) {
        showToast.success(`Checked In: ${checkInType}!`);
        setLocationStr("");
        if (onJourneyUpdate) {

          onJourneyUpdate();
        }
      }
    } catch (err) {
      showToast.error("Check-in registration failed.");
    } finally {
      setCheckInLoading(false);
    }
  };

  const isOngoing = journey?.status === "Ongoing";
  const sosActive = user?.sosActive;

  return (
    <div className="card p-6 bg-white border border-slate-100 relative overflow-hidden">
      {}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${sosActive ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
            {sosActive ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Journey Health
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Security Guard
            </span>
          </div>
        </div>

        {}
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${
        sosActive ?
        "bg-red-50 text-red-600 border-red-100" :
        "bg-emerald-50 text-emerald-600 border-emerald-100"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sosActive ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
          {sosActive ? "Emergency Alert" : "Verified Safe"}
        </span>
      </div>

      {}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest mb-1">
            Contacts
          </span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-black text-slate-700">
              {user?.emergencyContacts?.length || 0} Registered
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest mb-1">
            Safety Signals
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-700">
              {journey?.stats?.checkInsCount || 0} Saved
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="space-y-4">
        <button
        onClick={handleToggleSOS}
        disabled={sosLoading}
        className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
        sosActive ?
        "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10" :
        "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10"
        }`}>

          {sosActive ?
          <>
              <CheckCircle className="w-4 h-4" />
              I Am Safe (Cancel SOS)
            </> :

          <>
              <ShieldAlert className="w-4 h-4" />
              Trigger Emergency SOS
            </>}

        </button>

        {}
        {isOngoing && !sosActive &&
        <div className="pt-4 border-t border-slate-100/50 space-y-3">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
              Quick Safe Check-In
            </span>

            <div className="relative">
              <button
            type="button"
            onClick={() => setShowCheckInDropdown(!showCheckInDropdown)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-black text-slate-700 flex items-center justify-between">

                <span>{checkInType}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showCheckInDropdown &&
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {checkInOptions.map((opt, idx) =>
              <button
              key={idx}
              type="button"
              onClick={() => {
                setCheckInType(opt);
                setShowCheckInDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">

                      {opt}
                    </button>
              )}
                </div>}

            </div>

            <input
          type="text"
          placeholder="Current location (e.g. Rohtang Pass)"
          value={locationStr}
          onChange={(e) => setLocationStr(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:border-brand-500 focus:outline-none" />


            <button
          onClick={handleSafeCheckIn}
          disabled={checkInLoading}
          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">

              <CheckCircle className="w-4 h-4" />
              Register Check-in
            </button>
          </div>}


        {!isOngoing &&
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-400 font-bold leading-normal">
              Safe Check-Ins are only active during ongoing trips. Start your journey in the workspace to enable tracking.
            </p>
          </div>}

      </div>
    </div>);

};

export default SafetyWidget;