import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Send,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Image,
  Bug,
  Lock,
  Monitor,
  Zap,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";

const CATEGORIES = [
  {
    id: "Bug / Technical Glitch",
    label: "Bug / Technical Glitch",
    icon: Bug,
    desc: "App crashes, broken links, or buttons not working",
  },
  {
    id: "Account & Login Issue",
    label: "Account & Login Issue",
    icon: Lock,
    desc: "Password reset, authentication, or session issues",
  },
  {
    id: "UI & Layout Issue",
    label: "UI & Layout Issue",
    icon: Monitor,
    desc: "Misaligned text, weird overlap, or display errors",
  },
  {
    id: "Performance & Speed",
    label: "Performance & Speed",
    icon: Zap,
    desc: "Slow loading pages, lag, or timeout errors",
  },
  {
    id: "Safety & Privacy",
    label: "Safety & Privacy",
    icon: ShieldAlert,
    desc: "Concerns regarding data security or privacy settings",
  },
  {
    id: "Other Issue",
    label: "Other Issue",
    icon: HelpCircle,
    desc: "Anything else that isn't working as expected",
  },
];

const ReportProblem = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(
    "Bug / Technical Glitch",
  );
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast.error("Please describe the problem before submitting.");
      return;
    }

    if (message.trim().length < 10) {
      showToast.error(
        "Please provide a bit more detail (at least 10 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/support/report-problem", {
        category: selectedCategory,
        message: message.trim(),
        screenshot: screenshotUrl.trim() || undefined,
      });
      setIsSubmitted(true);
      showToast.success(
        "Report Submitted",
        "Thank you for helping us improve GoYatriGo!",
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast.error(
        error.response?.data?.message ||
          "Failed to submit report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 selection:bg-purple-500/30">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/60 border border-purple-200/80 text-[11px] font-bold text-purple-700">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Engineering Support</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            /* Success State Card */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                Problem Reported Successfully!
              </h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed mb-8 font-medium">
                We've received your detailed report regarding{" "}
                <span className="font-bold text-slate-700">
                  "{selectedCategory}"
                </span>
                . Our engineering and qa team will review and investigate it
                immediately.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setScreenshotUrl("");
                    setIsSubmitted(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Report Another Problem
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-500/20 hover:shadow-lg transition-all"
                >
                  Return to Settings
                </button>
              </div>
            </motion.div>
          ) : (
            /* Report Form Card */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-orange-400 shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                      Report a Problem
                    </h1>
                    <p className="text-purple-200 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
                      Encountered an unexpected glitch or bug? Help us make
                      GoYatriGo seamless for everyone by sharing the details
                      below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                {/* Step 1: Category Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                    1. What kind of issue are you experiencing?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CATEGORIES.map(({ id, label, icon: Icon, desc }) => {
                      const isSelected = selectedCategory === id;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setSelectedCategory(id)}
                          className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                              : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isSelected
                                ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                : "bg-white text-slate-500 border border-slate-200/60"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span
                              className={`block text-sm font-bold ${isSelected ? "text-purple-900" : "text-slate-800"}`}
                            >
                              {label}
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5 leading-normal">
                              {desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Detailed Description */}
                <div>
                  <label
                    htmlFor="problem-desc"
                    className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2"
                  >
                    2. Describe the problem in detail{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-3 font-medium">
                    Please explain what happened, what you were trying to do,
                    and steps to reproduce if possible.
                  </p>
                  <textarea
                    id="problem-desc"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., When I open my saved posts tab and click on delete, the screen freezes..."
                    required
                    maxLength={2000}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 font-medium outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-400 resize-none shadow-sm"
                  />
                  <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] font-semibold text-slate-400">
                    <span>Minimum 10 characters</span>
                    <span>{message.length} / 2000</span>
                  </div>
                </div>

                {/* Step 3: Optional Screenshot */}
                <div>
                  <label
                    htmlFor="screenshot-url"
                    className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2"
                  >
                    3. Screenshot URL (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Image className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="screenshot-url"
                      type="url"
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      placeholder="https://image-host.com/your-screenshot.png"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                    Paste a direct link to an image/screenshot illustrating the
                    issue.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <Link
                    to="/settings"
                    className="w-full sm:w-auto px-6 py-3 text-center rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmitting
                      ? "Submitting Report..."
                      : "Submit Problem Report"}
                    <Send
                      className={`w-4 h-4 ${isSubmitting ? "animate-pulse" : ""}`}
                    />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportProblem;
