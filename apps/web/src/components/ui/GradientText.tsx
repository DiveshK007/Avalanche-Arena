"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * GradientText — Animated gradient text with shimmer effect.
 * Supports multiple gradient presets and custom gradients.
 */

const GRADIENT_PRESETS = {
  fire: "from-red-500 via-orange-400 to-yellow-300",
  ice: "from-blue-400 via-cyan-300 to-teal-200",
  arena: "from-arena-accent via-orange-400 to-yellow-300",
  purple: "from-purple-400 via-pink-400 to-red-400",
  rainbow: "from-red-500 via-yellow-300 via-green-400 via-blue-400 to-purple-500",
  gold: "from-yellow-200 via-yellow-400 to-amber-500",
  neon: "from-green-400 via-cyan-400 to-blue-500",
  avalanche: "from-[#e84142] via-[#ff6b35] to-[#f1c40f]",
} as const;

interface GradientTextProps {
  children: ReactNode;
  preset?: keyof typeof GRADIENT_PRESETS;
  className?: string;
  animate?: boolean;
  shimmer?: boolean;
}

export function GradientText({
  children,
  preset = "avalanche",
  className = "",
  animate = true,
  shimmer = true,
}: GradientTextProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span
        className={`bg-gradient-to-r ${GRADIENT_PRESETS[preset]} bg-clip-text text-transparent ${
          animate ? "animate-gradient-x bg-[length:200%_auto]" : ""
        }`}
      >
        {children}
      </span>
      {shimmer && (
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto] pointer-events-none"
          aria-hidden
        >
          {children}
        </span>
      )}
    </span>
  );
}

/**
 * TypewriterText — Types out text character by character.
 */
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
  delay?: number;
}

export function TypewriterText({
  text,
  speed = 50,
  className = "",
  cursor = true,
  delay = 0,
}: TypewriterProps) {
  return (
    <motion.span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * (speed / 1000), duration: 0.05 }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
      {cursor && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-arena-accent ml-0.5 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.span>
  );
}

/**
 * RevealText — Text reveals on scroll with clip-path animation.
 */
interface RevealTextProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}

export function RevealText({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: RevealTextProps) {
  const variants = {
    up: {
      hidden: { y: "100%", opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    down: {
      hidden: { y: "-100%", opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    left: {
      hidden: { x: "100%", opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
    right: {
      hidden: { x: "-100%", opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={variants[direction]}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          delay,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
