import React, { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { getJourneyLifecycle } from "../../utils/journeyLifecycle";
import { Shield, ShieldAlert, Users, CheckCircle, AlertTriangle, HeartHandshake, Navigation } from "lucide-react";
import SosConfirmModal from "../journey/SosConfirmModal";



const JOURNEY_MILESTONES = [
  "Started Journey",
  "Reached Destination",
  "Reached Accommodation",
  "Returning Home",
  "Reached Home Safely"
];

const SafetyWidget = ({ journey, user, onUserUpdate, onJourneyUpdate }) => {
  const [sosLoading, setSosLoading] = useState(false);
  const [safeLoading, setSafeLoading] = useState(false);
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [locationStr, setLocationStr] = useState("");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const lifecycle = getJourneyLifecycle(journey);
  const isOngoing = lifecycle.isOngoing;

  // Compute safety state from journey
  const safetyState = journey?.safetyState || (() => {
    const timeline = journey?.timeline || [];
    const milestoneEvents = timeline
      .filter((e) => e.eventType === "safe_checkin" && JOURNEY_MILESTONES.includes(e.checkInType))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const completed = [];
    milestoneEvents.forEach((ev) => {
      if (!completed.includes(ev.checkInType)) {
        completed.push(ev.checkInType);
      }
    });

    const nextIdx = completed.length;
    return {
      completedMilestones: completed,
      nextExpectedMilestone: nextIdx < JOURNEY_MILESTONES.length ? JOURNEY_MILESTONES[nextIdx] : null,
      isSafetyComplete: completed.length === JOURNEY_MILESTONES.length || lifecycle.isCompleted
    };
  })();

  const { completedMilestones = [], nextExpectedMilestone, isSafetyComplete } = safetyState;

  const handleToggleSOS = () => {
    setShowSosModal(true);
  };

  const handleConfirmSOS = async () => {
    const isActivating = !user?.sosActive;
    setSosLoading(true);
    try {
      const res = await axios.post("/emergency/sos");
      if (res.data.success) {
        showToast.success(
          isActivating
            ? "SOS Alert Sent! Emergency contacts notified."
            : "SOS Cancelled. Status updated to Safe."
        );
        setShowSosModal(false);
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


  // One-tap "I'm Safe" quick confirmation
  const handleQuickSafe = async () => {
    if (!journey) {
      showToast.error("No active journey available for check-in.");
      return;
    }

    const lc = getJourneyLifecycle(journey);
    if (!lc.isOngoing) {
      showToast.info("Safety actions are available when your journey starts.");
      return;
    }

    setSafeLoading(true);
    try {
      const res = await axios.post(`/journeys/${journey._id}/checkin`, {
        isQuickSafe: true,
        checkInType: "safe_confirmation",
        location: locationStr.trim() || journey.destination,
        message: "Quick safety confirmation via dashboard."
      });

      if (res.data.success) {
        showToast.success("You're marked safe.");
        setLocationStr("");
        if (onJourneyUpdate) onJourneyUpdate();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Safety confirmation failed.");
    } finally {
      setSafeLoading(false);
    }
  };

  // Sequential Milestone Check-In
  const handleMilestoneCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!journey) {
      showToast.error("No active journey available.");
      return;
    }

    const lc = getJourneyLifecycle(journey);
    if (!lc.isOngoing) {
      showToast.info("Safety actions are available when your journey starts.");
      return;
    }

    if (!nextExpectedMilestone) {
      showToast.error("All journey milestones completed.");
      return;
    }

    setMilestoneLoading(true);
    try {
      const res = await axios.post(`/journeys/${journey._id}/checkin`, {
        checkInType: nextExpectedMilestone,
        location: locationStr.trim() || journey.destination,
        message: `Milestone reached: ${nextExpectedMilestone}`
      });

      if (res.data.success) {
        showToast.success(`Checked In: ${nextExpectedMilestone}!`);
        setLocationStr("");
        setShowMilestoneForm(false);
        if (onJourneyUpdate) onJourneyUpdate();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Milestone check-in failed.");
    } finally {
      setMilestoneLoading(false);
    }
  };

  const sosActive = user?.sosActive;

  return (
    <div className="card p-6 bg-white border border-slate-100 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              sosActive ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
            }`}
          >
            {sosActive ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Journey Safety
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Smart Protection
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${
            sosActive
              ? "bg-red-50 text-red-600 border-red-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              sosActive ? "bg-red-500 animate-ping" : "bg-emerald-500"
            }`}
          />
          {sosActive ? "Emergency Alert" : "Verified Safe"}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
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
            Milestones
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-700">
              {completedMilestones.length} / {JOURNEY_MILESTONES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="space-y-3">
        {/* SOS Button */}
        <button
          onClick={handleToggleSOS}
          disabled={sosLoading}
          className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            sosActive
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10"
              : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10"
          }`}
        >
          {sosActive ? (
            <>
              <CheckCircle className="w-4 h-4" />
              I Am Safe (Cancel SOS)
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              Trigger Emergency SOS
            </>
          )}
        </button>

        {/* Quick Check-In Actions for Ongoing Journeys */}
        {isOngoing && !sosActive && (
          <div className="pt-3 border-t border-slate-100/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                Quick Actions
              </span>
              {nextExpectedMilestone && (
                <span className="text-[9px] font-bold text-[#7C3AED]">
                  Next: {nextExpectedMilestone}
                </span>
              )}
            </div>

            {/* Quick I'm Safe Button */}
            <button
              onClick={handleQuickSafe}
              disabled={safeLoading}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>{safeLoading ? "Confirming..." : "✓ I'm Safe"}</span>
            </button>

            {/* Milestone Check-In Form Toggle */}
            {!isSafetyComplete && nextExpectedMilestone && (
              <div>
                {!showMilestoneForm ? (
                  <button
                    onClick={() => setShowMilestoneForm(true)}
                    className="w-full py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-[#7C3AED] rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Check In: {nextExpectedMilestone}</span>
                  </button>
                ) : (
                  <form onSubmit={handleMilestoneCheckIn} className="space-y-2 pt-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Checkpoint Location (optional)"
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:border-[#7C3AED] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMilestoneForm(false)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={milestoneLoading}
                        className="flex-1 py-1.5 bg-[#7C3AED] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{milestoneLoading ? "Checking In..." : `✓ Check In: ${nextExpectedMilestone}`}</span>
                      </button>
                    </div>
                  </form>


                )}
              </div>
            )}
          </div>
        )}

        {!isOngoing && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-400 font-bold leading-normal m-0">
              Safe Check-Ins are active during ongoing journeys. Start your trip in the workspace to enable milestone tracking.
            </p>
          </div>
        )}
      </div>

      {/* Redesigned Emergency SOS Confirmation Modal */}
      <SosConfirmModal
        isOpen={showSosModal}
        isActivating={!user?.sosActive}
        onClose={() => setShowSosModal(false)}
        onConfirm={handleConfirmSOS}
        loading={sosLoading}
        journeyTitle={journey?.title || journey?.destination}
      />
    </div>
  );
};


export default SafetyWidget;