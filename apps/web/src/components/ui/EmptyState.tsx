"use client";

import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ReactNode } from "react";

/**
 * UX Enhancement #9 — Illustrated Empty States with Connect Wallet
 *
 * Rich, animated empty states for disconnected users.
 */

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  showConnect?: boolean;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  showConnect = true,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto py-16 text-center"
    >
      {/* Animated icon with floating effect */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-6xl mb-6"
      >
        {icon}
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>

      {showConnect && (
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      )}

      {children}

      {/* Decorative dots */}
      <div className="flex justify-center gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-arena-accent/30"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
