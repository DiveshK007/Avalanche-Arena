"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * UX Enhancement #17 — Onboarding Tour
 *
 * First-visit guided tour showing key features.
 */

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='nav']",
    title: "Navigation",
    description: "Explore Dashboard, Quests, Leaderboard, Identity, and Achievements.",
    position: "bottom",
  },
  {
    target: "[data-tour='connect']",
    title: "Connect Your Wallet",
    description: "Link your wallet to start your cross-game progression journey.",
    position: "bottom",
  },
  {
    target: "[data-tour='command']",
    title: "Quick Navigation",
    description: "Press ⌘K (or Ctrl+K) anytime for quick navigation.",
    position: "bottom",
  },
  {
    target: "[data-tour='theme']",
    title: "Theme Toggle",
    description: "Switch between dark and light mode for your preference.",
    position: "bottom",
  },
];

const TOUR_STORAGE_KEY = "arena-tour-completed";

export function OnboardingTour() {
  const [step, setStep] = useState(-1); // -1 = not started
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show for first-time visitors
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Delay start to let page render
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStep = step >= 0 ? TOUR_STEPS[step] : null;

  // Position tooltip near target element
  useEffect(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (!el) {
      // Skip to next step if target not found
      if (step < TOUR_STEPS.length - 1) {
        setStep(step + 1);
      } else {
        completeTour();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    const pos = currentStep.position || "bottom";

    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2;
        break;
      case "top":
        top = rect.top - 12;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 12;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 12;
        break;
    }

    setTooltipPos({ top, left: Math.max(20, Math.min(left, window.innerWidth - 200)) });

    // Highlight element
    el.classList.add("ring-2", "ring-arena-accent", "ring-offset-2", "ring-offset-arena-bg", "z-[60]", "relative");

    return () => {
      el.classList.remove("ring-2", "ring-arena-accent", "ring-offset-2", "ring-offset-arena-bg", "z-[60]", "relative");
    };
  }, [step, currentStep]);

  function completeTour() {
    setShow(false);
    setStep(-1);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }

  function startTour() {
    setStep(0);
  }

  function nextStep() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeTour();
    }
  }

  // Welcome modal (before tour starts)
  if (show && step === -1) {
    return (
      <>
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-[101] flex items-center justify-center"
        >
          <div className="bg-arena-card border border-arena-border rounded-xl p-8 max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">🔺</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to Avalanche Arena!</h2>
            <p className="text-sm text-gray-400 mb-6">
              Quick tour of the platform? It&apos;ll take 15 seconds.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={completeTour}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={startTour}
                className="px-6 py-2 bg-arena-accent text-white rounded-lg text-sm font-medium hover:bg-arena-accent/80 transition-colors"
              >
                Show Me Around
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Active tour step
  if (!currentStep || !show) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/30"
        onClick={completeTour}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed z-[60] bg-arena-card border border-arena-accent/30 rounded-xl p-4 max-w-xs shadow-xl"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: "translateX(-50%)" }}
        >
          <h3 className="text-sm font-bold text-white mb-1">{currentStep.title}</h3>
          <p className="text-xs text-gray-400 mb-3">{currentStep.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">
              {step + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={completeTour}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={nextStep}
                className="text-xs bg-arena-accent text-white px-3 py-1 rounded-lg hover:bg-arena-accent/80 transition-colors"
              >
                {step === TOUR_STEPS.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
