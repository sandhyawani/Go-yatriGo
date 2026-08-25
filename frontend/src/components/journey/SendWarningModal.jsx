import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import axiosInstance from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { getEligibilityErrorMessage } from "../../utils/journeyLifecycle";

const PREDEFINED_REASONS = [
  "Safety concern",
  "Not following journey guidelines",
  "Inappropriate behavior",
  "Disruptive behavior",
  "Other"
];

const SendWarningModal = ({
  isOpen,
  onClose,
  targetMember,
  journeyId,
  onSuccess,
  isBuddyTrip = false
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customExplanation, setCustomExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!isOpen || !targetMember) return null;

  const memberName = targetMember.name || "this traveler";
  const memberId = targetMember.userId || targetMember._id || targetMember.id;

  const isOther = selectedReason === "Other";
  const isCustomValid = isOther ? customExplanation.trim().length >= 5 : true;
  const isFormValid = Boolean(selectedReason) && isCustomValid;

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason("");
    setCustomExplanation("");
    setFormError("");
    onClose();
  };

  const handleConfirmWarning = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    const finalReason = isOther
      ? customExplanation.trim()
      : selectedReason;

    setIsSubmitting(true);
    setFormError("");

    try {
      let res;
      if (isBuddyTrip) {
        res = await axiosInstance.post(
          `/social/buddy-trips/${journeyId}/warn/${memberId}`,
          { reason: finalReason, message: finalReason }
        );
      } else {
        res = await axiosInstance.post(
          `/journeys/${journeyId}/members/${memberId}/warn`,
          { reason: finalReason, message: finalReason }
        );
      }

      if (res.data?.success) {
        showToast.success(`Warning sent: ${memberName} has been notified about the warning.`);
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        const msg = res.data?.message || "Failed to send warning";
        setFormError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      console.error("Error submitting warning:", err);
      const friendlyMsg = getEligibilityErrorMessage(err, "Failed to send warning");
      setFormError(friendlyMsg);
      showToast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200/80 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0 leading-tight">
                Send Warning
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Send a warning to <strong className="text-slate-800 dark:text-slate-200">{memberName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Reason Select */}
        <form onSubmit={handleConfirmWarning} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Reason <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {PREDEFINED_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/30 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="warningReason"
                      value={reason}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedReason(reason);
                        setFormError("");
                      }}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500 focus:ring-1 shrink-0 accent-amber-600 cursor-pointer"
                    />
                    <span className="leading-snug select-none">{reason}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom explanation if 'Other' */}
          {isOther && (
            <div className="space-y-1.5 pt-1 animate-fade-in">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Add a short explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={customExplanation}
                onChange={(e) => {
                  setCustomExplanation(e.target.value);
                  setFormError("");
                }}
                placeholder="Describe the reason for this warning..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-400 resize-none leading-relaxed block"
              />
              {customExplanation.trim().length > 0 && customExplanation.trim().length < 5 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold m-0">
                  Please enter at least 5 characters.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Confirm Warning</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendWarningModal;
