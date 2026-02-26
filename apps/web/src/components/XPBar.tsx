"use client";

import { getTierColor, formatXP, calculateXPProgress, getTier } from "@/lib/utils";

interface XPBarProps {
  xp: number;
  level: number;
  showLabel?: boolean;
}

export function XPBar({ xp, level, showLabel = true }: XPBarProps) {
  const progress = calculateXPProgress(xp, level);
  const tierColor = getTierColor(level);
  const nextLevelXP = (level + 1) * (level + 1) * 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">
            Level {level} · <span style={{ color: tierColor }}>{getTier(level)}</span>
          </span>
          <span className="text-gray-500">
            {formatXP(xp)} / {formatXP(nextLevelXP)} XP
          </span>
        </div>
      )}
      <div className="w-full h-3 bg-arena-card rounded-full overflow-hidden border border-arena-border">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out xp-bar-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: tierColor,
            boxShadow: `0 0 10px ${tierColor}40`,
            // @ts-ignore
            "--xp-width": `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}
