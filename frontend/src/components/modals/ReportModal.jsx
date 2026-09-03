import React, { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { AlertCircle, UserX, Shield, Image as ImageIcon, MessageSquare, MoreHorizontal } from "lucide-react";

const REPORT_REASONS = [
  { id: "Spam", label: "Spam", icon: MessageSquare, description: "Unwanted commercial content or repetitive messages" },
  { id: "Harassment", label: "Harassment", icon: AlertCircle, description: "Bullying, threats, or abusive behavior" },
  { id: "Fake profile", label: "Fake profile", icon: UserX, description: "Impersonation or deceptive identity" },
  { id: "Inappropriate content", label: "Inappropriate content", icon: ImageIcon, description: "Offensive, graphic, or sensitive content" },
  { id: "Scam/Fraud", label: "Scam/Fraud", icon: Shield, description: "Suspicious, misleading, or fraudulent activity" },
  { id: "Other", label: "Other", icon: MoreHorizontal, description: "Something else that violates our community guidelines" },
];


const ReportModal = ({ isOpen, onClose, targetId, targetType, reportedUserId }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return showToast.error("Please select a reason");

    try {
      setLoading(true);
      const res = await axios.post("/users/report-item", {
        targetId,
        targetType,
        reason,
        reportedUserId
      });
      showToast.success(res.data?.message || "Thanks for keeping Go YatriGo safe! Your report has been submitted.");
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg && (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("flagged"))) {
        showToast.info(msg);
        onClose();
      } else {
        showToast.error(msg || "Error submitting report");
      }
    } finally {
      setLoading(false);
    }
  };

  // Map internal targetType values to user-friendly display names
  const getDisplayTitle = () => {
    const typeMap = {
      post: "Travel Memory",
      story: "Trip Moment",
      user: "User",
      group: "Group",
    };
    return typeMap[targetType?.toLowerCase()] || targetType || "Travel Memory";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm p-0 lg:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-t-[2rem] lg:rounded-2xl shadow-2xl max-h-[90dvh] flex flex-col border border-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <span className="text-base leading-none">🚩</span>
            </div>
            <div>
              <h2 id="report-modal-title" className="text-base font-bold text-gray-900">
                Report {getDisplayTitle()}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Help us keep GoYatriGo safe and welcoming.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close dialog"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reasons Grid */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2.5">
              {REPORT_REASONS.map((r) => {
                const isSelected = reason === r.id;
                const Icon = r.icon;
                return (
                  <label
                    key={r.id}
                    className={`
                      relative flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150
                      ${isSelected
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200"}
                    `}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={isSelected}
                      onChange={(e) => setReason(e.target.value)}
                      className="sr-only"
                      onFocus={(e) => e.target.parentElement.classList.add("ring-2", "ring-brand-400", "ring-offset-1")}
                      onBlur={(e) => e.target.parentElement.classList.remove("ring-2", "ring-brand-400", "ring-offset-1")}
                    />
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg transition-colors duration-150 ${isSelected ? "bg-brand-100 text-brand" : "bg-white text-gray-400 shadow-sm"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`font-semibold text-[13px] leading-tight ${isSelected ? "text-brand-900" : "text-gray-700"}`}>
                        {r.label}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed pl-0.5 ${isSelected ? "text-brand-dark/80" : "text-gray-400"}`}>
                      {r.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 text-brand-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-4 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className={`
                px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-150
                ${loading || !reason
                  ? "bg-gray-300 cursor-not-allowed opacity-70"
                  : "bg-brand hover:bg-brand-dark shadow-sm hover:shadow-brand-500/20 active:scale-[0.98]"}
              `}
            >
              {loading ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default ReportModal;