"use client";

import { useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * UX Enhancement #11 — 3D Tilt Effect
 *
 * Makes the identity card tilt based on mouse position.
 */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glareColor?: string;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glareColor = "rgba(255,255,255,0.1)",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setRotateX((y - 0.5) * -maxTilt * 2);
    setRotateY((x - 0.5) * maxTilt * 2);
    setGlarePos({ x: x * 100, y: y * 100 });
  }

  function handleMouseLeave() {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}
