"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>*#";

/**
 * Resolves `text` one character at a time out of random glyphs, the way a
 * timecode display settles. Returns the frame to render plus a `run` trigger
 * so it can be replayed on hover.
 */
export function useScramble(text: string, { auto = false, speed = 28 } = {}) {
  const [frame, setFrame] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const run = useCallback(() => {
    stop();
    let tick = 0;
    timer.current = setInterval(() => {
      tick += 1;
      // Two ticks per character keeps short strings from resolving instantly.
      const settled = Math.floor(tick / 2);
      if (settled >= text.length) {
        setFrame(text);
        stop();
        return;
      }
      const scrambled = text
        .slice(settled)
        .split("")
        .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join("");
      setFrame(text.slice(0, settled) + scrambled);
    }, speed);
  }, [text, speed, stop]);

  useEffect(() => {
    if (auto) run();
    return stop;
  }, [auto, run, stop]);

  return { frame, run };
}
