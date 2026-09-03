import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../../context/authContext";
import { ArrowRight, Sparkles, X, ChevronLeft } from "lucide-react";

export const TOUR_STEPS = [
  {
    id: "home",
    targetId: "nav-home",
    stepNumber: 1,
    title: "Your Travel Home",
    description: "Discover your trips, travel memories, and updates from your journey.",
  },
  {
    id: "explore",
    targetId: "nav-explore",
    stepNumber: 2,
    title: "Explore",
    description: "Find destinations, travelers, and journeys that match your interests.",
  },
  {
    id: "create",
    targetId: "nav-create",
    stepNumber: 3,
    title: "Create",
    description: "Plan a journey, share a memory, or create something for the travel community.",
  },
  {
    id: "chat",
    targetId: "nav-chat",
    stepNumber: 4,
    title: "Chat",
    description: "Connect with your travel buddies and keep your journey conversations in one place.",
  },
  {
    id: "profile",
    targetId: "nav-profile",
    stepNumber: 5,
    title: "Your Profile",
    description: "Manage your profile, trips, memories, and travel identity.",
  },
];

export const getCompletedKey = (userId) => `goyatrigo_tour_completed_${userId}`;
export const getNewUserKey = (userId) => `goyatrigo_is_new_user_${userId}`;

