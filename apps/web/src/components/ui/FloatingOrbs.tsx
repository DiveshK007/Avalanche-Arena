"use client";

import { useEffect, useRef } from "react";

/**
 * FloatingOrbs — Large, dreamy gradient orbs that float and morph.
 * Creates an ambient aurora-like background effect.
 */

interface OrbConfig {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  phase: number;
}

interface FloatingOrbsProps {
  className?: string;
  count?: number;
  colors?: string[];
  blur?: number;
  opacity?: number;
}

export function FloatingOrbs({
  className = "",
  count = 4,
  colors = [
    "rgba(232, 65, 66, 0.15)",
    "rgba(74, 158, 255, 0.12)",
    "rgba(155, 89, 182, 0.12)",
    "rgba(241, 196, 15, 0.1)",
  ],
  blur = 80,
  opacity = 1,
}: FloatingOrbsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let orbs: OrbConfig[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function createOrbs() {
      if (!canvas) return;
      orbs = [];
      for (let i = 0; i < count; i++) {
        orbs.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 150 + Math.random() * 200,
          color: colors[i % colors.length],
          speed: 0.2 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.003;

      for (const orb of orbs) {
        const x = orb.x + Math.sin(time * orb.speed + orb.phase) * 100;
        const y = orb.y + Math.cos(time * orb.speed * 0.7 + orb.phase) * 80;

        // Morphing radius
        const r = orb.radius + Math.sin(time * 1.5 + orb.phase) * 30;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, "0.05)"));
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    createOrbs();
    draw();

    window.addEventListener("resize", () => {
      resize();
      createOrbs();
    });

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [count, colors, blur, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        width: "100%",
        height: "100%",
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  );
}
