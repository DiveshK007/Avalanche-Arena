"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

/**
 * UX Enhancement #7 — Keyboard Shortcuts / Command Palette
 *
 * Cmd+K / Ctrl+K opens a search palette for quick navigation.
 */

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: "📊",
      action: () => router.push("/dashboard"),
      keywords: ["home", "overview", "stats"],
    },
    {
      id: "quests",
      label: "Browse Quests",
      icon: "📜",
      action: () => router.push("/quests"),
      keywords: ["missions", "tasks", "play"],
    },
    {
      id: "leaderboard",
      label: "View Leaderboard",
      icon: "🏆",
      action: () => router.push("/leaderboard"),
      keywords: ["ranking", "top", "players"],
    },
    {
      id: "identity",
      label: "Your Identity",
      icon: "🎭",
      action: () => router.push("/identity"),
      keywords: ["nft", "mint", "faction", "profile"],
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: "🏅",
      action: () => router.push("/achievements"),
      keywords: ["badges", "unlocks", "progress"],
    },
    {
      id: "profile",
      label: "Your Profile",
      icon: "👤",
      action: () => router.push("/profile"),
      keywords: ["account", "settings", "history"],
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.includes(q))
    );
  });

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Arrow key navigation
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setOpen(false);
      }
    },
    [filtered, selectedIndex]
  );

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-[20%] z-[101] mx-auto w-full max-w-lg"
          >
            <div className="bg-arena-card border border-arena-border rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-arena-border">
                <svg
                  className="w-5 h-5 text-gray-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyNav}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-sm"
                />
                <kbd className="hidden sm:inline-block px-2 py-0.5 bg-arena-bg rounded text-[10px] text-gray-500 border border-arena-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-64 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No commands found
                  </div>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        i === selectedIndex
                          ? "bg-arena-accent/10 text-white"
                          : "text-gray-300 hover:bg-arena-bg/50"
                      }`}
                    >
                      <span className="text-lg">{cmd.icon}</span>
                      <span className="flex-1">{cmd.label}</span>
                      {i === selectedIndex && (
                        <span className="text-xs text-gray-500">↵</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-arena-border flex items-center gap-4 text-[10px] text-gray-600">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
