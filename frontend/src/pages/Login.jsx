import { showToast } from "../utils/showToast";
import axios from "../api/axios";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Fingerprint,
  ChevronLeft,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { FaGithub, FaGoogle } from "react-icons/fa";
import Spinner from "../components/spinner/LoadingSpinner";
import stickerPack from "../assets/images/login.jpg";
import travelBg from "../assets/images/bg.jpg";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const { user, loading, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  // Track mounted state to prevent setState on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleKeyUp = (e) => {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleClick = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = { email: "", password: "" };

    if (!credentials.email) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(credentials.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }
    if (!credentials.password) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    dispatch({ type: "LOGIN_START" });

    try {
      const res = await axios.post("/auth/login", credentials, {
        withCredentials: true,
      });
      const loggedInUser = {
        ...res.data.details,
        isAdmin: res.data.isAdmin,
        token: res.data.token,
      };

      // Abort if component unmounted while waiting for response
      if (!isMounted.current) return;

      dispatch({ type: "LOGIN_SUCCESS", payload: loggedInUser });
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      // Navigate immediately upon successful login
      if (loggedInUser.isAdmin === true) {
        navigate("/admin", { replace: true });
      } else if (loggedInUser.type === "financeManager") {
        navigate("/finance", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      // Toast after navigation is fine — it's non-blocking
      showToast.success("Welcome Back");
    } catch (err) {
      if (!isMounted.current) return;

      // Only log fallback information during development to prevent exposing sensitive data
      const isDbDown = err.response?.data?.isDbDown;
      const message =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
            "Login failed. Please check your credentials.";

      dispatch({ type: "LOGIN_FAILURE", payload: message });

      if (isDbDown && process.env.NODE_ENV === "development") {
        // Keep server details out of user-facing errors.
        console.warn(
          "[DEV] DB offline — use local bypass credentials from .env.local",
        );
      }

      Swal.fire({
        icon: isDbDown ? "warning" : "error",
        title: isDbDown ? "System Offline" : "Access Denied",
        text: isDbDown
          ? "The server is currently unreachable. Please try again later."
          : message,
        confirmButtonColor: "#7c3aed",
        customClass: { popup: "rounded-[1.5rem]" },
      });
    }
  };

  // Provide feedback for social authentication placeholders
  // eslint-disable-next-line no-unused-vars
  const handleSocialAuth = (provider) => {
    Swal.fire({
      icon: "info",
      title: `${provider} Sign-In`,
      text: `${provider} authentication is coming soon.`,
      confirmButtonColor: "#7c3aed",
      customClass: { popup: "rounded-[1.5rem]" },
    });
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
                    Explore the Soul of India
                  </span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-5xl sm:text-6xl font-black tracking-tighter leading-none italic text-white drop-shadow-2xl"
                >
                  Incredible <br />
                  <span className="text-brand-400">Subcontinent.</span>
                </motion.h2>
                <div className="mt-8 flex items-center gap-4 text-white/30">
                  <div className="h-[1px] w-8 bg-white/20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Go YatriGo Elite Experience
                  </p>
                  <div className="h-[1px] w-8 bg-white/20" />
                </div>
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
              <Link
                to="/"
                className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl mb-3 shadow-sm text-brand-500 hover:bg-slate-100 hover:text-brand-600 transition-all"
              >
                <Fingerprint className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                Welcome back.
              </h1>
              <p className="text-slate-500 font-medium text-[11px] mt-1">
                Unlock your premium travel portal
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleClick} noValidate>
              {/* Email */}
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"
                >
                  Identity
                </label>
                <div className="relative group">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="email@example.com"
                    value={credentials.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full pl-11 pr-4 py-2 bg-slate-50 border ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.div
                      id="email-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.email}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest"
                  >
                    Secret
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-black text-brand-500 hover:text-brand-600 transition-colors uppercase no-underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={handleChange}
                    onKeyUp={handleKeyUp}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`w-full pl-11 pr-12 py-2 bg-slate-50 border ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-slate-400 shadow-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                      id="password-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.password}
                      </span>
                    </motion.div>
                  )}
                  {capsLockOn && (
                    <motion.div
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-amber-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        Caps Lock is ON
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
                  <Spinner className="h-5 w-5 border-white" containerClass="" />
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs relative z-10">
                      Access Portal
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-center text-[11px] font-bold text-slate-500">
                New traveler?
                <Link
                  to="/register"
                  className="ml-2 text-brand-600 font-black hover:text-brand-700 transition-colors hover:underline underline-offset-4 decoration-2"
                >
                  Create ID
                </Link>
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-[0.4em] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Exit Portal
              </Link>
              <div className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Protected Platform
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;

