import React, { useState, useEffect } from "react";
import { ShieldCheck, Clock, Camera, Sparkles, Navigation, CheckCircle2, AlertCircle, MapPin, HeartHandshake, BellOff, Sun, ShieldAlert, ChevronDown } from "lucide-react";
import axiosInstance from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { getJourneyLifecycle } from "../../utils/journeyLifecycle";
import SosConfirmModal from "./SosConfirmModal";


const JOURNEY_MILESTONES = [
  "Started Journey",
  "Reached Destination",
  "Reached Accommodation",
  "Returning Home",
  "Reached Home Safely"
];

const JourneyTimelineView = ({
  journeyId,
  journey,
  timeline = [],
  journeyStatus,
  onTriggerCheckIn,
  onRefresh
}) => {
  const [localTimeline, setLocalTimeline] = useState(timeline);
  const [loadingSafe, setLoadingSafe] = useState(false);
  const [isEnjoyMode, setIsEnjoyMode] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const lifecycle = getJourneyLifecycle(journey);
  const isOngoing = lifecycle.isOngoing;

  const jId = journeyId || journey?._id;

  // Load Enjoy Mode and Snooze state from localStorage
  useEffect(() => {
    if (jId) {
      const savedEnjoy = localStorage.getItem(`journey_enjoy_mode_${jId}`);
      setIsEnjoyMode(savedEnjoy === "true");

      const savedSnooze = localStorage.getItem(`journey_snooze_${jId}`);
      if (savedSnooze) {
        const time = parseInt(savedSnooze, 10);
        if (time > Date.now()) {
          setSnoozeUntil(time);
        } else {
          localStorage.removeItem(`journey_snooze_${jId}`);
          setSnoozeUntil(null);
        }
      }
    }
  }, [jId]);

  // Keep local timeline synced with props or fetch if empty
  useEffect(() => {
    if (timeline && timeline.length > 0) {
      setLocalTimeline(timeline);
    } else if (jId) {
      axiosInstance
        .get(`/journeys/${jId}/timeline`)
        .then((res) => {
          if (res.data?.success && res.data.timeline) {
            setLocalTimeline(res.data.timeline);
          }
        })
        .catch((err) => console.error("Error fetching timeline:", err));
    }
  }, [timeline, jId]);

  // Compute safety state from journey prop or local timeline
  const safetyState = journey?.safetyState || (() => {
    const milestoneEvents = (localTimeline || [])
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

    const allCheckIns = (localTimeline || [])
      .filter((e) => e.eventType === "safe_checkin")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const last = allCheckIns[0]
      ? {
          id: allCheckIns[0]._id,
          type: allCheckIns[0].checkInType || "safe_confirmation",
          title: allCheckIns[0].title,
          time: allCheckIns[0].createdAt,
          location: allCheckIns[0].locationName || allCheckIns[0].location || "",
          userName: allCheckIns[0].userName,
          isQuickSafe: allCheckIns[0].checkInType === "safe_confirmation" || !allCheckIns[0].checkInType
        }
      : null;

    const nextIdx = completed.length;
    const nextExpected = nextIdx < JOURNEY_MILESTONES.length ? JOURNEY_MILESTONES[nextIdx] : null;

    const isSosActive = journey?.isEmergencyActive === true || journey?.safetyStatus === "SOS_ACTIVE" || timeline.some(e => e.eventType === "emergency_alert" && !e.isResolved);

    let sStatus = "SAFE";
    let sText = "Recently confirmed";
    let sColor = "emerald";

    if (isSosActive) {
      sStatus = "SOS_ACTIVE";
      sText = "SOS Active";
      sColor = "rose";
    } else if (lifecycle.isCancelled) {
      sStatus = "CANCELLED";
      sText = "Journey cancelled";
      sColor = "slate";
    } else if (lifecycle.isCompleted) {
      sStatus = "COMPLETED";
      sText = "Journey safely completed";
      sColor = "emerald";
    } else if (lifecycle.isOngoing) {
      if (last) {
        const hoursSince = (Date.now() - new Date(last.time).getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          sStatus = "CHECK_IN_OVERDUE";
          sText = "Check-in overdue";
          sColor = "orange";
        } else if (hoursSince > 12) {
          sStatus = "CHECK_IN_DUE";
          sText = "Check-in due";
          sColor = "amber";
        } else {
          sStatus = "SAFE";
          sText = "Recently confirmed";
          sColor = "emerald";
        }
      } else {
        const journeyStartTime = new Date(journey?.startDate || journey?.updatedAt || journey?.createdAt || Date.now()).getTime();
        const hoursSinceStart = (Date.now() - journeyStartTime) / (1000 * 60 * 60);
        if (hoursSinceStart > 24) {
          sStatus = "CHECK_IN_OVERDUE";
          sText = "Check-in overdue";
          sColor = "orange";
        } else {
          sStatus = "CHECK_IN_DUE";
          sText = "Check-in due";
          sColor = "amber";
        }
      }
    } else {
      // Upcoming / Planning (Pre-trip standby)
      sStatus = "PRE_TRIP_STANDBY";
      sText = "Pre-trip standby";
      sColor = "slate";
    }

    return {
      completedMilestones: completed,
      completedMilestoneDetails: details,
      nextExpectedMilestone: nextExpected,
      lastCheckIn: last,
      safetyStatus: sStatus,
      safetyStatusText: sText,
      safetyStatusColor: sColor,
      isSafetyComplete: completed.length === JOURNEY_MILESTONES.length || lifecycle.isCompleted,
      canCheckIn: lifecycle.isOngoing && completed.length < JOURNEY_MILESTONES.length
    };
  })();


  const {
    completedMilestones = [],
    nextExpectedMilestone,
    lastCheckIn,
    safetyStatus = "SAFE",
    safetyStatusText = "Recently confirmed",
    safetyStatusColor = "emerald",
    isSafetyComplete
  } = safetyState;

  // Toggle Enjoy Mode
  const handleToggleEnjoyMode = () => {
    if (!lifecycle.isOngoing) return;
    const nextVal = !isEnjoyMode;
    setIsEnjoyMode(nextVal);
    if (jId) {
      localStorage.setItem(`journey_enjoy_mode_${jId}`, String(nextVal));
    }
    if (nextVal) {
      showToast.success("🏖 Enjoy Mode activated. Routine safety reminders are paused.");
    } else {
      showToast.info("Enjoy Mode turned off. Safety reminders resumed.");
    }
  };

  // Snooze reminders
  const handleSnooze = (minutes) => {
    if (!lifecycle.isOngoing) return;
    const expiry = Date.now() + minutes * 60 * 1000;
    setSnoozeUntil(expiry);
    setShowSnoozeMenu(false);
    if (jId) {
      localStorage.setItem(`journey_snooze_${jId}`, String(expiry));
    }
    const readable =
      minutes >= 60 ? `${minutes / 60} hour${minutes > 60 ? "s" : ""}` : `${minutes} minutes`;
    showToast.info(`Reminders snoozed for ${readable}.`);
  };

  const handleCancelSnooze = () => {
    setSnoozeUntil(null);
    if (jId) {
      localStorage.removeItem(`journey_snooze_${jId}`);
    }
    showToast.info("Snooze cancelled.");
  };

  const isSnoozed = snoozeUntil && snoozeUntil > Date.now();

  // One-tap "I'm Safe" quick confirmation
  const handleQuickSafe = async () => {
    if (!jId) return;
    const lc = getJourneyLifecycle(journey);
    if (!lc.isOngoing) {
      showToast.info("Safety actions are available when your journey starts.");
      return;
    }
    setLoadingSafe(true);
    try {
      const res = await axiosInstance.post(`/journeys/${jId}/checkin`, {
        isQuickSafe: true,
        checkInType: "safe_confirmation",
        location: journey?.destination || "Current Location",
        message: "Marked safe via Journey Safety Hub."
      });

      if (res.data.success) {
        showToast.success("You're marked safe.");
        if (res.data.timelineEntry) {
          setLocalTimeline((prev) => [res.data.timelineEntry, ...prev]);
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Quick safe error:", err);
      showToast.error(err.response?.data?.message || "Failed to confirm safety");
    } finally {
      setLoadingSafe(false);
    }
  };

  // SOS Handler
  const handleToggleSOS = () => {
    setShowSosModal(true);
  };

  const handleConfirmSOS = async () => {
    const isActivating = !sosActive;
    setSosLoading(true);
    try {
      const res = await axiosInstance.post("/emergency/sos");
      if (res.data.success) {
        setSosActive(res.data.sosActive);
        showToast.success(
          isActivating
            ? "SOS Activated. Note: Please manually contact emergency services. In-app alerts do not dispatch external SMS/calls."
            : "SOS Cancelled. Status updated to Safe."
        );
        setShowSosModal(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast.error("Failed to update SOS status.");
    } finally {
      setSosLoading(false);
    }
  };


  const getEventIcon = (eventType, checkInType) => {
    if (eventType === "safe_checkin") {
      if (checkInType === "safe_confirmation" || !checkInType) {
        return (
          <div className="p-2.5 bg-emerald-500 text-white rounded-full shadow-md">
            <HeartHandshake className="w-4 h-4" />
          </div>
        );
      }
      return (
        <div className="p-2.5 bg-brand text-white rounded-full shadow-md">
          <ShieldCheck className="w-4 h-4" />
        </div>
      );
    }

    switch (eventType) {
      case "journey_started":
        return (
          <div className="p-2.5 bg-brand text-white rounded-full shadow-md">
            <Navigation className="w-4 h-4" />
          </div>
        );
      case "journey_completed":
        return (
          <div className="p-2.5 bg-emerald-600 text-white rounded-full shadow-md">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case "photo_uploaded":
      case "post_shared":
        return (
          <div className="p-2.5 bg-amber-500 text-white rounded-full shadow-md">
            <Camera className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-slate-700 text-white rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTime = (dt) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Quiet Advisory */}
      <div className="bg-background/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-4 h-4 shrink-0 ${lifecycle.isOngoing ? "text-emerald-500" : "text-text-muted"}`} />
          <p className="text-text-secondary m-0 font-medium">
            {lifecycle.isOngoing ? (
              <>
                <strong className="font-bold text-text-primary">Smart Safety Active:</strong> Quiet
                when everything is fine, visible when something needs attention.
              </>
            ) : lifecycle.isCompleted ? (
              <>
                <strong className="font-bold text-text-primary">Journey Concluded:</strong> Safety
                logs and verified history archived.
              </>
            ) : lifecycle.isCancelled ? (
              <>
                <strong className="font-bold text-text-primary">Journey Cancelled:</strong> Safety
                monitoring is inactive.
              </>
            ) : (
              <>
                <strong className="font-bold text-text-primary">Pre-trip standby:</strong> Live
                safety tracking starts when your journey begins.
              </>
            )}
          </p>
        </div>
        {lifecycle.isOngoing && (
          <button
            onClick={handleToggleEnjoyMode}
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all flex items-center gap-1.5 shrink-0 ${
              isEnjoyMode
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-text-primary border-slate-200 hover"
            }`}
            title="Pause routine safety reminders while enjoying your trip"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEnjoyMode ? "Enjoy Mode: ON" : "Enjoy Mode"}</span>
          </button>
        )}
      </div>

      {/* Enjoy Mode Active Banner */}
      {lifecycle.isOngoing && isEnjoyMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black m-0">🏖 Enjoy Mode is Active</h4>
              <p className="text-[11px] opacity-90 m-0 mt-0.5 font-medium">
                Routine safety reminders are paused. Manual check-ins, "I'm Safe", and Emergency SOS remain 100% active.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEnjoyMode}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shrink-0"
          >
            Resume Reminders
          </button>
        </div>
      )}

      {/* Snooze Active Banner */}
      {lifecycle.isOngoing && !isEnjoyMode && isSnoozed && (
        <div className="bg-primary-50 border border-primary-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-primary-900 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <BellOff className="w-4 h-4 text-brand shrink-0" />
            <span className="font-semibold">
              Safety reminders snoozed until {new Date(snoozeUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
            </span>
          </div>
          <button
            onClick={handleCancelSnooze}
            className="text-[11px] font-extrabold text-brand hover:underline shrink-0"
          >
            Cancel Snooze
          </button>
        </div>
      )}

      {/* Gentle Overdue / Check-In Due Banner */}
      {lifecycle.isOngoing && !isEnjoyMode && !isSnoozed && (safetyStatus === "CHECK_IN_DUE" || safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED") && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black m-0">
                {safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED" ? "🟠 Check-in overdue" : "🟡 Quick safety check"}
              </h4>
              <p className="text-[11px] opacity-90 m-0 mt-0.5 font-medium">
                {safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED"
                  ? "We haven't received a safety check-in recently. Check in when convenient."
                  : "Everything okay? Tap below when convenient to reassure your group."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleQuickSafe}
              disabled={loadingSafe}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              ✓ I'm Safe
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <span>Remind Me Later</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showSnoozeMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  <button
                    onClick={() => handleSnooze(30)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-background text-text-primary"
                  >
                    30 minutes
                  </button>
                  <button
                    onClick={() => handleSnooze(120)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-background text-text-primary"
                  >
                    2 hours
                  </button>
                  <button
                    onClick={() => handleSnooze(240)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-background text-text-primary"
                  >
                    4 hours
                  </button>
                  <button
                    onClick={() => handleSnooze(480)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-background text-text-primary"
                  >
                    Later today (8h)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Smart Safety Status Card */}
      <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/20 rounded-2xl border border-brand/40 text-brand">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                    !lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled
                      ? "bg-slate-700/60 text-slate-300 border-slate-600"
                      : safetyStatus === "SAFE" || safetyStatusColor === "emerald"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : safetyStatus === "CHECK_IN_DUE" || safetyStatusColor === "amber"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED" || safetyStatusColor === "orange"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : safetyStatus === "SOS_ACTIVE" || safetyStatusColor === "rose"
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled
                        ? "bg-slate-400"
                        : safetyStatus === "SAFE" || safetyStatusColor === "emerald"
                        ? "bg-emerald-400"
                        : safetyStatus === "CHECK_IN_DUE" || safetyStatusColor === "amber"
                        ? "bg-amber-400 animate-pulse"
                        : safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED" || safetyStatusColor === "orange"
                        ? "bg-orange-400 animate-pulse"
                        : safetyStatus === "SOS_ACTIVE" || safetyStatusColor === "rose"
                        ? "bg-rose-400 animate-ping"
                        : "bg-slate-400"
                    }`}
                  />
                  {!lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled
                    ? "⏳ PRE-TRIP STANDBY"
                    : safetyStatus === "SAFE"
                    ? "🟢 SAFE"
                    : safetyStatus === "CHECK_IN_DUE"
                    ? "🟡 CHECK-IN DUE"
                    : safetyStatus === "CHECK_IN_OVERDUE" || safetyStatus === "ATTENTION_NEEDED"
                    ? "🟠 CHECK-IN OVERDUE"
                    : safetyStatus === "SOS_ACTIVE"
                    ? "🔴 SOS ACTIVE"
                    : safetyStatus === "COMPLETED"
                    ? "✓ COMPLETED"
                    : safetyStatus === "CANCELLED"
                    ? "✖ CANCELLED"
                    : safetyStatus}
                </span>
                <span className="text-xs text-text-muted font-medium">({safetyStatusText})</span>
              </div>
              <h3 className="text-lg font-black text-white m-0 tracking-tight">
                🛡 Journey Safety & Status
              </h3>
            </div>
          </div>

          {/* Emergency SOS Button */}
          <button
            onClick={handleToggleSOS}
            disabled={sosLoading}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
              sosActive
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                : "bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/20"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosActive ? "I Am Safe (Cancel SOS)" : "🆘 Emergency SOS"}</span>
          </button>
        </div>

        {/* State Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 border-t border-slate-800/80">
          {/* Last Check-In */}
          <div className="bg-brand/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              Last Check-In
            </span>
            {lastCheckIn ? (
              <div>
                <p className="text-xs font-bold text-slate-100 m-0 truncate flex items-center gap-1.5">
                  {lastCheckIn.isQuickSafe ? (
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                  )}
                  <span className="truncate">{lastCheckIn.title}</span>
                </p>
                <span className="text-[10px] text-text-muted font-medium block mt-0.5">
                  {formatTime(lastCheckIn.time)} {lastCheckIn.location ? `• ${lastCheckIn.location}` : ""}
                </span>
              </div>
            ) : (
              <p className="text-xs font-bold text-text-muted m-0">No check-in recorded yet</p>
            )}
          </div>

          {/* Next Expected Milestone */}
          <div className="bg-brand/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              NEXT EXPECTED MILESTONE
            </span>
            {!lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled ? (
              <div>
                <p className="text-xs font-bold text-primary-300 m-0 truncate flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">Started Journey</span>
                </p>
                <span className="text-[10px] text-text-muted font-medium block mt-0.5">
                  Step 1 of {JOURNEY_MILESTONES.length} (Pre-trip Standby)
                </span>
              </div>
            ) : nextExpectedMilestone ? (
              <div>
                <p className="text-xs font-bold text-primary-300 m-0 truncate flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span className="truncate">{nextExpectedMilestone}</span>
                </p>
                <span className="text-[10px] text-text-muted font-medium block mt-0.5">
                  Step {completedMilestones.length + 1} of {JOURNEY_MILESTONES.length}
                </span>
              </div>
            ) : (
              <p className="text-xs font-bold text-emerald-400 m-0 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Milestones Completed
              </p>
            )}
          </div>

          {/* Active Protection / Status */}
          <div className="bg-brand/80 p-3.5 rounded-2xl border border-slate-800 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              Safety Signal Mode
            </span>
            <p className="text-xs font-bold text-slate-200 m-0 flex items-center gap-1.5">
              {!lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-text-muted" /> Pre-Trip Standby
                </>
              ) : isEnjoyMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Enjoy Mode Active
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Smart Check-Ins Active
                </>
              )}
            </p>
            <span className="text-[10px] text-text-muted font-medium block mt-0.5">
              {!lifecycle.isOngoing && !lifecycle.isCompleted && !lifecycle.isCancelled
                ? "Live safety tracking starts when your journey begins"
                : isEnjoyMode
                ? "Routine reminders paused"
                : "Milestone & safety monitoring"}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        {lifecycle.isOngoing ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {/* Quick "I'm Safe" */}
            <button
              onClick={handleQuickSafe}
              disabled={loadingSafe}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loadingSafe ? "Confirming Safe..." : "✓ I'm Safe"}</span>
            </button>

            {/* Open Milestone Check-In Modal */}
            {onTriggerCheckIn && (
              <button
                onClick={onTriggerCheckIn}
                disabled={isSafetyComplete}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-extrabold shadow-md shadow-brand/25 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSafetyComplete ? "Milestones Complete" : `🛡 Check In: ${nextExpectedMilestone || "Milestone"}`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="pt-2">
            <div className="w-full py-3 px-4 rounded-xl bg-brand/60 border border-slate-800 text-center text-xs font-semibold text-text-muted">
              {!lifecycle.isCompleted && !lifecycle.isCancelled
                ? "Pre-trip standby — live safety tracking starts when your journey begins."
                : lifecycle.isCompleted
                ? "Journey completed — safety logs and timeline history archived."
                : "Journey cancelled — safety tracking inactive."}
            </div>
          </div>
        )}
      </div>

      {/* Chronological Timeline Feed */}

      <div className="bg-white p-4 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
              Safety Timeline & Verified Logs
            </h4>
          </div>
          <span className="text-[11px] font-bold text-text-muted">
            {localTimeline.length} {localTimeline.length === 1 ? "Event" : "Events"}
          </span>
        </div>

        {localTimeline.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-text-primary">
              No timeline activity logged yet.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Submit a safe check-in or quick safety confirmation to update your status.
            </p>
          </div>

        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 space-y-5 my-2">
            {localTimeline.map((item) => {
              const isMilestone = JOURNEY_MILESTONES.includes(item.checkInType);
              const isQuickConfirmation = item.eventType === "safe_checkin" && !isMilestone;

              return (
                <div key={item._id} className="relative group">
                  {/* Event Icon on Line */}
                  <div className="absolute -left-[35px] sm:-left-[43px] top-0 ring-4 ring-white transition-transform group-hover:scale-110">
                    {getEventIcon(item.eventType, item.checkInType)}
                  </div>

                  {/* Card Content */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-text-primary">
                          {item.title}
                        </span>
                        {isMilestone && (
                          <span className="px-2 py-0.5 rounded-md bg-primary-100 text-brand text-[10px] font-black tracking-wide">
                            📍 Milestone
                          </span>
                        )}
                        {isQuickConfirmation && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black tracking-wide">
                            🛡️ Safety Confirmation
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium shrink-0">
                        <Clock className="w-3 h-3 text-brand" /> {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-1 font-medium">
                      {item.description}
                    </p>

                    {item.locationName && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted mt-1">
                        <MapPin className="w-3 h-3 text-brand" />
                        <span>{item.locationName}</span>
                      </div>
                    )}

                    {item.mediaUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden w-full bg-black/5">
                        <img
                          src={item.mediaUrl}
                          alt="Timeline Capture"
                          className="w-full object-cover max-h-60"
                        />
                      </div>
                    )}

                    {item.userName && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center gap-2">
                        <img
                          src={
                            item.userPic ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}&background=random`
                          }
                          alt={item.userName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-[11px] font-semibold text-text-muted">
                          Logged by {item.userName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redesigned Emergency SOS Confirmation Modal */}
      <SosConfirmModal
        isOpen={showSosModal}
        isActivating={!sosActive}
        onClose={() => setShowSosModal(false)}
        onConfirm={handleConfirmSOS}
        loading={sosLoading}
        journeyTitle={journey?.title || journey?.destination}
      />
    </div>
  );
};


export default JourneyTimelineView;