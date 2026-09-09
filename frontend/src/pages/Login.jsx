import { showToast } from "../utils/showToast";
import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
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
AlertCircle } from
"lucide-react";


import Spinner from "../components/spinner/LoadingSpinner";
import stickerPack from "../assets/images/login.jpg";
import travelBg from "../assets/images/bg.jpg";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const { user, loading, login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [isGisRendered, setIsGisRendered] = useState(false);
  const gisInitializedRef = useRef(false);
  const googleSuccessRef = useRef(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) navigate("/social/buddy", { replace: true });
  }, [user, navigate]);

  const handleGoogleSuccess = useCallback(async (response) => {
    if (!response?.credential) return;

    const result = await loginWithGoogle(response.credential);
    if (!isMounted.current) return;

    if (result.success) {
      const loggedInUser = result.user;
      if (loggedInUser.isAdmin === true) {
        navigate("/admin", { replace: true });
      } else if (loggedInUser.type === "financeManager") {
        navigate("/finance", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
      showToast.success("Welcome back");
      return;
    }

    if (result.code === "ACCOUNT_COLLISION") {
      Swal.fire({
        icon: "warning",
        title: "Account Already Exists",
        text: result.error,
        confirmButtonColor: "#0284c7",
        confirmButtonText: "Sign In With Password",
        customClass: { popup: "rounded-[1.5rem]" }
      });
      return;
    }

    Swal.fire({
      icon: "error",
      title: "Google Sign-In Failed",
      text: result.error || "Unable to sign in with Google. Please try again.",
      confirmButtonColor: "#0284c7",
      customClass: { popup: "rounded-[1.5rem]" }
    });
  }, [loginWithGoogle, navigate]);

  // Always use the latest callback without forcing GIS to initialize again.
  useEffect(() => {
    googleSuccessRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  const getCleanClientId = () => {
    const raw = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    return typeof raw === "string" ? raw.trim().replace(/^["']|["']$/g, "") : "";
  };

  useEffect(() => {
    const clientId = getCleanClientId();

    if (!clientId || clientId.includes("test-google-client-id")) {
      console.error("Google Sign-In: REACT_APP_GOOGLE_CLIENT_ID is missing or invalid.");
      return;
    }

    let isCancelled = false;
    let resizeObserver = null;
    let script = null;

    const getTargetWidth = () => {
      if (!googleButtonRef.current) return 320;

      const container =
        googleButtonRef.current.parentElement || googleButtonRef.current;

      const rectWidth = container.getBoundingClientRect?.()?.width;
      const measured =
        rectWidth || container.clientWidth || container.offsetWidth || 320;

      return Math.max(200, Math.min(400, Math.floor(measured)));
    };

    const renderGsiButton = () => {
      if (
        isCancelled ||
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      try {
        /*
         * Initialize GIS only once.
         *
         * The previous implementation initialized GIS every time this
         * effect ran. That can cause:
         * "google.accounts.id.initialize() is called multiple times"
         *
         * The callback itself is kept in googleSuccessRef so it can stay
         * current without re-initializing GIS.
         */
        if (!gisInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (googleSuccessRef.current) {
                googleSuccessRef.current(response);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          gisInitializedRef.current = true;
        }

        const targetWidth = getTargetWidth();

        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: targetWidth,
          }
        );

        if (!isCancelled) {
          setIsGisRendered(true);
        }
      } catch (err) {
        console.error("GIS initialization/render error:", err);
        if (!isCancelled) {
          setIsGisRendered(false);
        }
      }
    };

    const setupObserver = () => {
      if (isCancelled) return;

      renderGsiButton();

      if (
        typeof ResizeObserver !== "undefined" &&
        googleButtonRef.current
      ) {
        const container =
          googleButtonRef.current.parentElement || googleButtonRef.current;

        resizeObserver = new ResizeObserver(() => {
          if (!isCancelled) {
            renderGsiButton();
          }
        });

        resizeObserver.observe(container);
      } else {
        window.addEventListener("resize", renderGsiButton);
      }
    };

    if (window.google?.accounts?.id) {
      setupObserver();
    } else {
      const existingScript = document.getElementById("google-gsi-client");

      if (existingScript) {
        existingScript.addEventListener("load", setupObserver);
        script = existingScript;
      } else {
        script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = setupObserver;
        script.onerror = () => {
          console.error("Failed to load Google Identity Services SDK");
          if (!isCancelled) {
            setIsGisRendered(false);
          }
        };

        document.body.appendChild(script);
      }
    }

    return () => {
      isCancelled = true;

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      window.removeEventListener("resize", renderGsiButton);

      if (script) {
        script.removeEventListener?.("load", setupObserver);
      }

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }

      setIsGisRendered(false);
    };
  }, []);

  const handleGoogleLogin = useCallback(() => {
    const clientId = getCleanClientId();
    if (!clientId || clientId.includes("test-google-client-id")) {
      Swal.fire({
        icon: "info",
        title: "Google Sign-In",
        text: "Google authentication is not configured yet. Please configure REACT_APP_GOOGLE_CLIENT_ID in .env.",
        confirmButtonColor: "#0284c7",
        customClass: { popup: "rounded-[1.5rem]" }
      });
      return;
    }

    if (!window.google?.accounts?.id) {
      Swal.fire({
        icon: "error",
        title: "Google SDK Unavailable",
        text: "Google Sign-In SDK is still loading or could not be reached. Please check your connection and try again.",
        confirmButtonColor: "#0284c7",
        customClass: { popup: "rounded-[1.5rem]" }
      });
      return;
    }

    try {
      /*
       * The normal rendered GIS button handles the sign-in flow itself.
       * This fallback is only used while that button is not rendered.
       */
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error("GIS prompt error:", err);
    }
  }, []);

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
    const email = credentials.email.trim();

    if (!email) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(email)) {
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

    const result = await login({
      email,
      password: credentials.password
    });

    if (!isMounted.current) return;

    if (result.success) {
      const loggedInUser = result.user;
      const myId = loggedInUser?._id || loggedInUser?.id;
      const userEmail = email.toLowerCase();
      try {
        const justRegistered =
          sessionStorage.getItem("goyatrigo_just_registered") === "true" ||
          localStorage.getItem(`goyatrigo_newly_registered_${userEmail}`) === "true";

        if (justRegistered && myId) {
          localStorage.setItem(`goyatrigo_is_new_user_${myId}`, "true");
          sessionStorage.removeItem("goyatrigo_just_registered");
          localStorage.removeItem(`goyatrigo_newly_registered_${userEmail}`);
        }
      } catch (e) {
        // Safe fallback
      }

      if (loggedInUser.isAdmin === true) {
        navigate("/admin", { replace: true });
      } else if (loggedInUser.type === "financeManager") {
        navigate("/finance", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      showToast.success("Welcome Back");
      return;
    }

    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: result.error || "Login failed. Please check your credentials.",
      confirmButtonColor: "#0284c7",
      customClass: { popup: "rounded-[1.5rem]" }
    });
  };



  const handleSocialAuth = (provider) => {
    Swal.fire({
      icon: "info",
      title: `${provider} Sign-In`,
      text: `${provider} authentication is coming soon.`,
      confirmButtonColor: "#0284c7",
      customClass: { popup: "rounded-[1.5rem]" }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      <div
      className="absolute inset-0 z-0 bg-cover bg-center opacity-10 scale-105"
      style={{ backgroundImage: `url(${travelBg})` }} />

      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/60 via-white/80 to-slate-50" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-12">
          <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative group w-full max-w-2xl">

            <div className="absolute -inset-4 bg-brand/20 blur-3xl rounded-[3rem] group-hover:bg-brand/30 transition-all duration-700" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl">
              <img
              src={stickerPack}
              alt="Travel Hero"
              className="w-full max-h-[80vh] h-full object-cover rounded-[2rem] transform group-hover:scale-[1.02] transition-transform duration-700 opacity-80" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/20">
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">

                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                    Explore the Soul of India
                  </span>
                </motion.div>
                <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-5xl sm:text-6xl font-black tracking-tighter leading-none italic text-white drop-shadow-2xl">

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

        <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto custom-scrollbar">
          <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-[420px] bg-white border border-slate-100 p-5 sm:p-8 rounded-[1.75rem] sm:rounded-[2rem] shadow-xl my-4 lg:my-0">

            <div className="mb-5 flex flex-col items-center lg:items-start">
              <Link
              to="/"
              className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl mb-3 shadow-sm text-brand-500 hover:bg-background hover:text-brand transition-all">

                <Fingerprint className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-black text-text-primary tracking-tighter">
                Welcome back.
              </h1>
              <p className="text-text-muted font-medium text-[11px] mt-1">
                Unlock your premium travel portal
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleClick} noValidate>
              <div className="space-y-1">
                <label
                htmlFor="email"
                className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">

                  Email
                </label>
                <div className="relative group">
                  <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-500" : "text-text-muted group-focus-within:text-brand-500"}`} />

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
                  className={`w-full pl-11 pr-4 py-2 bg-slate-50 border ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-text-primary font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-text-muted shadow-sm`} />

                </div>
                <AnimatePresence>
                  {errors.email &&
                  <motion.div
                  id="email-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 mt-1 ml-1 text-red-500">

                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.email}
                      </span>
                    </motion.div>}

                </AnimatePresence>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label
                  htmlFor="password"
                  className="text-[10px] font-black text-text-muted uppercase tracking-widest">

                    Password
                  </label>
                  <Link
                  to="/forgot-password"
                  className="text-[10px] font-black text-brand-500 hover:text-brand transition-colors uppercase no-underline">

                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-500" : "text-text-muted group-focus-within:text-brand-500"}`} />

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
                  errors.password ? "password-error" : undefined}

                  className={`w-full pl-11 pr-12 py-2 bg-slate-50 border ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl text-text-primary font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm placeholder:text-text-muted shadow-sm`} />

                  <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
                  aria-label={
                  showPassword ? "Hide password" : "Show password"}>


                    {showPassword ?
                    <EyeOff className="w-4 h-4" /> :

                    <Eye className="w-4 h-4" />}

                  </button>
                </div>
                <AnimatePresence>
                  {errors.password &&
                  <motion.div
                  id="password-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 mt-1 ml-1 text-red-500">

                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.password}
                      </span>
                    </motion.div>}

                  {capsLockOn &&
                  <motion.div
                  role="status"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 mt-1 ml-1 text-amber-500">

                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        Caps Lock is ON
                      </span>
                    </motion.div>}

                </AnimatePresence>
              </div>

              <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full py-2 bg-brand text-white font-black rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_20px_rgba(2,132,199,0.4)] flex items-center justify-center gap-3 hover:bg-brand disabled:opacity-70 disabled:cursor-not-allowed group mt-2 overflow-hidden relative">

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ?
                <Spinner className="h-5 w-5 border-white" containerClass="" /> :

                <>
                    <span className="uppercase tracking-widest text-xs relative z-10">
                      Access Portal
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>}

              </motion.button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full flex items-center justify-center min-h-[44px] relative overflow-hidden rounded-xl sm:rounded-2xl">
                <div
                  ref={googleButtonRef}
                  className={`w-full flex justify-center items-center transition-opacity duration-200 max-w-full overflow-hidden [&>div]:!w-full [&>div]:!max-w-full [&_iframe]:!max-w-full [&_iframe]:!mx-auto ${
                    isGisRendered ? "opacity-100 relative" : "opacity-0 absolute pointer-events-none"
                  }`}
                />

                {!isGisRendered && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-[40px] sm:h-[44px] py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl font-bold text-xs text-text-primary flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="truncate">Continue with Google</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-center text-[11px] font-bold text-text-muted">
                New user?
                <Link
                to="/register"
                className="ml-2 text-brand font-black hover:text-brand-dark transition-colors hover:underline underline-offset-4 decoration-2">

                  Create Account
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2 mt-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                  Protected Platform
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);

};

export default Login;
