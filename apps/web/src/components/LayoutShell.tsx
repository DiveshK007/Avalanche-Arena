"use client";

import { ReactNode } from "react";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { OnboardingTour } from "@/components/ui/OnboardingTour";
import { MobileBottomBar } from "@/components/ui/MobileBottomBar";

/**
 * LayoutShell — Client-side layout wrapper for global UX components.
 *
 * Includes: CommandPalette (⌘K), ScrollToTop, OnboardingTour, MobileBottomBar.
 */

export function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
      <ScrollToTop />
      <OnboardingTour />
      <MobileBottomBar />
    </>
  );
}
