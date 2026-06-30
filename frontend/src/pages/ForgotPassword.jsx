import { showToast } from "../utils/showToast";
import React, { useState } from "react";
import axios from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Fingerprint,
  Sparkles,
} from "lucide-react";

import travelBg from "../assets/images/bg.jpg";
import stickerPack from "../assets/images/login.jpg";

// Validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Component
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Track whether the link was already sent to show a success state instead of repeating Swal
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (sent) setSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/auth/forgot-password", { email });
      setSent(true);
      showToast.success("OTP Sent!");
      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
      setEmail("");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      showToast.error("Oops…", message);
    } finally {
      // always reset — was being called in both try/catch before
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      {/* background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 scale-105"
        style={{ backgroundImage: `url(${travelBg})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/60 via-white/80 to-slate-50" />

      {/* ambient glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">
        {/* left hero */}
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative group w-full max-w-2xl"
          >
            <div className="absolute -inset-4 bg-violet-500/20 blur-3xl rounded-[3rem] group-hover:bg-violet-500/30 transition-all duration-700" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl">
              <img
                src={stickerPack}
                alt="Travel hero"
                className="w-full h-[80vh] object-cover rounded-[2rem] transform group-hover:scale-[1.02] transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/20">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                    Secure Recovery
                  </span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-5xl sm:text-6xl font-black tracking-tighter leading-none italic text-white drop-shadow-2xl"
                >
                  Regain <br />
                  <span className="text-violet-400">Access.</span>
                </motion.h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* right form */}
        <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[420px] bg-white border border-slate-100 p-6 sm:p-8 rounded-[2rem] shadow-xl my-4 lg:my-0"
          >
            {/* Branding */}
            <div className="mb-5 flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl mb-3 shadow-sm text-violet-500">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                Forgot Password
              </h1>
              <p className="text-slate-500 font-medium text-[11px] mt-1 leading-relaxed">
                Enter your registered email address. We'll send you a secure
                link to reset your password.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="forgot-email"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                      error
                        ? "text-red-500"
                        : "text-slate-400 group-focus-within:text-violet-500"
                    }`}
                  />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-describedby={error ? "forgot-email-error" : undefined}
                    aria-invalid={!!error}
                    className={`w-full pl-11 pr-4 py-2 bg-slate-50 border ${
                      error
                        ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
                    } rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      id="forgot-email-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="text-[10px] font-bold">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-violet-600 text-white font-black rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 hover:bg-violet-500 disabled:opacity-70 disabled:cursor-not-allowed mt-2 relative overflow-hidden group"
              >
                {loading ? (
                  <span className="text-xs uppercase tracking-widest">
                    Sending…
                  </span>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs">
                      Send OTP
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-[0.4em] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
