import { showToast } from "../utils/showToast";
// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { AlertTriangle, Shield, MapPin, Phone, Send, X } from "lucide-react";
// import { showToast } from "../utils/showToast";
// import { useLocation } from "react-router-dom";

// const EmergencySOS = () => {
//   const location = useLocation();
//   const [isOpen, setIsOpen] = useState(false);
//   const [isSent, setIsSent] = useState(false);

//   if (location.pathname === "/social/memories") return null;

//   const handleSOS = () => {
//     setIsSent(true);
//     showToast.success("SOS Alert Sent! Emergency contacts notified.", {
//         icon: '🚨',
//         duration: 5000,
//         style: {
//             background: '#be123c',
//             color: '#fff',
//             fontWeight: 'bold'
//         }
//     });
//     // In a real app, this would send location to a backend/WebSocket
//     setTimeout(() => {
//       setIsOpen(false);
//       setIsSent(false);
//     }, 4000);
//   };

//   return (
//     <div className="fixed bottom-8 right-8 z-[1000]">
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.9, y: 20 }}
//             className="mb-4 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 overflow-hidden"
//           >
//             <div className="bg-rose-600 p-6 text-white text-center">
//               <AlertTriangle className="w-12 h-12 mx-auto mb-3 animate-bounce" />
//               <h3 className="text-xl font-black uppercase tracking-tighter">Emergency SOS</h3>
//               <p className="text-rose-100 text-xs font-medium mt-1">Instant help in critical situations</p>
//             </div>
            
//             <div className="p-6 space-y-4">
//               <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
//                  <MapPin className="w-5 h-5 text-rose-500" />
//                  <div>
//                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Current Status</p>
//                     <p className="text-xs font-bold text-slate-700">Tracking Live Location...</p>
//                  </div>
//               </div>

//               <div className="space-y-2">
//                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Help Actions</p>
//                  <button 
//                     onClick={handleSOS}
//                     disabled={isSent}
//                     className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
//                  >
//                     {isSent ? "Alert Sent!" : "Trigger SOS"}
//                  </button>
//                  <button 
//                     className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
//                  >
//                     <Phone className="w-4 h-4" /> Call Local Help
//                  </button>
//               </div>
//             </div>
            
//             <button 
//               onClick={() => setIsOpen(false)}
//               className="absolute top-4 right-4 text-rose-200 hover:text-white"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <motion.button
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         onClick={() => setIsOpen(!isOpen)}
//         className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isOpen ? "bg-slate-900 rotate-90" : "bg-rose-600 shadow-rose-500/40"}`}
//       >
//         {isOpen ? (
//           <X className="w-6 h-6 text-white" />
//         ) : (
//           <Shield className="w-8 h-8 text-white animate-pulse" />
//         )}
//       </motion.button>
//     </div>
//   );
// };

// export default EmergencySOS;


import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, MapPin, Phone, X } from "lucide-react";
import { useLocation } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const HIDDEN_ROUTES = ["/social/memories"];

const PANEL_VARIANTS = {
  hidden:  { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1,   y: 0  },
  exit:    { opacity: 0, scale: 0.9, y: 20 },
};

const AUTO_CLOSE_MS = 4000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attempts to get the device's current position.
 * Returns a human-readable string or an error message.
 */
const fetchLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`),
      () => resolve("Location access denied"),
      { timeout: 6000 }
    );
  });

// ─── Component ────────────────────────────────────────────────────────────────

const EmergencySOS = () => {
  const location = useLocation();

  // ── All hooks must be called before any conditional return ──
  const [isOpen, setIsOpen]       = useState(false);
  const [isSent, setIsSent]       = useState(false);
  const [coords, setCoords]       = useState("Acquiring location…");
  const timeoutRef                = useRef(null);

  // Fetch real coordinates whenever the panel opens
  useEffect(() => {
    if (!isOpen) return;
    setCoords("Acquiring location…");
    fetchLocation().then(setCoords);
  }, [isOpen]);

  // Cleanup the auto-close timer on unmount to prevent state updates
  // on an unmounted component (memory leak / React warning)
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClose = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsOpen(false);
    setIsSent(false);
  }, []);

  const handleSOS = useCallback(() => {
    setIsSent(true);

    showToast.success("SOS Alert Sent! Emergency contacts notified.", {
      icon: "🚨",
      duration: 5000,
      // Avoid hardcoded hex — use a Tailwind-safe class name or a CSS var.
      // react-hot-toast doesn't support CSS vars directly, so rose-700 hex is
      // acceptable here as a one-off for the toast only.
      style: { background: "#be123c", color: "#fff", fontWeight: "bold" },
    });

    // In production: POST to your backend / emit via WebSocket here.

    timeoutRef.current = setTimeout(handleClose, AUTO_CLOSE_MS);
  }, [handleClose]);

  // ── Route guard: AFTER all hooks ──
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">

      {/* ── Live region so screen readers announce state changes ── */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {isSent ? "SOS alert sent. Emergency contacts are being notified." : ""}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            // explicit relative so the absolute close button is positioned correctly
            className="relative mb-4 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Emergency SOS panel"
          >
            {/* Header */}
            <div className="bg-rose-600 p-6 text-white text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 animate-bounce" aria-hidden="true" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Emergency SOS</h3>
              <p className="text-rose-100 text-xs font-medium mt-1">
                Instant help in critical situations
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">

              {/* Location status — shows real coords once resolved */}
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                    Current Location
                  </p>
                  <p className="text-xs font-bold text-slate-700 truncate" title={coords}>
                    {coords}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">
                  Help Actions
                </p>

                <button
                  type="button"
                  onClick={handleSOS}
                  disabled={isSent}
                  aria-disabled={isSent}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed
                             text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em]
                             shadow-lg shadow-rose-200 active:scale-95 transition-colors"
                >
                  {isSent ? "Alert Sent!" : "Trigger SOS"}
                </button>

                {/* "Call Local Help" — uses tel: so it actually works on mobile */}
                <a
                  href="tel:112"
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl
                             font-black text-xs uppercase tracking-[0.2em] active:scale-95
                             flex items-center justify-center gap-2 transition-colors"
                  aria-label="Call emergency services (112)"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  Call Emergency (112)
                </a>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close SOS panel"
              className="absolute top-4 right-4 text-rose-200 hover:text-white transition-colors
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger Button ──
          Remove Tailwind `transition-all` — Framer Motion owns scale/transform.
          Mixing both causes jank on the same property.
      ── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close emergency SOS panel" : "Open emergency SOS panel"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl
          ${isOpen
            ? "bg-slate-900 rotate-90"
            : "bg-rose-600 shadow-rose-500/40"
          }`}
      >
        {isOpen
          ? <X     className="w-6 h-6 text-white" aria-hidden="true" />
          : <Shield className="w-8 h-8 text-white animate-pulse" aria-hidden="true" />
        }
      </motion.button>

    </div>
  );
};

export default EmergencySOS;