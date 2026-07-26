"use client";
import { useEffect, useRef } from "react";

/**
 * Parks the decorative animations inside an element while it is off screen.
 *
 * The front page is drawn with a lot of small infinite animations — waveform
 * bars, wire pulses, marquees — and a browser keeps recomputing every one of
 * them whether or not it is in the viewport. Reading down the page meant the
 * hero's splitter, the ticker and every pipeline figure were all still burning
 * frames behind you.
 *
 * Marking the container flips `animation-play-state` for its whole subtree (see
 * `[data-motion="idle"]` in globals.css), so a paused animation resumes exactly
 * where it left off rather than restarting. Like `useReveal`, every gated
 * element shares one IntersectionObserver.
 *
 * Nothing is gated until the observer's first callback, so an element that is
 * visible on load animates from the first paint, and a page that never
 * hydrates keeps its motion.
 */
let shared: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  shared ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement | SVGElement;
        el.dataset.motion = entry.isIntersecting ? "live" : "idle";
      }
    },
    // A margin either side, so motion is already running by the time the
    // element is scrolled into view rather than starting under the reader.
    { rootMargin: "150px 0px" },
  );
  return shared;
}

/** @param animated pass false when the element has no animation to gate. */
export function useMotionGate<T extends Element>(animated = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animated) return;

    const io = observer();
    io.observe(el);
    return () => io.unobserve(el);
  }, [animated]);

  return ref;
}
