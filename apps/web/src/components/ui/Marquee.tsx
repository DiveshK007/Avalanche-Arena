"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Marquee — Infinite horizontal scrolling ticker.
 * Great for showing logos, stats, or partner brands.
 */

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  gap?: string;
}

export function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className = "",
  gap = "2rem",
}: MarqueeProps) {
  const animDir = direction === "left" ? "-50%" : "0%";
  const animDirStart = direction === "left" ? "0%" : "-50%";

  return (
    <div
      className={`overflow-hidden ${pauseOnHover ? "[&:hover_.marquee-track]:pause" : ""} ${className}`}
    >
      <motion.div
        className="marquee-track flex"
        style={{ gap }}
        animate={{ x: [animDirStart, animDir] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        {/* Duplicate content for seamless loop */}
        <div className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * NumberTicker — Number that counts up with spring physics.
 * More dramatic than AnimatedCounter — includes scale bounce.
 */
interface NumberTickerProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  className = "",
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  return (
    <motion.span
      className={`inline-block tabular-nums ${className}`}
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      whileInView={{ scale: 1, opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.1,
      }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </motion.span>
    </motion.span>
  );
}

/**
 * Spotlight — Mouse-following spotlight gradient overlay.
 */
interface SpotlightProps {
  className?: string;
  size?: number;
}

export function Spotlight({ className = "", size = 400 }: SpotlightProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(${size}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(232,65,66,0.06), transparent 60%)`,
      }}
    />
  );
}
