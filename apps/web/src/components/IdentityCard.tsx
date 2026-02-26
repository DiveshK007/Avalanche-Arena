"use client";

import { getTier, getTierColor, formatXP, formatAddress } from "@/lib/utils";
import { XPBar } from "./XPBar";

interface IdentityCardProps {
  address: string;
  level: number;
  xp: number;
  questsCompleted: number;
  streak: number;
  faction: string;
}

export function IdentityCard({
  address,
  level,
  xp,
  questsCompleted,
  streak,
  faction,
}: IdentityCardProps) {
  const tier = getTier(level);
  const tierColor = getTierColor(level);

  return (
    <div
      className="relative w-full max-w-md p-6 rounded-2xl border border-arena-border bg-gradient-to-br from-arena-card to-arena-bg overflow-hidden"
      style={{ boxShadow: `0 0 30px ${tierColor}20` }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${tierColor}, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Arena Identity
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatAddress(address)}
            </div>
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: tierColor }}
          >
            {level}
          </div>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 text-sm rounded-full font-medium"
            style={{
              backgroundColor: `${tierColor}20`,
              color: tierColor,
              border: `1px solid ${tierColor}40`,
            }}
          >
            {tier}
          </span>
          <span className="text-sm text-gray-400">
            {faction}
          </span>
        </div>

        {/* XP Bar */}
        <div className="mb-5">
          <XPBar xp={xp} level={level} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{formatXP(xp)}</div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
          <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{questsCompleted}</div>
            <div className="text-xs text-gray-500">Quests</div>
          </div>
          <div className="bg-arena-bg/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-arena-gold">{streak}🔥</div>
            <div className="text-xs text-gray-500">Streak</div>
          </div>
        </div>
      </div>

      {/* Avalanche branding */}
      <div className="absolute bottom-2 right-3 text-xs text-gray-600">
        🔺 AVALANCHE ARENA
      </div>
    </div>
  );
}
