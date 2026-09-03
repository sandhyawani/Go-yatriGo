import React, { useState } from "react";
import { X, AlertTriangle, Send, CheckCircle2, ShieldAlert, Route, Users, Smartphone, HelpCircle } from "lucide-react";
import axiosInstance from "../../../api/axios";
import { showToast } from "../../../utils/showToast";

const REPORT_CATEGORIES = [
  { id: "Route / problem with journey", label: "Route / problem with journey", icon: Route },
  { id: "Safety concern", label: "Safety concern", icon: ShieldAlert },
  { id: "Traveler / member issue", label: "Traveler / member issue", icon: Users },
  { id: "App problem", label: "App problem", icon: Smartphone },
  { id: "Something else", label: "Something else", icon: HelpCircle }
];

const ReportProblemQuickModal = ({ isOpen, onClose, journey = {} }) => {
  const [selectedCategory, setSelectedCategory] = useState(REPORT_CATEGORIES[0].id);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast.error("Please describe what happened.");
      return;
    }
    if (message.trim().length < 10) {
      showToast.error("Please provide at least 10 characters so our team can help.");
      return;
    }

    setLoading(true);
    try {
      const journeyContext = journey?.title || journey?.destination
        ? `[Journey: ${journey.title || journey.destination}] `
        : "";
      await axiosInstance.post("/support/report-problem", {
        category: selectedCategory,
        message: `${journeyContext}${message.trim()}`
      });
      setIsSuccess(true);
      showToast.success("Report submitted. Our support team has been alerted.");
      setTimeout(() => {
        setIsSuccess(false);
        setMessage("");
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Error reporting problem:", err);
      showToast.error(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-md bg-surface rounded-t-[20px] sm:rounded-[20px] shadow-lg border border-border-default overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius-card)] bg-amber-50 text-amber-600 border border-amber-200/60 ">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary m-0">
                Report a Problem
              </h3>
              <p className="text-xs text-text-muted font-medium m-0 mt-0.5">
                Let our support team know if something is wrong
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-text-primary m-0">
              Report Received
            </h4>
            <p className="text-xs text-text-muted font-medium m-0">
              Thank you for keeping Go-Yatri-Go safe and reliable.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                What happened?
              </label>
              <div className="space-y-1.5">
                {REPORT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                        isSelected
                          ? "bg-brand/10 border-brand-500 text-brand shadow-xs"
                          : "bg-slate-50 border-slate-200/70 text-text-primary hover:bg-background "
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-brand" : "text-text-muted"}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                Tell us more
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail so we can assist you..."
                rows="3"
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 rounded-xl text-xs font-bold text-text-secondary bg-background hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportProblemQuickModal;
