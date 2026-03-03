"use client";

import { ReactNode, useEffect } from "react";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { OnboardingTour } from "@/components/ui/OnboardingTour";
import { MobileBottomBar } from "@/components/ui/MobileBottomBar";

/**
 * LayoutShell — Client-side layout wrapper for global UX components.
 *
 * Includes: CommandPalette (⌘K), ScrollToTop, OnboardingTour, MobileBottomBar,
 * mouse tracking for spotlight effects, noise overlay.
 */

export function LayoutShell({ children }: { children: ReactNode }) {
  // Track mouse position for CSS spotlight effects
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="noise-overlay">
      {children}
      <CommandPalette />
      <ScrollToTop />
      <OnboardingTour />
      <MobileBottomBar />
    </div>
  );
}
