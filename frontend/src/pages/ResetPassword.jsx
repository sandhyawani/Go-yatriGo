import axios from "../api/axios";
import React, { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { showToast } from "../utils/showToast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Fingerprint,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import Spinner from "../components/spinner/LoadingSpinner";
import travelBg from "../assets/images/bg.jpg";
import stickerPack from "../assets/images/login.jpg";

const STRENGTH_META = {
  0: { bar: "bg-slate-200", text: "", textColor: "text-slate-400" },
  25: { bar: "bg-red-500", text: "Weak", textColor: "text-red-500" },
  50: { bar: "bg-orange-500", text: "Fair", textColor: "text-orange-500" },
  75: { bar: "bg-yellow-500", text: "Good", textColor: "text-yellow-500" },
  100: { bar: "bg-emerald-500", text: "Strong", textColor: "text-emerald-500" },
};

const getStrengthMeta = (strength) => {
  if (strength <= 0) return STRENGTH_META[0];
  if (strength <= 25) return STRENGTH_META[25];
  if (strength <= 50) return STRENGTH_META[50];
  if (strength <= 75) return STRENGTH_META[75];
  return STRENGTH_META[100];
};

const calculateStrength = (pass) => {
  if (!pass) return 0;
  let s = 0;
  if (pass.length > 5) s += 25;
  if (pass.length > 8) s += 25;
  if (/[A-Z]/.test(pass)) s += 25;
  if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) s += 25;
  return s;
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "", otp: "" });

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const strength = calculateStrength(password);
  const meta = getStrengthMeta(strength);

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const newErrors = { password: "", confirm: "", otp: "" };
    if (!token && !otp) {
      newErrors.otp = "OTP is required";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      newErrors.confirm = "Please confirm your password";
    } else if (password && password !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    }

    if (newErrors.password || newErrors.confirm || newErrors.otp) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `/auth/reset-password/${token || otp}`,
        { password },
      );
      if (!isMounted.current) return;

      showToast.success("Success", "Password updated successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      if (!isMounted.current) return;
      const message =
        err.response?.data?.message || "Invalid or expired token.";
      showToast.error("Reset Failed", message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 scale-105"
        style={{ backgroundImage: `url(${travelBg})` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/60 via-white/80 to-slate-50" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left: hero */}
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative group w-full max-w-2xl"
          >
            <div className="absolute -inset-4 bg-brand-500/20 blur-3xl rounded-[3rem] group-hover:bg-brand-500/30 transition-all duration-700" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl">
              <img
                src={stickerPack}
                alt="Travel Hero"
                className="w-full h-[80vh] object-cover rounded-[2rem] transform group-hover:scale-[1.02] transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/20">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
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
                  Reset <br />
                  <span className="text-brand-400">Password.</span>
                </motion.h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: form */}
        <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[420px] bg-white border border-slate-100 p-6 sm:p-8 rounded-[2rem] shadow-xl my-4 lg:my-0"
          >
            <div className="mb-5 flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl mb-3 shadow-sm text-brand-500">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                New Password
              </h1>
              <p className="text-slate-500 font-medium text-[11px] mt-1">
                Choose a strong new password for your account.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* OTP */}
              {!token && (
                <div className="space-y-1">
                  <label
                    htmlFor="otp"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                  >
                    OTP
                  </label>
                  <div className="relative group">
                    <Fingerprint
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.otp ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        clearError("otp");
                      }}
                      aria-invalid={!!errors.otp}
                      aria-describedby={errors.otp ? "otp-error" : undefined}
                      className={`w-full pl-11 pr-4 py-2 bg-slate-50 border ${errors.otp ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.otp && (
                      <motion.div
                        id="otp-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-bold">
                          {errors.otp}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                >
                  New Password
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "pw-error" : "pw-strength"
                    }
                    className={`w-full pl-11 pr-12 py-2 bg-slate-50 border ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {errors.password && (
                    <motion.div
                      id="pw-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="text-[10px] font-bold">
                        {errors.password}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {password && !errors.password && (
                  <div
                    id="pw-strength"
                    className="mt-2 ml-1"
                    aria-live="polite"
                  >
                    <div className="flex gap-1 h-1 w-full rounded-full overflow-hidden bg-slate-100">
                      <div
                        className={`h-full transition-all duration-300 ${meta.bar}`}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1 block ${meta.textColor}`}
                    >
                      Strength: {meta.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label
                  htmlFor="confirm-password"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.confirm ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirm");
                    }}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={
                      errors.confirm ? "confirm-error" : undefined
                    }
                    className={`w-full pl-11 pr-12 py-2 bg-slate-50 border ${
                      errors.confirm
                        ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                        : confirmPassword && confirmPassword === password
                          ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/20"
                          : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"
                    } rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {errors.confirm && (
                    <motion.div
                      id="confirm-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="text-[10px] font-bold">
                        {errors.confirm}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="w-full py-2 bg-brand-600 text-white font-black rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed group mt-2 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ? (
                  <span className="text-xs uppercase tracking-widest">
                    Updating…
                  </span>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs relative z-10">
                      Update Password
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </motion.button>
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

export default ResetPassword;
