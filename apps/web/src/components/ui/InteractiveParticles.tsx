"use client";

import { useRef, useEffect } from "react";

/**
 * InteractiveParticles — Upgraded particle system with:
 * - Mouse-interactive constellation nodes
 * - Color-shifting particles based on proximity
 * - Glowing pulse waves originating from cursor
 * - Connection lines with gradient opacity
 * - Different particle sizes and speeds
 */

interface InteractiveParticlesProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  mouseRadius?: number;
  colors?: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  r: number;
  alpha: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

export function InteractiveParticles({
  className = "",
  particleCount = 80,
  connectionDistance = 150,
  mouseRadius = 200,
  colors = [
    "232, 65, 66",   // Avalanche red
    "74, 158, 255",   // Blue
    "155, 89, 182",   // Purple
    "241, 196, 15",   // Gold
    "80, 200, 120",   // Green
  ],
}: InteractiveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const clickRef = useRef({ x: -1000, y: -1000, time: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let time = 0;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }

    function createParticles() {
      if (!canvas) return;
      particles = [];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.min(particleCount, Math.floor((w * h) / 10000));

      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = (Math.random() - 0.5) * 0.5;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx,
          vy,
          baseVx: vx,
          baseVy: vy,
          r: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      time += 1;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Click wave effect
      const clickAge = (time - clickRef.current.time);
      const clickWaveRadius = clickAge * 3;
      const clickWaveAlpha = Math.max(0, 1 - clickAge / 60);

      if (clickWaveAlpha > 0) {
        ctx.beginPath();
        ctx.arc(clickRef.current.x, clickRef.current.y, clickWaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 65, 66, ${clickWaveAlpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update and draw particles
      for (const p of particles) {
        // Mouse interaction — push particles away
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.15;
          p.vy += Math.sin(angle) * force * 0.15;
        }

        // Click wave push
        if (clickWaveAlpha > 0) {
          const cdx = p.x - clickRef.current.x;
          const cdy = p.y - clickRef.current.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (Math.abs(cdist - clickWaveRadius) < 30 && cdist > 0) {
            const angle = Math.atan2(cdy, cdx);
            p.vx += Math.cos(angle) * clickWaveAlpha * 2;
            p.vy += Math.sin(angle) * clickWaveAlpha * 2;
          }
        }

        // Damping — return to base velocity
        p.vx += (p.baseVx - p.vx) * 0.02;
        p.vy += (p.baseVy - p.vy) * 0.02;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Pulsing alpha
        const pulse = Math.sin(p.pulsePhase + time * p.pulseSpeed) * 0.3 + 0.7;
        const drawAlpha = p.alpha * pulse;

        // Proximity color shift — brighter near mouse
        const proximityBoost = dist < mouseRadius ? (1 - dist / mouseRadius) * 0.5 : 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + proximityBoost * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${drawAlpha + proximityBoost})`;
        ctx.fill();

        // Glow for larger particles near mouse
        if (proximityBoost > 0.1 && p.r > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${proximityBoost * 0.15})`;
          ctx.fill();
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.15;

            // Brighter connections near mouse
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const mouseDist = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
            const mouseBoost = mouseDist < mouseRadius ? (1 - mouseDist / mouseRadius) * 0.2 : 0;

            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(${particles[i].color}, ${lineAlpha + mouseBoost})`);
            gradient.addColorStop(1, `rgba(${particles[j].color}, ${lineAlpha + mouseBoost})`);

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5 + mouseBoost * 2;
            ctx.stroke();
          }
        }
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const mouseGlow = ctx.createRadialGradient(mx, my, 0, mx, my, mouseRadius * 0.5);
        mouseGlow.addColorStop(0, "rgba(232, 65, 66, 0.03)");
        mouseGlow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(mx, my, mouseRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handleClick(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      clickRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, time };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", () => { resize(); createParticles(); });
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [particleCount, connectionDistance, mouseRadius, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
