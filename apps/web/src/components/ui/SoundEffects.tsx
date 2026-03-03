"use client";

import { useCallback, useRef, useState } from "react";

/**
 * UX Enhancement #12 — Sound Effects Toggle
 *
 * Lightweight sound effect system with user toggle.
 */

const SOUNDS = {
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  levelup: "/sounds/levelup.mp3",
  error: "/sounds/error.mp3",
} as const;

type SoundName = keyof typeof SOUNDS;

const SOUND_STORAGE_KEY = "arena-sound-enabled";

export function useSoundEffects() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SOUND_STORAGE_KEY) === "true";
  });

  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = useCallback(
    (sound: SoundName) => {
      if (!enabled) return;

      try {
        let audio = audioCache.current.get(sound);
        if (!audio) {
          audio = new Audio(SOUNDS[sound]);
          audio.volume = 0.3;
          audioCache.current.set(sound, audio);
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // Sound not available, fail silently
      }
    },
    [enabled]
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { enabled, toggle, play };
}

/**
 * Sound Toggle Button — can be placed in Navbar or Settings
 */
export function SoundToggle() {
  const { enabled, toggle } = useSoundEffects();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-arena-border hover:border-gray-500 transition-colors"
      aria-label={`Sound effects ${enabled ? "on" : "off"}`}
      title={`Sound effects: ${enabled ? "ON" : "OFF"}`}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
