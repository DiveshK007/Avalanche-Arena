"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { InteractiveParticles } from "@/components/ui/InteractiveParticles";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { GlowCard } from "@/components/ui/GlowCard";
import { GradientText, RevealText } from "@/components/ui/GradientText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Marquee } from "@/components/ui/Marquee";
import { AnimatedStat } from "@/components/ui/AnimatedCounter";
import { ScrollReveal, Beam } from "@/components/ui/ScrollEffects";
import { StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PrefetchLink } from "@/components/ui/PrefetchLink";

/* ─────────────────────────────── Data ─────────────────────────────── */

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "🎮",
    title: "Play Games",
    desc: "Complete quests across multiple Avalanche games and dApps. Each game contributes to your universal progression.",
    color: "#e84142",
  },
  {
    step: "02",
    icon: "🔗",
    title: "Verified On-Chain",
    desc: "Every action is captured via blockchain events — no faking it. Proofs are validated by our smart contracts.",
    color: "#4a9eff",
  },
  {
    step: "03",
    icon: "⚡",
    title: "Earn XP & Level Up",
    desc: "Accumulate XP, unlock badges, and climb the leaderboard. Your reputation persists across the entire ecosystem.",
    color: "#f1c40f",
  },
  {
    step: "04",
    icon: "🎭",
    title: "Evolve Identity",
    desc: "Your dynamic NFT evolves as you progress — visual tier, faction allegiance, and on-chain metadata all update automatically.",
    color: "#9b59b6",
  },
];

const FEATURES = [
  {
    icon: "🏆",
    title: "Cross-Game Leaderboard",
    desc: "A single, unified ranking across every game in the ecosystem.",
    gradient: "from-yellow-500/10 to-orange-500/10",
  },
  {
    icon: "🎯",
    title: "Smart Quest System",
    desc: "Quests that verify completion through on-chain events — no middleman needed.",
    gradient: "from-red-500/10 to-pink-500/10",
  },
  {
    icon: "🛡️",
    title: "Dynamic Identity NFT",
    desc: "An on-chain SVG that evolves with your level, tier, and faction allegiance.",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: "⚔️",
    title: "Faction Wars",
    desc: "Choose your faction and fight for dominance across the Avalanche ecosystem.",
    gradient: "from-purple-500/10 to-violet-500/10",
  },
  {
    icon: "🏅",
    title: "Achievement System",
    desc: "Unlock rare achievements for reaching milestones across multiple games.",
    gradient: "from-green-500/10 to-emerald-500/10",
  },
  {
    icon: "🔥",
    title: "Streak Rewards",
    desc: "Maintain daily activity streaks for bonus XP multipliers and exclusive rewards.",
    gradient: "from-orange-500/10 to-amber-500/10",
  },
];

const TIERS = [
  { name: "Novice", range: "0-2", color: "#4a9eff", icon: "🔵" },
  { name: "Adventurer", range: "3-5", color: "#50c878", icon: "🟢" },
  { name: "Warrior", range: "6-9", color: "#ff6b35", icon: "🟠" },
  { name: "Champion", range: "10-14", color: "#9b59b6", icon: "🟣" },
  { name: "Legend", range: "15-24", color: "#f1c40f", icon: "⭐" },
  { name: "Mythic", range: "25+", color: "#e84142", icon: "💎" },
];

const COMPARISON = [
  { feature: "Ownership", trad: "Platform owns", arena: "You own everything", icon: "🔐" },
  { feature: "Cross-game", trad: "Siloed per game", arena: "Unified progression", icon: "🌐" },
  { feature: "Verification", trad: "Trust-based / faked", arena: "On-chain proofs", icon: "✅" },
  { feature: "Identity", trad: "Static profile pic", arena: "Evolving dynamic NFT", icon: "🎭" },
  { feature: "Transferable", trad: "Locked forever", arena: "Wallet-based portable", icon: "💼" },
  { feature: "Governance", trad: "None", arena: "DAO voting rights", icon: "🗳️" },
];

const TECH_STACK = [
  "Avalanche C-Chain",
  "Solidity",
  "OpenZeppelin",
  "Hardhat",
  "Next.js 14",
  "wagmi v2",
  "viem",
  "RainbowKit",
  "PostgreSQL",
  "Redis",
  "WebSocket",
  "IPFS",
];

