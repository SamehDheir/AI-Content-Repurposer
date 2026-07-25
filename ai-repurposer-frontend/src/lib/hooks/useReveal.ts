"use client";
import { useEffect, useRef } from "react";

/**
 * Scroll reveals. Every `[data-reveal]` element shares one IntersectionObserver
 * rather than allocating one per node — a long page has a few hundred of them.
 * The reveal is one-way: once an element has been read it stays visible.
 */
let shared: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  shared ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("revealed");
        shared?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );
  return shared;
}

export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--reveal-delay", `${delay}ms`);

    // An element already in view on load (the masthead) should not wait for a
    // scroll event that may never come.
    const io = observer();
    io.observe(el);
    return () => io.unobserve(el);
  }, [delay]);

  return ref;
}
