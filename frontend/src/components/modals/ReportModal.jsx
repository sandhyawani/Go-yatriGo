import React, { useState } from "react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { FiAlertCircle, FiUserX, FiShield, FiImage, FiMessageSquare, FiMoreHorizontal } from "react-icons/fi";

const REPORT_REASONS = [
  { id: "Spam", label: "Spam", icon: FiMessageSquare, description: "Unwanted commercial content or repetitive messages" },
  { id: "Harassment", label: "Harassment", icon: FiAlertCircle, description: "Bullying, threats, or abusive behavior" },
  { id: "Fake profile", label: "Fake profile", icon: FiUserX, description: "Impersonation or deceptive identity" },
  { id: "Inappropriate content", label: "Inappropriate content", icon: FiImage, description: "Offensive, graphic, or sensitive content" },
  { id: "Scam/Fraud", label: "Scam/Fraud", icon: FiShield, description: "Suspicious, misleading, or fraudulent activity" },
  { id: "Other", label: "Other", icon: FiMoreHorizontal, description: "Something else that violates our community guidelines" }
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
      await axios.post("/users/report-item", {
        targetId,
        targetType,
        reason,
        reportedUserId
      });
      showToast.success("Report submitted successfully");
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm p-0 lg:p-4">
      <div 
        className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-t-[2rem] lg:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.12)] max-h-[90dvh] flex flex-col transform transition-all border border-white/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div className="flex justify-between items-center p-6 pb-5 border-b border-gray-100/50">
          <div>
            <h2 id="report-modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2 capitalize">
              <span className="text-2xl">🚩</span> Report {targetType || 'Post'}
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Help us keep GoYatriGo safe and welcoming for travelers.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100/80 transition-colors self-start -mt-2 -mr-2"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REPORT_REASONS.map((r) => {
              const isSelected = reason === r.id;
              const Icon = r.icon;
              return (
                <label 
                  key={r.id} 
                  className={`
                    relative flex flex-col gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-50 shadow-sm shadow-purple-100/50' 
                      : 'border-gray-100 bg-white hover:bg-gray-50/80 hover:border-gray-200'}
                  `}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={isSelected}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                    // Add this for better keyboard navigation visibility
                    onFocus={(e) => e.target.parentElement.classList.add('ring-2', 'ring-purple-400', 'ring-offset-2')}
                    onBlur={(e) => e.target.parentElement.classList.remove('ring-2', 'ring-purple-400', 'ring-offset-2')}
                  />
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors duration-200 ${isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold text-[15px] ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                      {r.label}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-purple-700/80' : 'text-gray-500'}`}>
                    {r.description}
                  </p>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-purple-600 animate-in zoom-in duration-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-100/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className={`
                px-7 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200
                ${loading || !reason 
                  ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 hover:shadow-md hover:shadow-purple-500/25 active:scale-[0.98]'
                }
              `}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
