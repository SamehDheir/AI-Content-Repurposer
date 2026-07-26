"use client";
import { useEffect, useRef } from "react";

/**
 * Writes document scroll position as 0…1 into `--scroll-progress` on the
 * returned element, once per animation frame.
 *
 * It deliberately does not return the number. This drives a single transform,
 * and as React state it re-rendered its whole consumer — the site header, with
 * its nav, four section links and buttons — on every frame of every scroll. A
 * CSS variable set through the ref reaches the same style with no render at
 * all. Read it as `transform: scaleX(var(--scroll-progress, 0))`.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.setProperty("--scroll-progress", progress.toFixed(4));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return ref;
}
