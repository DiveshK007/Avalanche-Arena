"use client";

import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * GlowCard — Card with animated border glow and hover spotlight.
 * The border gradient follows mouse movement for a premium feel.
 */

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  borderRadius?: string;
  spotlight?: boolean;
}

export function GlowCard({
  children,
  className = "",
  glowColor = "rgba(232, 65, 66, 0.4)",
  borderRadius = "1rem",
  spotlight = true,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group ${className}`}
      style={{ borderRadius }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Animated border glow */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 40%)`
            : "none",
          borderRadius,
        }}
      />

      {/* Outer border */}
      <div
        className="absolute inset-0 rounded-[inherit] border border-arena-border group-hover:border-arena-accent/30 transition-colors duration-300"
        style={{ borderRadius }}
      />

      {/* Content */}
      <div className="relative bg-arena-card rounded-[inherit] overflow-hidden" style={{ borderRadius }}>
        {/* Spotlight effect */}
        {spotlight && isHovered && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232,65,66,0.06), transparent 60%)`,
            }}
          />
        )}
        {children}
      </div>
    </motion.div>
  );
}

/**
 * BentoCard — Variable-size card for Bento grid layouts.
 */
interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "1" | "2" | "full";
  glowColor?: string;
}

export function BentoCard({
  children,
  className = "",
  span = "1",
  glowColor,
}: BentoCardProps) {
  const spanClass = {
    "1": "",
    "2": "md:col-span-2",
    full: "md:col-span-full",
  }[span];

  return (
    <GlowCard className={`${spanClass} ${className}`} glowColor={glowColor}>
      {children}
    </GlowCard>
  );
}
