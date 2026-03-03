"use client";

import { getTier, getTierColor, formatXP, formatAddress, calculateXPProgress } from "@/lib/utils";
import { XPBar } from "./XPBar";
import { TiltCard } from "./ui/TiltCard";
import { ProgressRing } from "./ui/ProgressRing";
import { AnimatedCounter } from "./ui/AnimatedCounter";
import { motion } from "framer-motion";

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
  const xpProgress = calculateXPProgress(xp, level);

  return (
    <TiltCard className="w-full max-w-md" glareColor={`${tierColor}20`} maxTilt={10}>
      <div
        className="relative w-full p-6 rounded-2xl border border-arena-border bg-gradient-to-br from-arena-card via-arena-bg to-arena-card overflow-hidden"
        style={{ boxShadow: `0 0 40px ${tierColor}15, 0 0 80px ${tierColor}05` }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${tierColor}, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${tierColor}30 1px, transparent 1px), linear-gradient(90deg, ${tierColor}30 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Scan line */}
        <motion.div
          className="absolute inset-x-0 h-[1px]"
          style={{
            background: `linear-gradient(to right, transparent, ${tierColor}30, transparent)`,
          }}
          animate={{ top: ["-5%", "105%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1.5">
                Arena Identity
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {formatAddress(address)}
              </div>
            </div>
            {/* Progress ring around level */}
            <ProgressRing
              progress={xpProgress}
              size={60}
              strokeWidth={3}
              color={tierColor}
            >
              <motion.span
                className="text-xl font-bold"
                style={{ color: tierColor }}
                key={level}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {level}
              </motion.span>
            </ProgressRing>
          </div>

          {/* Tier badge */}
          <div className="flex items-center gap-3 mb-5">
            <motion.span
              className="px-3.5 py-1.5 text-sm rounded-full font-medium"
              style={{
                backgroundColor: `${tierColor}15`,
                color: tierColor,
                border: `1px solid ${tierColor}30`,
                boxShadow: `0 0 15px ${tierColor}10`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {tier}
            </motion.span>
            {faction && (
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
                {faction}
              </span>
            )}
          </div>

          {/* XP Bar */}
          <div className="mb-6">
            <XPBar xp={xp} level={level} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total XP",
                value: xp,
                formatFn: formatXP,
                color: "text-white",
                icon: "⚡",
              },
              {
                label: "Quests",
                value: questsCompleted,
                color: "text-white",
                icon: "📜",
              },
              {
                label: "Streak",
                value: streak,
                suffix: "🔥",
                color: "text-arena-gold",
                icon: "",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative bg-arena-bg/60 rounded-xl p-3 text-center border border-arena-border/30 group hover:border-arena-border/60 transition-colors"
              >
                <div className={`text-lg font-bold ${stat.color}`}>
                  {stat.icon && <span className="text-sm mr-0.5">{stat.icon}</span>}
                  <AnimatedCounter
                    value={stat.value}
                    formatFn={stat.formatFn}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[8px] text-gray-600">
          <span>🔺</span>
          <span className="tracking-widest">AVALANCHE ARENA</span>
        </div>
      </div>
    </TiltCard>
  );
}
