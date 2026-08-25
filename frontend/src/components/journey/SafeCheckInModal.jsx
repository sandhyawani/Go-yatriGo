import React, { useState, useEffect } from "react";
import { ShieldCheck, MapPin, MessageSquare, X, CheckCircle, Lock, ArrowRight, Sparkles, HeartHandshake } from "lucide-react";
import axiosInstance from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { getJourneyLifecycle } from "../../utils/journeyLifecycle";

const JOURNEY_MILESTONES = [
  "Started Journey",
  "Reached Destination",
  "Reached Accommodation",
  "Returning Home",
  "Reached Home Safely"
];

const SafeCheckInModal = ({ journey, isOpen, onClose, onSuccess, onCheckedIn, initialMode = "milestone" }) => {
  const [activeTab, setActiveTab] = useState(initialMode); // "milestone" | "quick_safe"
  const [location, setLocation] = useState(journey?.destination || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const lifecycle = getJourneyLifecycle(journey);

  // Compute safety state from journey prop or fallback timeline
  const safetyState = journey?.safetyState || (() => {
    const timeline = journey?.timeline || [];
    const milestoneEvents = timeline
      .filter((e) => e.eventType === "safe_checkin" && JOURNEY_MILESTONES.includes(e.checkInType))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const completed = [];
    const details = {};
    milestoneEvents.forEach((ev) => {
      if (!completed.includes(ev.checkInType)) {
        completed.push(ev.checkInType);
        details[ev.checkInType] = {
          time: ev.createdAt,
          location: ev.locationName || ev.location || "",
          userName: ev.userName
        };
      }
    });

    const nextIdx = completed.length;
    return {
      completedMilestones: completed,
      completedMilestoneDetails: details,
      nextExpectedMilestone: nextIdx < JOURNEY_MILESTONES.length ? JOURNEY_MILESTONES[nextIdx] : null,
      isSafetyComplete: completed.length === JOURNEY_MILESTONES.length || journey?.status === "Completed",
      canCheckIn: lifecycle.isOngoing && completed.length < JOURNEY_MILESTONES.length
    };
  })();

  const { completedMilestones = [], completedMilestoneDetails = {}, nextExpectedMilestone, isSafetyComplete } = safetyState;

  useEffect(() => {
    if (isOpen) {
      setLocation(journey?.destination || "");
      setMessage("");
      setActiveTab(initialMode);
    }
  }, [isOpen, journey?.destination, initialMode]);

  if (!isOpen || !journey) return null;

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    const lc = getJourneyLifecycle(journey);
    if (!lc.isOngoing) {
      showToast.info("Safety actions are available when your journey starts.");
      if (onClose) onClose();
      return;
    }

    if (!nextExpectedMilestone) {
      showToast.error("All journey milestones have already been completed.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/checkin`, {
        checkInType: nextExpectedMilestone,
        location: location.trim() || journey.destination,
        message: message.trim()
      });

      if (res.data.success) {
        showToast.success(res.data.message || `Checked in: ${nextExpectedMilestone}!`);
        if (onSuccess) onSuccess(res.data.timelineEntry || res.data.checkIn);
        if (onCheckedIn) onCheckedIn(res.data);
        onClose();
      }
    } catch (err) {
      console.error("Safe check-in error:", err);
      showToast.error(err.response?.data?.message || "Failed to record check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSafeConfirm = async (e) => {
    if (e) e.preventDefault();
    const lc = getJourneyLifecycle(journey);
    if (!lc.isOngoing) {
      showToast.info("Safety actions are available when your journey starts.");
      if (onClose) onClose();
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/checkin`, {
        isQuickSafe: true,
        checkInType: "safe_confirmation",
        location: location.trim() || journey.destination,
        message: message.trim() || "Marked safe via quick check-in."
      });

      if (res.data.success) {
        showToast.success("You're marked safe.");
        if (onSuccess) onSuccess(res.data.timelineEntry || res.data.checkIn);
        if (onCheckedIn) onCheckedIn(res.data);
        onClose();
      }
    } catch (err) {
      console.error("Quick safe error:", err);
      showToast.error(err.response?.data?.message || "Failed to confirm safety");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#7C3AED] rounded-2xl shadow-md shadow-[#7C3AED]/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Journey Safety Check-In
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Auto-syncs status with travel group & trusted contacts
              </p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mt-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("milestone")}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "milestone"
                  ? "bg-white dark:bg-slate-900 text-[#7C3AED] shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Journey Milestones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quick_safe")}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "quick_safe"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Quick "I'm Safe"</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === "milestone" ? (
          <form onSubmit={handleSubmitMilestone} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Sequential State Machine Progression */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Journey Progression
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {completedMilestones.length} of {JOURNEY_MILESTONES.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {JOURNEY_MILESTONES.map((milestone, idx) => {
                  const isCompleted = completedMilestones.includes(milestone);
                  const isNext = milestone === nextExpectedMilestone;
                  const isFuture = !isCompleted && !isNext;
                  const detail = completedMilestoneDetails[milestone];

                  return (
                    <div
                      key={milestone}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-700 dark:text-slate-300"
                          : isNext
                          ? "bg-[#7C3AED]/5 dark:bg-[#7C3AED]/15 border-[#7C3AED] ring-2 ring-[#7C3AED]/20 text-slate-900 dark:text-white shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-xs"
                              : isNext
                              ? "bg-[#7C3AED] text-white shadow-xs animate-pulse"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : isNext ? (idx + 1) : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-bold truncate block ${
                              isCompleted
                                ? "text-emerald-900 dark:text-emerald-300"
                                : isNext
                                ? "text-[#7C3AED] dark:text-purple-300 font-extrabold"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {milestone}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                            {isCompleted
                              ? `Checked in ${detail?.time ? formatTime(detail.time) : ""}`
                              : isNext
                              ? "Next check-in action"
                              : "Upcoming milestone"}
                          </span>
                        </div>
                      </div>

                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                          Done
                        </span>
                      )}
                      {isNext && (
                        <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/15 text-[#7C3AED] dark:text-purple-300 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> Next
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 shrink-0">
                          Locked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {isSafetyComplete ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                <span className="text-xl">🎉</span>
                <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  All Milestones Completed
                </h4>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Your journey has safely reached home.
                </p>
              </div>
            ) : (
              <>
                {/* Location Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-[#7C3AED]" /> Checkpoint Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune Highway / Hotel Grand"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none"
                  />
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1 text-[#7C3AED]" /> Optional note
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a short note about your check-in..."
                    rows="2"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#7C3AED] outline-none resize-none"
                  />
                </div>
              </>
            )}

            {/* Bottom Action Layout: [ Close ] [ ✓ Check In: {nextExpectedMilestone} ] */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              {!isSafetyComplete && nextExpectedMilestone && (
                <button
                  type="submit"
                  disabled={loading || !lifecycle.isOngoing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#7C3AED]/25 transition-all active:scale-[0.98] disabled:opacity-50 min-w-0"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {loading ? "Checking In..." : `Check In: ${nextExpectedMilestone}`}
                  </span>
                </button>
              )}
            </div>
          </form>


        ) : (
          <form onSubmit={handleQuickSafeConfirm} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  Quick Safety Confirmation
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed mt-0.5">
                  Reassure your travel group & trusted contacts that you are safe right now without advancing or skipping your journey milestones.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-emerald-500" /> Current Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Current Location / Hotel Lobby"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1 text-emerald-500" /> Quick Reassurance Note (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. All good here, grabbing dinner with the squad!"
                rows="3"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !lifecycle.isOngoing}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] disabled:opacity-50 min-w-0"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {loading ? "Confirming..." : "Confirm I'm Safe"}
                </span>
              </button>
            </div>
          </form>

        )}
      </div>
    </div>
  );
};

export default SafeCheckInModal;