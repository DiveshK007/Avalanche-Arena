"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * UX Enhancement #18 — Mobile Bottom Tab Bar
 *
 * Fixed bottom navigation for mobile devices.
 */

const TABS = [
  { href: "/dashboard", label: "Home", icon: "📊" },
  { href: "/quests", label: "Quests", icon: "📜" },
  { href: "/leaderboard", label: "Ranks", icon: "🏆" },
  { href: "/identity", label: "Identity", icon: "🎭" },
  { href: "/achievements", label: "Awards", icon: "🏅" },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-arena-bg/95 backdrop-blur-md border-t border-arena-border">
      <div className="flex items-center justify-around py-2 px-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-arena-accent"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-arena-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for notch devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