/* ─────────────────────────── Components ────────────────────────── */

function FloatingBadge({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute px-3 py-1.5 bg-arena-card/80 border border-arena-border/50 rounded-full text-xs backdrop-blur-sm ${className}`}
      animate={{
        y: [0, -10, 0],
        rotate: [-2, 2, -2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

function HeroMockCard() {
  return (
    <motion.div
      className="relative w-72 h-96 mx-auto"
      initial={{ opacity: 0, rotateY: -15, rotateX: 5 }}
      animate={{ opacity: 1, rotateY: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
    >
      {/* Card */}
      <motion.div
        className="w-full h-full rounded-2xl border border-arena-border bg-gradient-to-br from-arena-card via-arena-bg to-arena-card p-6 relative overflow-hidden"
        animate={{
          rotateY: [0, 3, -3, 0],
          rotateX: [0, -2, 2, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          boxShadow: "0 25px 50px -12px rgba(232, 65, 66, 0.15), 0 0 60px -15px rgba(232, 65, 66, 0.1)",
        }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-arena-accent/5 via-transparent to-purple-500/5" />

        {/* Animated scan line */}
        <motion.div
          className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-arena-accent/50 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-3">Arena Identity</div>
          <div className="text-sm font-mono text-white mb-1">0xAb5C...8F3e</div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#f1c40f]/20 text-[#f1c40f] border border-[#f1c40f]/30">
              Legend
            </span>
            <span className="text-[10px] text-gray-500">⚡ Frostborn</span>
          </div>

          {/* Mock level ring */}
          <div className="flex justify-center mb-4 relative">
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="35" fill="none" stroke="#1e1e2e" strokeWidth="4" />
              <motion.circle
                cx="40" cy="40" r="35" fill="none" stroke="#f1c40f" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={220}
                initial={{ strokeDashoffset: 220 }}
                animate={{ strokeDashoffset: 50 }}
                transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 6px rgba(241, 196, 15, 0.4))" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#f1c40f]">18</div>
          </div>

          {/* XP Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Level 18</span>
              <span>28,450 / 36,100 XP</span>
            </div>
            <div className="h-2 bg-arena-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#f1c40f] to-[#ff6b35]"
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                style={{ boxShadow: "0 0 10px rgba(241, 196, 15, 0.4)" }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "XP", value: "28.4K", color: "text-[#f1c40f]" },
              { label: "Quests", value: "142", color: "text-white" },
              { label: "Streak", value: "23🔥", color: "text-orange-400" },
            ].map((s) => (
              <div key={s.label} className="bg-arena-bg/60 rounded-lg p-2 text-center">
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Corner decoration */}
        <div className="absolute bottom-2 right-3 text-[8px] text-gray-600">🔺 AVALANCHE ARENA</div>
      </motion.div>

      {/* Floating badges around the card */}
      <FloatingBadge className="-top-4 -left-16 text-green-400" delay={0}>
        ✅ Quest Complete +250 XP
      </FloatingBadge>
      <FloatingBadge className="top-20 -right-20 text-yellow-400" delay={1.5}>
        ⭐ Level Up! → Legend
      </FloatingBadge>
      <FloatingBadge className="bottom-12 -left-14 text-purple-400" delay={3}>
        🏅 Achievement Unlocked
      </FloatingBadge>
    </motion.div>
  );
}

/* ──────────────────────────── Main Page ──────────────────────────── */

export function LandingContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  // Animated word rotation
  const ROTATING_WORDS = ["Character", "Identity", "Legend", "Reputation"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Background layers */}
        <div className="absolute inset-0">
          <FloatingOrbs opacity={0.6} />
          <InteractiveParticles className="z-10" />
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.8)_70%)]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(232,65,66,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(232,65,66,0.3) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-arena-accent/10 border border-arena-accent/20 rounded-full text-arena-accent text-xs font-medium mb-8"
                  animate={{ borderColor: ["rgba(232,65,66,0.2)", "rgba(232,65,66,0.5)", "rgba(232,65,66,0.2)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="w-2 h-2 rounded-full bg-arena-accent animate-pulse" />
                  Cross-Game Progression Protocol
                </motion.div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
                  Your Wallet
                  <br />
                  Is Your{" "}
                  <span className="relative inline-block min-w-[200px]">
                    <motion.span
                      key={wordIndex}
                      initial={{ y: 40, opacity: 0, rotateX: -45 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -40, opacity: 0, rotateX: 45 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="inline-block"
                    >
                      <GradientText preset="avalanche" className="inline">
                        {ROTATING_WORDS[wordIndex]}
                      </GradientText>
                    </motion.span>
                    {/* Underline decoration */}
                    <motion.svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 200 8"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.8 }}
                    >
                      <motion.path
                        d="M 0 4 Q 50 0, 100 4 Q 150 8, 200 4"
                        fill="none"
                        stroke="url(#underline-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                      />
                      <defs>
                        <linearGradient id="underline-gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#e84142" />
                          <stop offset="50%" stopColor="#ff6b35" />
                          <stop offset="100%" stopColor="#f1c40f" />
                        </linearGradient>
                      </defs>
                    </motion.svg>
                  </span>
                </h1>

                {/* Subtitle */}
                <motion.p
                  className="text-lg sm:text-xl text-gray-400 max-w-lg mb-10 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Avalanche Arena turns on-chain activity into progression —{" "}
                  <span className="text-gray-200">level up across every game</span> in the
                  Avalanche ecosystem.
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                  className="flex flex-wrap items-center gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <MagneticButton strength={0.2}>
                    <PrefetchLink
                      href="/dashboard"
                      className="relative inline-flex items-center gap-2 bg-arena-accent text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-arena-accent/90 transition-all group overflow-hidden"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <span className="relative">Enter Arena</span>
                      <motion.span
                        className="relative"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </PrefetchLink>
                  </MagneticButton>

                  <MagneticButton strength={0.2}>
                    <PrefetchLink
                      href="/quests"
                      className="inline-flex items-center gap-2 border border-arena-border text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-arena-card hover:border-arena-accent/30 transition-all"
                    >
                      Browse Quests
                    </PrefetchLink>
                  </MagneticButton>
                </motion.div>

                {/* Social proof */}
                <motion.div
                  className="flex items-center gap-6 mt-10 text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {["🔴", "🔵", "🟢", "🟡"].map((e, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-arena-card border-2 border-arena-bg flex items-center justify-center text-xs">
                          {e}
                        </div>
                      ))}
                    </div>
                    <span>Active Players</span>
                  </div>
                  <div className="w-px h-4 bg-arena-border" />
                  <div>Built on Avalanche</div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right — 3D Card */}
            <div className="hidden lg:block">
              <HeroMockCard />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-xs text-gray-500">Scroll to explore</span>
          <motion.div
            className="w-6 h-10 border-2 border-arena-border rounded-full flex justify-center pt-2"
            animate={{ borderColor: ["rgba(30,30,46,1)", "rgba(232,65,66,0.3)", "rgba(30,30,46,1)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-1.5 bg-arena-accent rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══════════════ TECH MARQUEE ═══════════════ */}
      <section className="relative py-8 border-y border-arena-border/50 overflow-hidden bg-arena-bg/50">
        <Marquee speed={40} className="opacity-40">
          {TECH_STACK.map((tech) => (
            <span key={tech} className="text-sm text-gray-400 font-mono whitespace-nowrap px-4">
              {tech}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <FloatingOrbs count={2} opacity={0.3} blur={120} colors={["rgba(74,158,255,0.1)", "rgba(155,89,182,0.1)"]} />

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-20">
              <span className="text-arena-accent text-sm font-medium uppercase tracking-widest">How It Works</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
                From <GradientText preset="avalanche">Zero to Legend</GradientText> in Four Steps
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Play games, earn XP, evolve your identity — all tracked and verified on-chain.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <GlowCard glowColor={`${item.color}40`}>
                  <div className="p-6 h-full">
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl">{item.icon}</span>
                      <span className="text-4xl font-bold text-arena-border/40">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>

                    {/* Bottom accent line */}
                    <motion.div
                      className="mt-6 h-[2px] rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: "40%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    />
                  </div>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Beam />

      {/* ═══════════════ FEATURES BENTO GRID ═══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-20">
              <span className="text-arena-accent text-sm font-medium uppercase tracking-widest">Features</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
                Everything You Need to{" "}
                <GradientText preset="fire">Dominate</GradientText>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <GlowCard>
                  <div className={`p-8 h-full bg-gradient-to-br ${feat.gradient}`}>
                    <motion.div
                      className="text-4xl mb-4"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {feat.icon}
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-3">{feat.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Beam />

      {/* ═══════════════ TIER SYSTEM ═══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-20">
              <span className="text-arena-accent text-sm font-medium uppercase tracking-widest">Progression</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
                Six Tiers of <GradientText preset="gold">Glory</GradientText>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Every level pushes you toward a new tier. Each tier unlocks new visual styles for your Identity NFT.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TIERS.map((tier, i) => (
              <ScrollReveal key={i} delay={i * 0.08} scale={0.9}>
                <motion.div
                  className="relative p-6 rounded-2xl border border-arena-border bg-arena-card text-center cursor-default group overflow-hidden"
                  whileHover={{
                    scale: 1.05,
                    borderColor: tier.color + "60",
                    boxShadow: `0 0 30px ${tier.color}20`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="text-3xl mb-3">{tier.icon}</div>
                  <div className="font-bold text-sm mb-1" style={{ color: tier.color }}>
                    {tier.name}
                  </div>
                  <div className="text-[10px] text-gray-500">Lv. {tier.range}</div>

                  {/* Glow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${tier.color}10, transparent 70%)`,
                    }}
                  />
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Beam />

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "∞", label: "Games Supported", icon: "🎮" },
              { value: "0→100", label: "Level Range", icon: "📈" },
              { value: 6, label: "Tier Ranks", icon: "🏆" },
              { value: "100%", label: "On-Chain", icon: "⛓️" },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <motion.div
                  className="relative p-8 text-center bg-arena-card border border-arena-border rounded-2xl group"
                  whileHover={{ borderColor: "rgba(232,65,66,0.3)" }}
                >
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {typeof stat.value === "number" ? (
                      <AnimatedStat value={stat.value} label="" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <Beam />

      {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-arena-accent text-sm font-medium uppercase tracking-widest">Why Arena</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4">
                Traditional vs{" "}
                <GradientText preset="avalanche">Arena</GradientText>
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {COMPARISON.map((row, i) => (
              <ScrollReveal key={i} delay={i * 0.06}>
                <div className="grid grid-cols-[2fr_3fr_3fr] gap-4 items-center p-4 rounded-xl bg-arena-card border border-arena-border/50 hover:border-arena-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{row.icon}</span>
                    <span className="font-medium text-white text-sm">{row.feature}</span>
                  </div>
                  <div className="text-sm text-gray-500 text-center line-through decoration-gray-700">
                    {row.trad}
                  </div>
                  <div className="text-sm text-arena-green text-center font-medium">
                    ✅ {row.arena}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Beam />

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <FloatingOrbs count={3} opacity={0.4} blur={100} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <motion.div
              className="text-6xl mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔺
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to{" "}
              <GradientText preset="avalanche">Level Up</GradientText>?
            </h2>

            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Connect your wallet and start building your cross-game identity on the
              fastest chain in crypto.
            </p>

            <MagneticButton strength={0.15}>
              <PrefetchLink
                href="/dashboard"
                className="relative inline-flex items-center gap-3 bg-arena-accent text-white px-12 py-5 rounded-2xl font-medium text-xl hover:bg-arena-accent/90 transition-all group overflow-hidden shadow-lg shadow-arena-accent/20"
              >
                {/* Animated shine */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="relative">Connect Wallet & Enter Arena</span>
                <motion.span
                  className="relative text-2xl"
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
              </PrefetchLink>
            </MagneticButton>

            {/* Trust signals */}
            <motion.div
              className="flex items-center justify-center gap-8 mt-12 text-xs text-gray-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <span>🔒 Non-Custodial</span>
              <span className="w-1 h-1 rounded-full bg-arena-border" />
              <span>⚡ Avalanche C-Chain</span>
              <span className="w-1 h-1 rounded-full bg-arena-border" />
              <span>🛡️ Open Source</span>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
