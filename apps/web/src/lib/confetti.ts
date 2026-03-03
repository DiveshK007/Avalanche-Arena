"use client";

import confetti from "canvas-confetti";

/**
 * UX Enhancement #3 — Confetti / Particle Effects on Milestones
 *
 * Fire confetti when quests are completed, achievements unlocked, or level ups happen.
 */

export function fireConfetti(options?: confetti.Options) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#e84142", "#f1c40f", "#50c878", "#4a9eff", "#9b59b6"],
    ...options,
  });
}

export function fireQuestComplete() {
  // Burst from center
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.5, x: 0.5 },
    colors: ["#e84142", "#f1c40f", "#50c878"],
    startVelocity: 30,
  });
}

export function fireLevelUp() {
  // Double burst from sides
  const defaults = {
    spread: 55,
    ticks: 80,
    gravity: 1,
    decay: 0.94,
    startVelocity: 35,
    colors: ["#f1c40f", "#ff6b35", "#e84142"],
  };

  confetti({ ...defaults, particleCount: 50, origin: { x: 0.2, y: 0.6 } });
  confetti({ ...defaults, particleCount: 50, origin: { x: 0.8, y: 0.6 } });
}

export function fireAchievementUnlocked() {
  // Star-shaped burst
  const count = 120;
  const defaults = {
    origin: { y: 0.5 },
    colors: ["#f1c40f", "#ff6b35", "#9b59b6", "#e84142"],
  };

  confetti({
    ...defaults,
    particleCount: count,
    spread: 100,
    startVelocity: 40,
    shapes: ["star", "circle"],
  });
}

export function fireMintSuccess() {
  // Prolonged celebration
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#e84142", "#4a9eff", "#50c878"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f1c40f", "#9b59b6", "#ff6b35"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