const isElementVisible = (el) => {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const NavigationTour = () => {
  const { user } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [cardPosition, setCardPosition] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [reducedMotion, setReducedMotion] = useState(false);

  const cardRef = useRef(null);
  const nextBtnRef = useRef(null);

  const userId = user?._id || user?.id || user?.email;

  // Determine if tour should be shown for the current user
  const checkEligibility = useCallback(() => {
    if (!userId || Boolean(user?.isAdmin)) return false;

    // Check query param override: ?tour=true
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("tour") === "true") {
        return true;
      }
    } catch {
      // ignore
    }

    try {
      const isCompleted = localStorage.getItem(getCompletedKey(userId)) === "true";
      if (isCompleted) {
        return false;
      }

      const isExplicitNewUser =
        user?.isNewUser === true ||
        localStorage.getItem(getNewUserKey(userId)) === "true";

      const isRecentlyCreated = Boolean(
        user?.createdAt &&
          Date.now() - new Date(user.createdAt).getTime() < 2 * 60 * 60 * 1000
      );

      const isBrandNewProfile = Boolean(
        user &&
          !user.completedTrips &&
          (!user.followers || user.followers.length === 0) &&
          (!user.following || user.following.length === 0) &&
          isRecentlyCreated
      );

      return Boolean(isExplicitNewUser || isBrandNewProfile || isRecentlyCreated);
    } catch {
      return false;
    }
  }, [user, userId]);

  // Listen for manual trigger event: goyatrigo:start-tour
  useEffect(() => {
    const handleManualStart = () => {
      setCurrentStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener("goyatrigo:start-tour", handleManualStart);
    return () => window.removeEventListener("goyatrigo:start-tour", handleManualStart);
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
      const handler = (e) => setReducedMotion(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } catch {
      // fallback
    }
  }, []);

  // Check initial eligibility with slight delay to ensure DOM and layout are settled
  useEffect(() => {
    if (!user) {
      setIsActive(false);
      return;
    }

    const timer = setTimeout(() => {
      if (checkEligibility()) {
        setIsActive(true);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [user, checkEligibility]);

  // Find target element for current step that is currently visible in DOM
  const findTargetElement = useCallback((stepId) => {
    const elements = document.querySelectorAll(`[data-tour="${stepId}"]`);
    for (let i = 0; i < elements.length; i++) {
      if (isElementVisible(elements[i])) {
        return elements[i];
      }
    }
    return null;
  }, []);

  // Collision-safe and target-aware positioning calculation
  const updatePositions = useCallback(() => {
    if (!isActive) return;

    const currentStep = TOUR_STEPS[currentStepIndex];
    if (!currentStep) return;

    const mobileLayout = window.innerWidth < 1024;
    setIsMobile(mobileLayout);

    const targetEl = findTargetElement(currentStep.targetId);

    if (!targetEl) {
      // If target is temporarily not found, center in viewport as fallback
      setTargetRect(null);
      const cardW = Math.min(window.innerWidth - 32, 350);
      setCardPosition({
        left: (window.innerWidth - cardW) / 2,
        top: Math.max(16, window.innerHeight / 2 - 90),
        width: cardW,
        arrowLeft: cardW / 2 - 8,
        arrowPlacement: "none",
      });
      return;
    }

    const rawRect = targetEl.getBoundingClientRect();
    const padding = 4;
    const spotlightRect = {
      left: Math.max(0, rawRect.left - padding),
      top: Math.max(0, rawRect.top - padding),
      width: rawRect.width + padding * 2,
      height: rawRect.height + padding * 2,
      right: rawRect.right + padding,
      bottom: rawRect.bottom + padding,
      centerX: rawRect.left + rawRect.width / 2,
      centerY: rawRect.top + rawRect.height / 2,
    };
    setTargetRect(spotlightRect);

    const cardEl = cardRef.current;
    const cardHeight = cardEl ? cardEl.offsetHeight : 185;

    if (mobileLayout) {
      // Mobile positioning: position above bottom nav, collision-safe
      const bottomNav = document.getElementById("mobile-bottom-nav");
      const bottomNavTop = bottomNav
        ? bottomNav.getBoundingClientRect().top
        : window.innerHeight - 64;

      const cardWidth = Math.min(window.innerWidth - 24, 348);
      // Keep at least 12px margin on sides
      let cardLeft = Math.max(
        12,
        Math.min(
          spotlightRect.centerX - cardWidth / 2,
          window.innerWidth - cardWidth - 12
        )
      );

      // Card must stay ABOVE the bottom navigation bar with a safe margin
      let cardTop = spotlightRect.top - cardHeight - 14;

      // Collision safety check: ensure card is not pushed off the top of the viewport
      if (cardTop < 12) {
        cardTop = 12;
      }

      // Collision safety check: ensure card does NOT overlap or sit under the bottom navigation
      if (cardTop + cardHeight > bottomNavTop - 10) {
        cardTop = bottomNavTop - 10 - cardHeight;
      }

      // Pointer arrow aligns with target element's center
      const arrowLeft = Math.max(
        16,
        Math.min(spotlightRect.centerX - cardLeft - 8, cardWidth - 28)
      );

      setCardPosition({
        left: cardLeft,
        top: cardTop,
        width: cardWidth,
        arrowLeft,
        arrowPlacement: "bottom",
      });
    } else {
      // Desktop positioning: to the right of the vertical sidebar
      const cardWidth = 350;
      let cardLeft = spotlightRect.right + 16;

      // Viewport safety check on right edge
      if (cardLeft + cardWidth > window.innerWidth - 16) {
        cardLeft = window.innerWidth - cardWidth - 16;
      }

      // Vertically center with the spotlighted item
      let cardTop = spotlightRect.centerY - cardHeight / 2;

      // Viewport safety check on top and bottom
      cardTop = Math.max(16, Math.min(cardTop, window.innerHeight - cardHeight - 16));

      const arrowTop = Math.max(
        16,
        Math.min(spotlightRect.centerY - cardTop - 8, cardHeight - 28)
      );

      setCardPosition({
        left: cardLeft,
        top: cardTop,
        width: cardWidth,
        arrowTop,
        arrowPlacement: "left",
      });
    }
  }, [isActive, currentStepIndex, findTargetElement]);

  // Recalculate positions on step index change, resize, and scroll
  useEffect(() => {
    if (!isActive) return;

    let rafId = null;
    let retryTimeout = null;

    updatePositions();

    // If target element was not ready on first paint, retry shortly
    const currentStep = TOUR_STEPS[currentStepIndex];
    if (currentStep && !findTargetElement(currentStep.targetId)) {
      retryTimeout = setTimeout(() => {
        rafId = requestAnimationFrame(updatePositions);
      }, 100);
    }

    const handleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePositions);
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(retryTimeout);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isActive, currentStepIndex, updatePositions, findTargetElement]);

  // Auto-focus Next / Get Started button on step change for accessibility
  useEffect(() => {
    if (isActive && nextBtnRef.current) {
      nextBtnRef.current.focus({ preventScroll: true });
    }
  }, [isActive, currentStepIndex]);

  // Keyboard navigation: Escape (skip), ArrowRight/Enter (next), ArrowLeft (prev)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStepIndex > 0) {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStepIndex]);

  const persistCompletion = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.setItem(getCompletedKey(userId), "true");
      localStorage.removeItem(getNewUserKey(userId));
    } catch {
      // storage error fallback
    }
  }, [userId]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    persistCompletion();
    setIsActive(false);
  };

  const handleComplete = () => {
    persistCompletion();
    setIsActive(false);
  };

  if (!isActive) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFinalStep = currentStepIndex === TOUR_STEPS.length - 1;
  const transitionConfig = reducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 320, damping: 30 };

  return (
    <div
      className="navigation-tour-overlay fixed inset-0 z-[995] pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-label="First-time navigation tour"
      tabIndex={-1}
    >
      {/* Background Dimming with SVG Cutout for Spotlight */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[996] transition-opacity duration-300"
        aria-hidden="true"
      >
        <defs>
          <mask id="nav-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.6)"
          className="dark:fill-[rgba(2,6,23,0.78)]"
          mask="url(#nav-tour-spotlight-mask)"
        />
      </svg>

      {/* Soft Glow Spotlight Ring around the active target */}
      {targetRect && (
        <motion.div
          key="spotlight-ring"
          initial={false}
          animate={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          transition={transitionConfig}
          className="fixed pointer-events-none z-[997] rounded-2xl ring-2 ring-brand-500 dark:ring-sky-400 ring-offset-2 ring-offset-transparent shadow-[0_0_25px_rgba(2,132,199,0.5)] dark:shadow-[0_0_25px_rgba(56,189,248,0.45)]"
          aria-hidden="true"
        />
      )}

      {/* Floating Explanation Card */}
      {cardPosition && (
        <motion.div
          ref={cardRef}
          key={`tour-card-${currentStepIndex}`}
          initial={{ opacity: 0, scale: 0.95, y: isMobile ? 8 : 0, x: isMobile ? 0 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: `${cardPosition.left}px`,
            top: `${cardPosition.top}px`,
            width: `${cardPosition.width}px`,
          }}
          className="z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.2),0_0_0_1px_rgba(255,255,255,0.7)_inset] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] p-4 sm:p-5 text-slate-800 dark:text-slate-100 flex flex-col font-sans"
        >
          {/* Arrow Pointer */}
          {cardPosition.arrowPlacement === "bottom" && (
            <div
              style={{ left: `${cardPosition.arrowLeft}px` }}
              className="absolute -bottom-2 w-4 h-4 bg-white/95 dark:bg-slate-900/95 border-r border-b border-slate-200/90 dark:border-slate-800 rotate-45 pointer-events-none shadow-sm"
              aria-hidden="true"
            />
          )}
          {cardPosition.arrowPlacement === "left" && (
            <div
              style={{ top: `${cardPosition.arrowTop}px` }}
              className="absolute -left-2 w-4 h-4 bg-white/95 dark:bg-slate-900/95 border-l border-b border-slate-200/90 dark:border-slate-800 rotate-45 pointer-events-none shadow-sm"
              aria-hidden="true"
            />
          )}

          {/* Header with Step indicator, Dots and Close */}
          <div className="flex items-center justify-between gap-2 mb-2 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-sky-400 bg-brand-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-brand-200/60 dark:border-sky-800/60">
                Step {currentStep.stepNumber} of {TOUR_STEPS.length}
              </span>
              <div className="flex items-center gap-1 ml-1" aria-hidden="true">
                {TOUR_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? "w-5 bg-brand-600 dark:bg-sky-400"
                        : idx < currentStepIndex
                        ? "w-1.5 bg-brand-300 dark:bg-sky-700"
                        : "w-1.5 bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSkip}
              aria-label="Skip tour"
              className="p-1 -mr-1 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content: Title & One-sentence explanation */}
          <div className="flex flex-col min-w-0 mb-4">
            <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white font-heading tracking-tight leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed mt-1">
              {currentStep.description}
            </p>
          </div>

          {/* Actions: Skip Tour & Next / Get Started */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <button
              onClick={handleSkip}
              aria-label="Skip onboarding tour"
              className="text-xs sm:text-[13px] font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1.5 px-1.5"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  aria-label="Previous step"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                ref={nextBtnRef}
                onClick={handleNext}
                aria-label={isFinalStep ? "Get Started" : `Next step: ${TOUR_STEPS[currentStepIndex + 1]?.title}`}
                className="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs sm:text-[13px] font-bold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
              >
                <span>{isFinalStep ? "Get Started" : "Next"}</span>
                {isFinalStep ? (
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(NavigationTour);
