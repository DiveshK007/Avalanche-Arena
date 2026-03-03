"use client";

import { useEffect, useRef } from "react";

/**
 * AnimatedGridBackground — Subtle animated dot-grid background
 * with glowing intersection highlights and pulse waves.
 */

interface AnimatedGridProps {
  className?: string;
  dotColor?: string;
  glowColor?: string;
  dotSize?: number;
  gap?: number;
}

export function AnimatedGridBackground({
  className = "",
  dotColor = "rgba(232, 65, 66, 0.15)",
  glowColor = "rgba(232, 65, 66, 0.3)",
  dotSize = 1,
  gap = 40,
}: AnimatedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Proximity glow
          const proximity = Math.max(0, 1 - dist / 200);

          // Subtle pulse wave
          const wave = Math.sin(time * 2 + (x + y) * 0.01) * 0.3 + 0.7;

          const size = dotSize + proximity * 3;
          const alpha = (0.15 + proximity * 0.6) * wave;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);

          if (proximity > 0.1) {
            ctx.fillStyle = glowColor.replace("0.3", String(alpha));
            // Draw glow
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = proximity * 15;
          } else {
            ctx.fillStyle = dotColor.replace("0.15", String(0.08 + wave * 0.07));
            ctx.shadowBlur = 0;
          }

          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [dotColor, glowColor, dotSize, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
