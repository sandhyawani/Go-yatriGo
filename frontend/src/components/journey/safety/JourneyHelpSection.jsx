import React, { useState } from "react";
import { ShieldAlert, Users, AlertTriangle, LifeBuoy, PhoneCall, HelpCircle, Lock } from "lucide-react";
import { getJourneyLifecycle } from "../../../utils/journeyLifecycle";
import TrustedContactsQuickModal from "./TrustedContactsQuickModal";
import ReportProblemQuickModal from "./ReportProblemQuickModal";

const JourneyHelpSection = ({
  journey = {},
  sosActive = false,
  onTriggerSos,
  sosLoading = false
}) => {
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const lifecycle = getJourneyLifecycle(journey);
  const isOngoing = lifecycle.isOngoing;
  const isUpcoming = lifecycle.isPlanning || lifecycle.isUpcoming;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <LifeBuoy className="w-4 h-4 text-text-muted " />
        <h3 className="text-xs font-black text-text-primary uppercase tracking-wider m-0">
          Need Help?
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div
          className={`p-4 sm:p-5 rounded-[var(--radius-card)] border flex flex-col justify-between gap-3 transition-all ${
            sosActive
              ? "bg-rose-100/80 border-rose-300 shadow-sm shadow-rose-500/10"
              : isOngoing
              ? "bg-rose-50/70 border-rose-200/80 hover:border-rose-300 shadow-xs"
              : "bg-slate-50 border-slate-200/70 shadow-xs"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-[var(--radius-card)] shrink-0 shadow-sm ${
                isOngoing
                  ? "bg-rose-600 text-white shadow-rose-600/30"
                  : "bg-slate-200 text-text-muted "
              }`}
            >
              {isOngoing ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span
                className={`text-[9px] font-black uppercase tracking-wider block mb-0.5 ${
                  isOngoing ? "text-rose-600 " : "text-text-muted "
                }`}
              >
                {isOngoing ? "Highest Urgency" : isUpcoming ? "Activates On Departure" : "Trip Concluded"}
              </span>
              <h4
                className={`text-sm font-black m-0 truncate ${
                  isOngoing ? "text-rose-950 " : "text-text-primary "
                }`}
              >
                Emergency SOS
              </h4>
              <p className="text-xs text-text-muted font-medium mt-1 leading-snug m-0">
                {isOngoing
                  ? "Immediate safety emergency. Broadcasts an in-app alert to your travel group."
                  : isUpcoming
                  ? "Live emergency broadcasts unlock automatically once your journey starts."
                  : "Emergency monitoring ended with the conclusion of this journey."}
              </p>
            </div>
          </div>

          {isOngoing ? (
            <button
              onClick={onTriggerSos}
              disabled={sosLoading}
              className={`w-full py-3 px-4 rounded-[var(--radius-card)] font-black text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm ${
                sosActive
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{sosActive ? "I Am Safe (Cancel SOS)" : "🆘 Emergency SOS"}</span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-3 rounded-[var(--radius-card)] bg-slate-200/70 text-text-muted text-[11px] font-bold text-center border border-slate-300/40 ">
              {isUpcoming ? "Standby until trip starts" : "Inactive (Trip Completed)"}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-white border border-slate-200 hover  shadow-xs flex flex-col justify-between gap-3 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-[var(--radius-card)] bg-brand-50 text-brand border border-brand-200/60 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand block mb-0.5">
                Personal Support
              </span>
              <h4 className="text-sm font-black text-text-primary m-0 truncate">
                Contact Trusted Person
              </h4>
              <p className="text-xs text-text-muted font-medium mt-1 leading-snug m-0">
                Directly call or message someone you trust or your registered emergency contacts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowContactsModal(true)}
            className="w-full py-3 px-4 rounded-[var(--radius-card)] bg-background hover  text-text-primary font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-slate-200/60 "
          >
            <PhoneCall className="w-3.5 h-3.5 text-brand" />
            <span>View & Call Contacts</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 rounded-[var(--radius-card)] bg-white border border-slate-200 hover  shadow-xs flex flex-col justify-between gap-3 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-[var(--radius-card)] bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">
                Assistance & Issues
              </span>
              <h4 className="text-sm font-black text-text-primary m-0 truncate">
                Report a Problem
              </h4>
              <p className="text-xs text-text-muted font-medium mt-1 leading-snug m-0">
                Report route issues, organizer concerns, safety questions, or app problems.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full py-3 px-4 rounded-[var(--radius-card)] bg-background hover  text-text-primary font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-slate-200/60 "
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      <TrustedContactsQuickModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
      <ReportProblemQuickModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        journey={journey}
      />
    </div>
  );
};

export default JourneyHelpSection;
