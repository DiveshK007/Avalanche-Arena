"use client";

import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { AnimatedStat } from "@/components/ui/AnimatedCounter";
import { StaggerContainer, StaggerItem } from "@/components/ui/PageTransition";
import { PrefetchLink } from "@/components/ui/PrefetchLink";

/**
 * Landing page content — client component with all UX enhancements:
 * #1 Page transitions, #5 Particle background, #4 Animated counters,
 * #24 Prefetch on hover
 */

const HOW_IT_WORKS = [
  {
    icon: "🎮",
    title: "Play Games",
    desc: "Complete quests across multiple Avalanche games and dApps.",
  },
  {
    icon: "✅",
    title: "Verified On-Chain",
    desc: "Every action is verified through blockchain events — no faking it.",
  },
  {
    icon: "⚡",
    title: "Earn XP & Level Up",
    desc: "Accumulate XP, unlock badges, and climb the leaderboard.",
  },
  {
    icon: "🎭",
    title: "Evolve Identity",
    desc: "Your dynamic NFT evolves based on your cross-game achievements.",
  },
];

const COMPARISON = [
  ["Ownership", "Platform owns", "You own"],
  ["Cross-game", "❌ Siloed", "✅ Unified"],
  ["Verification", "Trust-based", "On-chain proof"],
  ["Identity", "Static profile", "Evolving NFT"],
  ["Transferable", "❌ Locked", "✅ Wallet-based"],
];

export function LandingContent() {
  return (
    <div className="min-h-screen">
      {/* Hero Section — with particle background (#5) */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-arena-accent/5 via-transparent to-transparent" />
        <ParticleBackground />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            className="text-arena-accent text-sm font-medium uppercase tracking-widest mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Cross-Game Progression Protocol
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Wallet Is Your{" "}
            <span className="text-arena-accent">Character</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Avalanche Arena turns on-chain activity into progression — level up
            across every game in the Avalanche ecosystem.
          </p>

          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PrefetchLink
              href="/dashboard"
              className="bg-arena-accent text-white px-8 py-3 rounded-lg font-medium hover:bg-arena-accent/80 transition-all hover:shadow-lg hover:shadow-arena-accent/20"
            >
              Enter Arena
            </PrefetchLink>
            <PrefetchLink
              href="/quests"
              className="border border-arena-border text-white px-8 py-3 rounded-lg font-medium hover:bg-arena-card transition-all"
            >
              Browse Quests
            </PrefetchLink>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works — with stagger animation (#1) */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl font-bold text-white text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-gray-400 text-center mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Play games, earn XP, evolve your identity — all tracked on-chain.
          </motion.p>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <StaggerItem key={i}>
                <div className="p-6 bg-arena-card rounded-xl border border-arena-border hover:border-arena-accent/30 transition-all hover:-translate-y-1 duration-300 h-full">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats — with animated counters (#4) */}
      <section className="py-20 px-6 border-t border-arena-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <AnimatedStat value="∞" label="Games Supported" />
            <AnimatedStat value="0→100" label="Level Range" />
            <AnimatedStat value={6} label="Tier Ranks" />
            <AnimatedStat value="100%" label="On-Chain" />
          </div>
        </div>
      </section>

      {/* Comparison — with row animations (#15) */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl font-bold text-white text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Why Arena Is Different
          </motion.h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-arena-border text-gray-500">
                  <th className="py-3 px-4 text-left">Feature</th>
                  <th className="py-3 px-4 text-center">Traditional</th>
                  <th className="py-3 px-4 text-center text-arena-accent">Arena</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([feature, trad, arena], i) => (
                  <motion.tr
                    key={i}
                    className="border-b border-arena-border/30"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <td className="py-3 px-4 text-white">{feature}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{trad}</td>
                    <td className="py-3 px-4 text-center text-arena-green">{arena}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA — with entrance animation */}
      <motion.section
        className="py-20 px-6 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Level Up?
          </h2>
          <p className="text-gray-400 mb-8">
            Connect your wallet and start building your cross-game identity.
          </p>
          <PrefetchLink
            href="/dashboard"
            className="inline-block bg-arena-accent text-white px-10 py-4 rounded-xl font-medium text-lg hover:bg-arena-accent/80 transition-all hover:shadow-lg hover:shadow-arena-accent/20 animate-glow"
          >
            Connect Wallet & Enter Arena
          </PrefetchLink>
        </div>
      </motion.section>
    </div>
  );
}
