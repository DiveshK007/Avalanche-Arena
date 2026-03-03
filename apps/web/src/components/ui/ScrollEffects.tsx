"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

/**
 * ParallaxSection — Scroll-driven parallax layers.
 */

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down";
}

export function ParallaxSection({
  children,
  className = "",
  speed = 0.3,
  direction = "up",
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yRange = direction === "up" ? [100 * speed, -100 * speed] : [-100 * speed, 100 * speed];
  const y = useTransform(scrollYProgress, [0, 1], yRange);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * ScrollReveal — Fade-in-up on scroll with configurable threshold.
 */
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  scale?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  distance = 40,
  scale = 1,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedBorder — Card with animated gradient border rotation.
 */
interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  gradient?: string;
}

export function AnimatedBorder({
  children,
  className = "",
  borderWidth = 1,
  gradient = "from-arena-accent via-purple-500 to-blue-500",
}: AnimatedBorderProps) {
  return (
    <div className={`relative p-[${borderWidth}px] rounded-xl ${className}`}>
      {/* Spinning gradient border */}
      <div
        className={`absolute inset-0 rounded-[inherit] bg-gradient-to-r ${gradient} animate-spin-slow opacity-50`}
        style={{
          padding: borderWidth,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        }}
      />
      {/* Content */}
      <div className="relative rounded-[inherit] bg-arena-card">{children}</div>
    </div>
  );
}

/**
 * Beam — Animated horizontal light beam.
 */
export function Beam({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-[1px] w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-arena-border to-transparent" />
      <motion.div
        className="absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-arena-accent to-transparent"
        animate={{ x: ["-25%", "125%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/**
 * CountdownTimer — Animated countdown with flip effect.
 */
interface CountdownProps {
  label: string;
  value: string | number;
  className?: string;
}

export function CountdownBlock({ label, value, className = "" }: CountdownProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        className="relative w-16 h-16 bg-arena-card border border-arena-border rounded-lg flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
        key={value}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {value}
        {/* Reflection line */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-arena-border/50" />
      </motion.div>
      <span className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );
}
