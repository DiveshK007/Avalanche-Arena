"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

/**
 * UX Enhancement #4 — Animated Number Counters
 *
 * Smoothly animates numbers when they enter the viewport.
 */

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  formatFn?: (n: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
  formatFn,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionVal, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (formatFn) {
          setDisplay(formatFn(latest));
        } else if (decimals > 0) {
          setDisplay(latest.toFixed(decimals));
        } else {
          setDisplay(Math.round(latest).toLocaleString());
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, decimals, formatFn, motionVal]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/**
 * Animated stat block — number with label, animates on scroll
 */
interface AnimatedStatProps {
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function AnimatedStat({
  value,
  label,
  prefix,
  suffix,
  className = "",
  valueClassName = "text-3xl font-bold text-arena-accent",
  labelClassName = "text-sm text-gray-500",
}: AnimatedStatProps) {
  const isNumber = typeof value === "number";

  return (
    <motion.div
      className={`p-6 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className={valueClassName}>
        {isNumber ? (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        ) : (
          `${prefix || ""}${value}${suffix || ""}`
        )}
      </div>
      <div className={labelClassName}>{label}</div>
    </motion.div>
  );
}
