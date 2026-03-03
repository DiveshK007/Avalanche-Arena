"use client";

import { useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * MagneticButton — Button that magnetically pulls toward cursor on hover.
 * Creates a satisfying, premium interaction feel.
 */

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "button" | "a" | "div";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  as = "button",
  href,
  onClick,
  disabled,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setPosition({ x, y });
  }

  function handleMouseLeave() {
    setPosition({ x: 0, y: 0 });
  }

  const MotionComp = motion.div;

  return (
    <MotionComp
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {as === "a" ? (
        <a href={href} onClick={onClick} className="block">
          {children}
        </a>
      ) : (
        <button onClick={onClick} disabled={disabled} className="block">
          {children}
        </button>
      )}
    </MotionComp>
  );
}

/**
 * PulseButton — Button with animated pulsing ring effect.
 */
interface PulseButtonProps {
  children: ReactNode;
  className?: string;
  pulseColor?: string;
  onClick?: () => void;
  href?: string;
}

export function PulseButton({
  children,
  className = "",
  pulseColor = "rgba(232, 65, 66, 0.4)",
  onClick,
  href,
}: PulseButtonProps) {
  const Wrapper = href ? "a" : "button";

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {/* Pulse rings */}
      <span
        className="absolute inset-0 rounded-[inherit] animate-ping-slow"
        style={{ backgroundColor: pulseColor, opacity: 0 }}
      />
      <span
        className="absolute inset-0 rounded-[inherit] animate-ping-slower"
        style={{ backgroundColor: pulseColor, opacity: 0 }}
      />
      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </Wrapper>
  );
}
