"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";
import { SoundToggle } from "./ui/SoundEffects";
import { PrefetchLink } from "./ui/PrefetchLink";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/quests", label: "Quests", icon: "📜" },
  { href: "/cross-chain", label: "Cross-Chain", icon: "🌐" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/identity", label: "Identity", icon: "🎭" },
  { href: "/achievements", label: "Achievements", icon: "🏅" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for glassmorphism intensity
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-arena-border/50 bg-arena-bg/80 backdrop-blur-xl shadow-lg shadow-black/10"
          : "border-b border-transparent bg-transparent"
      }`}
      data-tour="nav"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-lg group">
          <motion.span
            className="text-2xl"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            🔺
          </motion.span>
          <span className="hidden sm:inline">
            <span className="text-arena-accent">AVALANCHE</span>
            <span className="text-white ml-1">ARENA</span>
          </span>
          <span className="sm:hidden text-arena-accent">ARENA</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1" data-tour="connect">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <PrefetchLink
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-arena-card/50"
                }`}
              >
                {link.label}
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-arena-accent/10 border border-arena-accent/20 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </PrefetchLink>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Cmd+K button */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-arena-border/50 text-gray-500 text-xs hover:border-arena-accent/30 hover:text-gray-300 transition-all bg-arena-card/30"
            data-tour="command"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="text-[10px] font-mono">⌘K</kbd>
          </button>

          <SoundToggle />
          <span data-tour="theme"><ThemeToggle /></span>

          <div className="ml-1">
            <ConnectButton
              chainStatus="icon"
              accountStatus="address"
              showBalance={false}
            />
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white rounded-lg border border-arena-border/50 bg-arena-card/30 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <motion.div
            className="flex flex-col gap-1.5"
            animate={mobileOpen ? "open" : "closed"}
          >
            <motion.span
              className="block w-5 h-0.5 bg-current origin-center"
              variants={{
                open: { rotate: 45, y: 4 },
                closed: { rotate: 0, y: 0 },
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-0.5 bg-current"
              variants={{
                open: { opacity: 0, x: -10 },
                closed: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-0.5 bg-current origin-center"
              variants={{
                open: { rotate: -45, y: -4 },
                closed: { rotate: 0, y: 0 },
              }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-arena-border/30 bg-arena-bg/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm transition-all ${
                        isActive
                          ? "text-white bg-arena-accent/10 border border-arena-accent/20"
                          : "text-gray-400 hover:text-white hover:bg-arena-card/50"
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-arena-accent" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="pt-4 mt-2 border-t border-arena-border/30 flex items-center gap-3">
                <ConnectButton
                  chainStatus="icon"
                  accountStatus="address"
                  showBalance={false}
                />
                <ThemeToggle />
                <SoundToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
