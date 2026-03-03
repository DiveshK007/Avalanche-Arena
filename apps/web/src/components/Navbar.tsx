"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";
import { SoundToggle } from "./ui/SoundEffects";
import { PrefetchLink } from "./ui/PrefetchLink";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quests", label: "Quests" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/identity", label: "Identity" },
  { href: "/achievements", label: "Achievements" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-arena-border bg-arena-bg/80 backdrop-blur-md sticky top-0 z-50" data-tour="nav">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <span className="text-arena-accent">🔺</span>
          <span className="hidden sm:inline">AVALANCHE ARENA</span>
          <span className="sm:hidden">ARENA</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6" data-tour="connect">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <PrefetchLink
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors py-1 ${
                  isActive
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
                {/* UX #6 — Active nav indicator animation */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-arena-accent rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </PrefetchLink>
            );
          })}

          {/* Cmd+K hint */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-arena-border text-gray-500 text-xs hover:border-gray-500 hover:text-gray-300 transition-colors"
            data-tour="command"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="text-[10px]">⌘K</kbd>
          </button>

          <SoundToggle />
          <span data-tour="theme"><ThemeToggle /></span>
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-arena-border bg-arena-bg/95 backdrop-blur-md px-6 py-4 space-y-3"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm transition-colors ${
                pathname === link.href
                  ? "text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-arena-border">
            <ConnectButton
              chainStatus="icon"
              accountStatus="address"
              showBalance={false}
            />
          </div>
        </motion.div>
      )}
    </nav>
  );
}
